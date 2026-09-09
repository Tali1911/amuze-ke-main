// process-scheduled-campaigns
// Invoked every 5 minutes by pg_cron. Finds campaigns whose
// scheduled_for has passed and whose send-window allows sending right now
// (in Africa/Nairobi time), then dispatches each one by calling
// send-marketing-campaign with the stored recipients_snapshot.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Returns the current hour (0-23) in Africa/Nairobi (UTC+3, no DST).
function nairobiHour(now: Date): number {
  // EAT is UTC+3 year-round.
  return (now.getUTCHours() + 3) % 24;
}

// True when `hour` is inside [start, end). Supports wrap-around windows
// (e.g. start=20, end=6 means 8pm through 6am).
function inWindow(hour: number, start: number | null, end: number | null): boolean {
  if (start === null || end === null) return true;
  if (start === end) return true; // treat as "any time"
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Light protection: only allow callers that present the service key
    // (the pg_cron job does). Without this, anyone could trigger dispatch.
    const provided = req.headers.get("x-internal-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (provided !== serviceKey) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const nowIso = new Date().toISOString();
    const hour = nairobiHour(new Date());

    const { data: due, error } = await supabase
      .from("campaigns")
      .select("id, name, send_window_start_hour, send_window_end_hour, recipients_snapshot")
      .eq("status", "scheduled")
      .lte("scheduled_for", nowIso)
      .order("scheduled_for", { ascending: true })
      .limit(10);

    if (error) {
      console.error("query due campaigns failed", error);
      return json({ success: false, error: error.message }, 500);
    }

    if (!due || due.length === 0) {
      return json({ success: true, dispatched: 0, skipped: 0 });
    }

    let dispatched = 0;
    let skipped = 0;

    for (const c of due as any[]) {
      const ok = inWindow(hour, c.send_window_start_hour, c.send_window_end_hour);
      if (!ok) {
        skipped++;
        continue;
      }

      // Claim the row to prevent concurrent dispatch.
      const { data: claimed, error: claimErr } = await supabase
        .from("campaigns")
        .update({ status: "active", dispatch_started_at: nowIso })
        .eq("id", c.id)
        .eq("status", "scheduled")
        .select("id")
        .maybeSingle();
      if (claimErr || !claimed) continue;

      const recipients: string[] = Array.isArray(c.recipients_snapshot) ? (c.recipients_snapshot as string[]) : [];

      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/send-marketing-campaign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
            "X-Internal-Secret": serviceKey,
          },
          body: JSON.stringify({ campaignId: c.id, recipients }),
        });
        const text = await resp.text();
        if (!resp.ok) {
          console.error(`dispatch ${c.id} failed: ${resp.status} ${text}`);
          await supabase
            .from("campaigns")
            .update({ status: "failed", dispatch_error: `HTTP ${resp.status}: ${text.slice(0, 500)}` })
            .eq("id", c.id);
        } else {
          dispatched++;
        }
      } catch (e: any) {
        console.error(`dispatch ${c.id} threw`, e);
        await supabase
          .from("campaigns")
          .update({ status: "failed", dispatch_error: String(e?.message || e).slice(0, 500) })
          .eq("id", c.id);
      }
    }

    return json({ success: true, dispatched, skipped, considered: due.length });
  } catch (e: any) {
    console.error("process-scheduled-campaigns error", e);
    return json({ success: false, error: e?.message || "Internal error" }, 500);
  }
});
