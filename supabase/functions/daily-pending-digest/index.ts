import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACCOUNTS_EMAIL = "accounts@amusekenya.co.ke";

interface PendingItem {
  id: string;
  registration_id: string;
  child_name: string;
  parent_name: string;
  email: string;
  phone: string;
  amount_due: number;
  camp_type: string;
  created_at: string;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('❌ No valid authorization header');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("Starting daily pending collections digest...");

    // Validate environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!resendApiKey || !supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("Required environment variables not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the JWT token
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authSupabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('❌ Invalid token:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('✅ User authenticated:', userId);

    // Check user role - only accounts or admin can trigger digest
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const allowedRoles = ['admin', 'accounts', 'ceo'];
    if (!roles?.some(r => allowedRoles.includes(r.role))) {
      console.error('❌ User lacks required role');
      return new Response(
        JSON.stringify({ error: 'Forbidden - insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Fetch all pending action items
    console.log("Fetching pending items from accounts_action_items...");
    const { data: pendingItems, error: fetchError } = await supabase
      .from("accounts_action_items")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching pending items:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: `Database error: ${fetchError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log("No pending collections found");
      return new Response(
        JSON.stringify({ success: true, message: "No pending collections to report", pendingCount: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${pendingItems.length} pending collections`);

    // Calculate totals
    const totalAmount = pendingItems.reduce((sum, item) => sum + (item.amount_due || 0), 0);
    const formattedTotal = new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(totalAmount);

    // Group by camp type
    const byCampType: Record<string, PendingItem[]> = {};
    for (const item of pendingItems) {
      const campType = item.camp_type || "Unknown";
      if (!byCampType[campType]) {
        byCampType[campType] = [];
      }
      byCampType[campType].push(item);
    }

    // Build camp type sections
    const campTypeSections = Object.entries(byCampType)
      .map(([campType, items]) => {
        const campTotal = items.reduce((sum, item) => sum + (item.amount_due || 0), 0);
        const formattedCampTotal = new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency: "KES",
        }).format(campTotal);

        const itemRows = items
          .map((item) => {
            const formattedAmount = new Intl.NumberFormat("en-KE", {
              style: "currency",
              currency: "KES",
            }).format(item.amount_due || 0);
            const createdDate = new Date(item.created_at).toLocaleDateString("en-KE", {
              day: "numeric",
              month: "short",
            });
            return `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.child_name || 'N/A'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.parent_name || 'N/A'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                  ${item.phone ? `<a href="tel:${item.phone}" style="color: #2D5A3D;">${item.phone}</a><br>` : ''}
                  ${item.email ? `<a href="mailto:${item.email}" style="color: #2D5A3D;">${item.email}</a>` : 'No contact'}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #92400e;">${formattedAmount}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">${createdDate}</td>
              </tr>
            `;
          })
          .join("");

        return `
          <div style="margin-bottom: 30px;">
            <h3 style="background: #f3f4f6; padding: 12px; margin: 0; border-radius: 6px 6px 0 0; text-transform: capitalize;">
              ${campType.replace(/-/g, " ")} 
              <span style="float: right; color: #92400e;">${formattedCampTotal}</span>
            </h3>
            <table style="width: 100%; border-collapse: collapse; background: white;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151;">Child</th>
                  <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151;">Parent</th>
                  <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151;">Contact</th>
                  <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151;">Amount</th>
                  <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151;">Since</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>
          </div>
        `;
      })
      .join("");

    const today = new Date().toLocaleDateString("en-KE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.log(`Sending email to ${ACCOUNTS_EMAIL}...`);
    
    const emailResponse = await resend.emails.send({
      from: "Amuse Kenya <info@amusekenya.co.ke>",
      to: [ACCOUNTS_EMAIL],
      subject: `📊 Daily Pending Collections: ${pendingItems.length} items - ${formattedTotal}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2D5A3D 0%, #4A7C59 100%); padding: 25px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📊 Daily Pending Collections Report</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${today}</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="display: flex; gap: 20px; margin-bottom: 30px;">
              <div style="flex: 1; background: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="margin: 0; color: #666; font-size: 14px;">Total Pending</p>
                <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #2D5A3D;">${pendingItems.length}</p>
              </div>
              <div style="flex: 1; background: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="margin: 0; color: #666; font-size: 14px;">Total Amount Due</p>
                <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #92400e;">${formattedTotal}</p>
              </div>
              <div style="flex: 1; background: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="margin: 0; color: #666; font-size: 14px;">Camp Types</p>
                <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #2D5A3D;">${Object.keys(byCampType).length}</p>
              </div>
            </div>

            ${campTypeSections}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://amusekenya.co.ke/admin" 
                 style="background: #2D5A3D; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Open Accounts Portal
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; background: #2D5A3D; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">
              Amuse Kenya - Camp Management System<br>
              This is an automated daily digest. Collections require follow-up.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Resend API response:", JSON.stringify(emailResponse));

    // Check if Resend returned an error
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Email send failed: ${emailResponse.error.message}`,
          resendError: emailResponse.error
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Daily digest email sent successfully! Email ID:", emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pendingCount: pendingItems.length,
        totalAmount,
        emailId: emailResponse.data?.id,
        message: `Email sent to ${ACCOUNTS_EMAIL}`
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in daily-pending-digest function:", error);
    // Return generic error - don't expose internal details
    return new Response(
      JSON.stringify({ error: 'Failed to generate digest. Please try again.' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
