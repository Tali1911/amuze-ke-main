// send-marketing-campaign
// Two modes:
//  1) Test mode: { test: true, testEmail, subject, body_html, from_name? }
//     -> Sends a single email via Resend. Does NOT create or mutate any
//        campaign row. Logs to email_deliveries with email_type='marketing_test'.
//  2) Blast mode: { campaignId, recipients?: string[] }
//     -> If recipients are provided, use that curated list (still filtered
//        through suppressions). Otherwise, resolve from segment.
//        Logs deliveries with campaign_id and updates aggregate counters.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = "https://amusekenya.co.ke";
const DEFAULT_FROM_DOMAIN = "amusekenya.co.ke";
const DEFAULT_FROM_LOCAL = "hello";

interface SendBody {
  // shared
  from_name?: string;
  // test mode
  test?: boolean;
  testEmail?: string | null;
  subject?: string;
  body_html?: string;
  // blast mode
  campaignId?: string;
  recipients?: string[];
  retry?: boolean;
}

const allowedRoles = new Set(["admin", "marketing", "ceo"]);

function buildHtml(bodyHtml: string, unsubToken: string | null): string {
  const unsubBlock = unsubToken
    ? `<hr style="margin-top:32px;border:none;border-top:1px solid #eee" />
  <p style="font-size:12px;color:#888;text-align:center;">
    You received this because you registered with Amuse Kenya.<br/>
    <a href="${APP_URL}/unsubscribe/${unsubToken}" style="color:#888;">Unsubscribe</a>
  </p>`
    : `<hr style="margin-top:32px;border:none;border-top:1px solid #eee" />
  <p style="font-size:12px;color:#888;text-align:center;">[Test send — unsubscribe link appears in real blasts]</p>`;
  return `<!doctype html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  ${bodyHtml}
  ${unsubBlock}
</body></html>`;
}

