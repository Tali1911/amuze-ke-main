// Test Resend email integration
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("🚀 test-resend function started");
  console.log(`📍 Request method: ${req.method}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate authentication - only authenticated users can test email
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('❌ No valid authorization header');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("❌ Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the JWT token
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
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

    // Check user role - only admin can test email
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const allowedRoles = ['admin', 'ceo', 'marketing'];
    if (!roles?.some(r => allowedRoles.includes(r.role))) {
      console.error('❌ User lacks required role');
      return new Response(
        JSON.stringify({ error: 'Forbidden - insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY not found");
      return new Response(
        JSON.stringify({
          error: "Email service not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("✅ RESEND_API_KEY is configured");

    // Parse request body
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email address is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("📧 Sending test email to:", email);

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    // Send test email
    const emailResponse = await resend.emails.send({
      from: "Amuse Kenya <info@amusekenya.com>",
      to: [email],
      subject: "Test Email from Amuse Kenya",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #2d5016; color: white; padding: 20px; text-align: center; border-radius: 8px;">
              <h1 style="margin: 0;">✅ Resend Integration Working!</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f8f9fa; margin-top: 20px; border-radius: 8px;">
              <h2 style="color: #2d5016;">Test Email Successful</h2>
              <p>This is a test email from Amuse Kenya to verify that the Resend email integration is working correctly.</p>
              
              <div style="background-color: white; padding: 15px; border-left: 4px solid #2d5016; margin: 20px 0;">
                <h3 style="margin-top: 0;">What This Means:</h3>
                <ul>
                  <li>✅ Resend API key is configured correctly</li>
                  <li>✅ Email sending functionality is operational</li>
                  <li>✅ Confirmation emails will be sent to customers</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Sent at: ${new Date().toISOString()}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("✅ Test email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test email sent successfully!",
        messageId: emailResponse.data?.id,
        provider: "resend",
        details: {
          configured: true,
          recipient: email,
          timestamp: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("❌ Error in test-resend:", error);

    // Return generic error - don't expose internal details
    return new Response(
      JSON.stringify({
        error: "Failed to send test email. Please check configuration.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
};

serve(handler);
