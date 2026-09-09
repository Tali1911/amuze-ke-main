// process-marketing-automations
// Cron-invoked worker that advances active enrollments in marketing_automations.
//
// Step shapes (steps: jsonb[]):
//   { type: "send_email", template_id?: uuid, subject?: string,
//     body_html?: string, from_name?: string }
//   { type: "wait", days?: number, hours?: number, minutes?: number }
//   { type: "add_tag", tag: string }
//
// Triggers (handled by SQL triggers / time scan):
//   lead_created, registration_created, attendance_marked,
//   time_based (days_since_last_booking | birthday_today | abandoned_registration_minutes)
//
// Auth: callable by cron (X-Internal-Secret matches SUPABASE_SERVICE_ROLE_KEY)
// or by staff users (admin/marketing/ceo).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const allowedRoles = new Set(["admin", "marketing", "ceo"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authorize(req: Request): Promise<{ ok: boolean; reason?: string }> {
  const internal = req.headers.get("X-Internal-Secret");
  if (internal && internal === SERVICE_KEY) return { ok: true };

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return { ok: false, reason: "Missing Authorization" };

  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const token = auth.replace("Bearer ", "");
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) return { ok: false, reason: "Unauthorized" };

  const { data: roles } = await userClient
    .from("user_roles")
    .select("role")
    .eq("user_id", data.claims.sub);
  const has = (roles ?? []).some((r: any) => allowedRoles.has(r.role));
  return has ? { ok: true } : { ok: false, reason: "Forbidden" };
}

function nowPlus(step: any): Date {
  const ms = (step?.days ?? 0) * 86400000
    + (step?.hours ?? 0) * 3600000
    + (step?.minutes ?? 0) * 60000;
  return new Date(Date.now() + ms);
}