async function getOrCreateUnsubToken(supabase: any, email: string): Promise<string> {
  const { data: existing } = await supabase
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", email)
    .maybeSingle();
  if (existing?.token) return existing.token;
  const token = crypto.randomUUID().replace(/-/g, "");
  await supabase.from("email_unsubscribe_tokens").insert({ token, email });
  return token;
}

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authorizeStaffCaller(userSupabase: any): Promise<{ error?: string; status?: number }> {
  const { data: roles, error: rolesError } = await userSupabase
    .from("user_roles")
    .select("role")
    .in("role", Array.from(allowedRoles));

  if (rolesError) {
    console.error("role authorization failed", rolesError.message);
    return { error: "Unable to verify user permissions", status: 500 };
  }

  const hasAllowedRole = (roles || []).some((r: any) => allowedRoles.has(String(r.role).toLowerCase()));
  if (!hasAllowedRole) {
    return { error: "Forbidden: requires admin, marketing, or ceo role", status: 403 };
  }

  return {};
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY") || "";
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      return jsonResponse({ success: false, error: "RESEND_API_KEY is not configured on the server." }, 500);
    }
    if (!anonKey) {
      return jsonResponse({ success: false, error: "Server configuration error: missing anon key" }, 500);
    }

    // Auth: require admin/marketing/ceo
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ success: false, error: "Unauthorized: missing bearer token" }, 401);
    }
    const userSupabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabase = createClient(supabaseUrl, serviceKey);

    const authorization = await authorizeStaffCaller(userSupabase);
    if (authorization.error) {
      return jsonResponse({ success: false, error: authorization.error }, authorization.status || 401);
    }

    const body: SendBody = await req.json();
    const resend = new Resend(resendKey);

    // ---------- TEST MODE ----------
    if (body.test) {
      const testEmail = (body.testEmail || "").trim().toLowerCase();
      if (!testEmail) return jsonResponse({ success: false, error: "testEmail is required" }, 400);
      if (!body.subject?.trim()) return jsonResponse({ success: false, error: "Subject is required" }, 400);
      if (!body.body_html?.trim()) return jsonResponse({ success: false, error: "Email body is required" }, 400);

      const fromName = body.from_name || "Amuse Kenya";
      const fromAddr = `${fromName} <${DEFAULT_FROM_LOCAL}@${DEFAULT_FROM_DOMAIN}>`;
      const html = buildHtml(body.body_html, null);
      const subject = `[TEST] ${body.subject}`;

      try {
        const result = await resend.emails.send({
          from: fromAddr,
          to: testEmail,
          subject,
          html,
        });
        const errMsg = (result as any)?.error?.message || (result as any)?.error;
        if (errMsg) {
          return jsonResponse({ success: false, error: `Resend error: ${errMsg}` }, 502);
        }
        const messageId = (result as any)?.data?.id || (result as any)?.id || null;

        // best-effort log; do not block on failure
        try {
          await supabase.from("email_deliveries").insert({
            email: testEmail,
            message_id: messageId,
            email_type: "marketing_test",
            subject,
            status: "sent",
          });
        } catch (_) {
          /* ignore */
        }

        return jsonResponse({ success: true, sent: 1, failed: 0, total: 1, test: true });
      } catch (err: any) {
        console.error("test send failed", err);
        return jsonResponse({ success: false, error: err?.message || "Resend send failed" }, 502);
      }
    }

    // ---------- BLAST MODE ----------
    const campaignId = body.campaignId;
    if (!campaignId) return jsonResponse({ success: false, error: "campaignId required" }, 400);

    const { data: campaign, error: cErr } = await supabase.from("campaigns").select("*").eq("id", campaignId).single();
    if (cErr || !campaign) return jsonResponse({ success: false, error: "Campaign not found" }, 404);

    // Build recipient list
    const { data: suppressions } = await supabase.from("email_suppressions").select("email");
    const suppressedSet = new Set((suppressions || []).map((s: any) => (s.email || "").toLowerCase()));

    let recipients: { email: string; lead_id?: string }[] = [];

    if (Array.isArray(body.recipients) && body.recipients.length > 0) {
      const seen = new Set<string>();
      for (const raw of body.recipients) {
        const e = (raw || "").trim().toLowerCase();
        if (!e || suppressedSet.has(e) || seen.has(e)) continue;
        seen.add(e);
        recipients.push({ email: e });
      }
    } else if (campaign.segment_id) {
      const { data: segment } = await supabase
        .from("email_segments")
        .select("filters")
        .eq("id", campaign.segment_id)
        .single();
      const f = (segment as any)?.filters || {};
      let q = supabase.from("leads").select("id, email, email_subscribed").not("email", "is", null);
      if (f.program_type) q = q.eq("program_type", f.program_type);
      if (f.status) q = q.eq("status", f.status);
      const { data: leads } = await q;
      const seen = new Set<string>();
      for (const l of (leads || []) as any[]) {
        const e = (l.email || "").trim().toLowerCase();
        if (!e || l.email_subscribed === false || suppressedSet.has(e) || seen.has(e)) continue;
        seen.add(e);
        recipients.push({ email: e, lead_id: l.id });
      }
    }

    if (recipients.length === 0) {
      return jsonResponse({ success: false, error: "No eligible recipients" }, 400);
    }

    await supabase.from("campaigns").update({ status: "active" }).eq("id", campaignId);

    const fromName = campaign.from_name || "Amuse Kenya";
    const fromAddr = `${fromName} <${DEFAULT_FROM_LOCAL}@${DEFAULT_FROM_DOMAIN}>`;
    const subject = campaign.subject || campaign.name;

    let sent = 0;
    let failed = 0;
    const lastError: { msg?: string } = {};

    // Pacing + retry config — Resend free tier is ~2 req/s.
    const BATCH = 2;
    const PACE_MS = 1100;
    const MAX_ATTEMPTS = 4;
    const HARD_DEADLINE_MS = Date.now() + 8 * 60 * 1000; // ~8 min cap

    type Pending = { email: string; lead_id?: string };
    const queue: Pending[] = [...recipients];
    const attempts = new Map<string, number>();
    let cooldownUntil = 0;

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const classifyError = (err: any): { retry: boolean; retryAfterMs: number; message: string } => {
      const msg = String(err?.message || err || "send failed");
      const status = err?.statusCode || err?.status || err?.response?.status;
      const lower = msg.toLowerCase();
      const isRateLimit =
        status === 429 ||
        lower.includes("too many requests") ||
        lower.includes("rate limit") ||
        lower.includes("rate_limit");
      if (isRateLimit) {
        // Resend often embeds "Retry-After: N" or "in N seconds" in the message.
        const m = msg.match(/(\d+)\s*(?:s|sec|second)/i);
        const secs = m ? parseInt(m[1], 10) : 0;
        return { retry: true, retryAfterMs: Math.max(secs * 1000, 2000), message: msg };
      }
      const isTransient =
        (typeof status === "number" && status >= 500) || lower.includes("network") || lower.includes("timeout");
      if (isTransient) return { retry: true, retryAfterMs: 1000, message: msg };
      return { retry: false, retryAfterMs: 0, message: msg };
    };

    const finalizeFailure = async (r: Pending, message: string) => {
      lastError.msg = message;
      failed++;
      try {
        await supabase.from("email_deliveries").insert({
          email: r.email,
          email_type: "marketing",
          subject,
          status: "bounced",
          campaign_id: campaignId,
          postmark_data: { error: message },
        });
      } catch (_) {
        /* ignore */
      }
    };

    while (queue.length > 0) {
      if (Date.now() > HARD_DEADLINE_MS) {
        // Time's up — finalize whatever's left as failed so the user can resend.
        while (queue.length > 0) {
          const r = queue.shift()!;
          await finalizeFailure(r, "timeout — please resend remaining recipients");
        }
        break;
      }

      const now = Date.now();
      if (cooldownUntil > now) {
        await sleep(cooldownUntil - now);
        cooldownUntil = 0;
      }

      const batch: Pending[] = [];
      while (batch.length < BATCH && queue.length > 0) batch.push(queue.shift()!);

      await Promise.all(
        batch.map(async (r) => {
          const attempt = (attempts.get(r.email) || 0) + 1;
          attempts.set(r.email, attempt);
          try {
            const token = await getOrCreateUnsubToken(supabase, r.email);
            const html = buildHtml(campaign.body_html || "", token);
            const result = await resend.emails.send({ from: fromAddr, to: r.email, subject, html });
            const errPayload = (result as any)?.error;
            if (errPayload) {
              const errMsg = errPayload?.message || errPayload;
              const e: any = new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
              e.statusCode = errPayload?.statusCode || errPayload?.status;
              throw e;
            }
            const messageId = (result as any)?.data?.id || (result as any)?.id || null;

            await supabase.from("email_deliveries").insert({
              email: r.email,
              message_id: messageId,
              recipient_type: r.lead_id ? "lead" : null,
              recipient_id: r.lead_id || null,
              email_type: "marketing",
              subject,
              status: "sent",
              campaign_id: campaignId,
            });
            sent++;
          } catch (err: any) {
            const cls = classifyError(err);
            console.error(`send attempt ${attempt} failed for ${r.email}: ${cls.message}`);
            if (cls.retry && attempt < MAX_ATTEMPTS) {
              // Re-queue at the tail; bump cooldown for the whole loop.
              queue.push(r);
              if (cls.retryAfterMs > 0) {
                cooldownUntil = Math.max(cooldownUntil, Date.now() + cls.retryAfterMs);
              }
            } else {
              await finalizeFailure(r, cls.message);
            }
          }
        }),
      );

      if (queue.length > 0) await sleep(PACE_MS);
    }

    // For retries, accumulate counts on top of previous run instead of overwriting.
    const newSentCount = body.retry ? (campaign.sent_count || 0) + sent : sent;
    // Failures from previous runs that succeeded this time should reduce failed_count.
    const newFailedCount = body.retry ? Math.max(0, (campaign.failed_count || 0) - sent + failed) : failed;

    await supabase
      .from("campaigns")
      .update({
        status: "completed",
        sent_count: newSentCount,
        failed_count: newFailedCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    return jsonResponse({
      success: true,
      sent,
      failed,
      total: recipients.length,
      retry: !!body.retry,
      ...(failed > 0 && lastError.msg ? { warning: `Some sends failed. Last error: ${lastError.msg}` } : {}),
    });
  } catch (e: any) {
    console.error("send-marketing-campaign error", e);
    return jsonResponse({ success: false, error: e?.message || "Internal error" }, 500);
  }
});
