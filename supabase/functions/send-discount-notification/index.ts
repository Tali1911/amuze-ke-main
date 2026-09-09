// Send a discount notification email to a specific client (1:1, transactional)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SENDER = "Amuse Kenya <info@amusekenya.co.ke>";

const formatDiscount = (d: any): string => {
  if (d.discount_type === "percentage") return `${d.discount_value}% off`;
  if (d.discount_type === "fixed_amount") return `KES ${Number(d.discount_value).toLocaleString()} off your booking`;
  return `KES ${Number(d.discount_value).toLocaleString()} per child / per day`;
};

const campLabel = (slug: string | null | undefined) => {
  if (!slug) return "any of our camps";
  const map: Record<string, string> = {
    easter: "Easter Camp",
    summer: "Summer Camp",
    "end-year": "End of Year Camp",
    "mid-term-feb-march": "Mid-Term Camp (Feb/March)",
    "mid-term-may-june": "Mid-Term Camp (May/June)",
    "mid-term-october": "Mid-Term Camp (October)",
    "little-forest": "Little Forest",
    "day-camps": "Day Camps",
  };
  return map[slug] || slug;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { discountId } = await req.json();
    if (!discountId) {
      return new Response(JSON.stringify({ error: "discountId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!resendKey || !supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: d, error } = await supabase.from("client_discounts").select("*").eq("id", discountId).maybeSingle();
    if (error || !d) {
      return new Response(JSON.stringify({ error: "Discount not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!d.client_email) {
      return new Response(JSON.stringify({ error: "Discount has no client email — add one before sending" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validityLine = d.valid_to
      ? `Valid until <strong>${d.valid_to}</strong>${d.valid_from ? ` (from ${d.valid_from})` : ""}.`
      : d.valid_from
        ? `Valid from <strong>${d.valid_from}</strong>.`
        : `Valid until you book.`;

    const conditions: string[] = [];
    if (d.min_total) conditions.push(`Minimum booking total: KES ${Number(d.min_total).toLocaleString()}`);
    if (d.min_children) conditions.push(`Minimum number of children: ${d.min_children}`);
    if (d.single_use) conditions.push("Single-use — redeemable on one booking");

    const html = `
<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;background:#f4f6f8;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
    <div style="background:#2d5016;color:#fff;padding:24px 28px;">
      <h1 style="margin:0;font-size:22px;">A special discount for you</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">Amuse Kenya</p>
    </div>
    <div style="padding:28px;">
      <p style="font-size:16px;color:#333;">Hello${d.client_name ? ` ${d.client_name}` : ""},</p>
      <p style="font-size:15px;color:#555;line-height:1.6;">
        We're delighted to offer you a special discount on your upcoming booking with us.
      </p>
      <div style="background:#f0f7e8;border-left:4px solid #6fa835;padding:18px 20px;margin:20px 0;border-radius:6px;">
        <p style="margin:0;font-size:18px;color:#2d5016;"><strong>${formatDiscount(d)}</strong></p>
        <p style="margin:8px 0 0;color:#555;font-size:14px;">
          Applies to: <strong>${campLabel(d.camp_type)}</strong>
        </p>
      </div>
      <p style="font-size:14px;color:#555;line-height:1.6;">${validityLine}</p>
      ${
        conditions.length
          ? `<ul style="font-size:14px;color:#555;line-height:1.7;padding-left:20px;">
              ${conditions.map((c) => `<li>${c}</li>`).join("")}
            </ul>`
          : ""
      }
      ${
        d.reason
          ? `<p style="font-size:14px;color:#555;line-height:1.6;background:#fafafa;padding:12px 14px;border-radius:6px;"><em>${d.reason}</em></p>`
          : ""
      }
      <p style="font-size:14px;color:#555;line-height:1.6;margin-top:24px;">
        To redeem, simply register at <a href="https://amusekenya.co.ke" style="color:#2d5016;">amusekenya.co.ke</a> using the email
        <strong>${d.client_email}</strong>${
          d.client_phone ? ` or phone <strong>${d.client_phone}</strong>` : ""
        }. The discount will be applied automatically at the registration step.
      </p>
      <p style="font-size:13px;color:#888;margin-top:28px;">
        Questions? Reply to this email or contact <a href="mailto:accounts@amusekenya.co.ke" style="color:#2d5016;">accounts@amusekenya.co.ke</a>.
      </p>
    </div>
  </div>
</body></html>`;

    const resend = new Resend(resendKey);
    const result = await resend.emails.send({
      from: SENDER,
      to: [d.client_email],
      bcc: ["accounts@amusekenya.co.ke"],
      subject: "A special discount on your Amuse Kenya booking",
      html,
    });

    if ((result as any).error) {
      return new Response(JSON.stringify({ error: (result as any).error?.message || "Resend error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