async function executeStep(
  admin: any,
  enrollment: any,
  step: any,
): Promise<{ next_run_at: Date; advance: boolean; error?: string }> {
  const type = step?.type;

  if (type === "wait") {
    return { next_run_at: nowPlus(step), advance: true };
  }

  if (type === "add_tag") {
    const tag: string = String(step.tag ?? "").trim();
    if (tag && enrollment.lead_id) {
      // Append tag if not present.
      const { data: lead } = await admin
        .from("leads")
        .select("tags")
        .eq("id", enrollment.lead_id)
        .maybeSingle();
      const tags: string[] = Array.isArray(lead?.tags) ? lead!.tags : [];
      if (!tags.includes(tag)) {
        await admin.from("leads").update({ tags: [...tags, tag] }).eq("id", enrollment.lead_id);
      }
      await admin.from("lead_activities").insert({
        lead_id: enrollment.lead_id,
        activity_type: "tag_added",
        title: `Tagged via automation: ${tag}`,
        metadata: { automation_id: enrollment.automation_id, tag },
      });
    }
    return { next_run_at: new Date(), advance: true };
  }

  if (type === "send_email") {
    let subject = step.subject ?? "";
    let body_html = step.body_html ?? "";
    let from_name = step.from_name;

    if (step.template_id) {
      const { data: tpl } = await admin
        .from("email_templates")
        .select("subject, body_html, from_name")
        .eq("id", step.template_id)
        .maybeSingle();
      if (tpl) {
        subject = subject || tpl.subject || "";
        body_html = body_html || tpl.body_html || "";
        from_name = from_name || tpl.from_name;
      }
    }

    if (!subject || !body_html) {
      return { next_run_at: new Date(), advance: true, error: "send_email step missing subject/body" };
    }

    // Simple personalisation
    const name = enrollment.recipient_name || "there";
    subject = String(subject).replaceAll("{{name}}", name);
    body_html = String(body_html).replaceAll("{{name}}", name);

    // Suppression check
    const { data: suppressed } = await admin
      .from("suppressed_emails")
      .select("email")
      .eq("email", enrollment.recipient_email)
      .maybeSingle();
    if (suppressed) {
      return { next_run_at: new Date(), advance: true, error: "recipient suppressed" };
    }

    // Delegate to send-marketing-campaign in test mode for a single send.
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-marketing-campaign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_KEY}`,
        "X-Internal-Secret": SERVICE_KEY,
      },
      body: JSON.stringify({
        test: true,
        testEmail: enrollment.recipient_email,
        subject,
        body_html,
        from_name,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { next_run_at: new Date(Date.now() + 30 * 60000), advance: false, error: `send failed: ${res.status} ${body.slice(0, 200)}` };
    }

    if (enrollment.lead_id) {
      await admin.from("lead_activities").insert({
        lead_id: enrollment.lead_id,
        activity_type: "automation",
        title: `Automation email sent: ${subject}`,
        metadata: { automation_id: enrollment.automation_id, step_index: enrollment.current_step },
      });
    }

    return { next_run_at: new Date(), advance: true };
  }

  return { next_run_at: new Date(), advance: true, error: `Unknown step type: ${type}` };
}

async function processTimeBasedEnrollments(admin: any) {
  // Scan active time_based automations and enrol matching contacts.
  const { data: automations } = await admin
    .from("marketing_automations")
    .select("id, trigger_config")
    .eq("status", "active")
    .eq("trigger_type", "time_based");

  for (const a of automations ?? []) {
    const cfg = a.trigger_config ?? {};
    // days_since_last_booking: enrol leads whose last_activity_at is older
    if (typeof cfg.days_since_last_booking === "number") {
      const cutoff = new Date(Date.now() - cfg.days_since_last_booking * 86400000).toISOString();
      const { data: leads } = await admin
        .from("leads")
        .select("id, email, full_name")
        .lte("last_activity_at", cutoff)
        .eq("email_subscribed", true)
        .limit(200);
      for (const l of leads ?? []) {
        await admin.from("marketing_automation_enrollments").upsert({
          automation_id: a.id,
          lead_id: l.id,
          recipient_email: String(l.email).toLowerCase(),
          recipient_name: l.full_name,
          next_run_at: new Date().toISOString(),
        }, { onConflict: "automation_id,recipient_email", ignoreDuplicates: true });
      }
    }
    // birthday_today: requires client_profiles.dob — best-effort
    if (cfg.birthday_today === true) {
      const { data: profiles } = await admin
        .from("client_profiles")
        .select("id, email, full_name, dob")
        .not("dob", "is", null);
      const today = new Date();
      const mm = today.getMonth();
      const dd = today.getDate();
      for (const p of profiles ?? []) {
        if (!p.email || !p.dob) continue;
        const d = new Date(p.dob);
        if (d.getMonth() === mm && d.getDate() === dd) {
          await admin.from("marketing_automation_enrollments").upsert({
            automation_id: a.id,
            lead_id: null,
            recipient_email: String(p.email).toLowerCase(),
            recipient_name: p.full_name,
            next_run_at: new Date().toISOString(),
          }, { onConflict: "automation_id,recipient_email", ignoreDuplicates: true });
        }
      }
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await authorize(req);
  if (!auth.ok) return json({ error: auth.reason }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    // 1) Time-based enrolment scan
    await processTimeBasedEnrollments(admin);

    // 2) Drain due enrollments
    const { data: due } = await admin
      .from("marketing_automation_enrollments")
      .select("*, marketing_automations(steps,status,name)")
      .eq("status", "active")
      .lte("next_run_at", new Date().toISOString())
      .order("next_run_at", { ascending: true })
      .limit(200);

    let processed = 0;
    let errors = 0;

    for (const enr of due ?? []) {
      const automation = enr.marketing_automations;
      if (!automation || automation.status !== "active") {
        await admin.from("marketing_automation_enrollments")
          .update({ status: "cancelled", completed_at: new Date().toISOString() })
          .eq("id", enr.id);
        continue;
      }

      const steps = Array.isArray(automation.steps) ? automation.steps : [];
      if (enr.current_step >= steps.length) {
        await admin.from("marketing_automation_enrollments")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", enr.id);
        continue;
      }

      const step = steps[enr.current_step];
      const result = await executeStep(admin, enr, step);

      if (result.error && !result.advance) {
        errors++;
        await admin.from("marketing_automation_enrollments").update({
          last_error: result.error,
          next_run_at: result.next_run_at.toISOString(),
        }).eq("id", enr.id);
        continue;
      }

      const nextStep = enr.current_step + 1;
      const finished = nextStep >= steps.length;
      await admin.from("marketing_automation_enrollments").update({
        current_step: nextStep,
        next_run_at: result.next_run_at.toISOString(),
        last_error: result.error ?? null,
        status: finished ? "completed" : "active",
        completed_at: finished ? new Date().toISOString() : null,
      }).eq("id", enr.id);
      processed++;
    }

    return json({ ok: true, processed, errors });
  } catch (e) {
    console.error("process-marketing-automations error", e);
    return json({ error: String(e) }, 500);
  }
});
