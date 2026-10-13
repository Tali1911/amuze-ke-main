import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Testing SendGrid configuration...');
    
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    
    if (!sendGridApiKey) {
      console.error('❌ SENDGRID_API_KEY not found');
      return new Response(
        JSON.stringify({ 
          error: 'SENDGRID_API_KEY not configured',
          success: false 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('✅ SENDGRID_API_KEY found');
    console.log('📧 Attempting to send test email...');

    const { testEmail } = await req.json();
    const recipientEmail = testEmail || 'test@example.com';

    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: recipientEmail }]
        }],
        from: {
          email: 'peterokata47@gmail.com',
          name: 'Amuse Kenya Test'
        },
        subject: 'SendGrid Test Email',
        content: [{
          type: 'text/html',
          value: '<h1>Test Email</h1><p>This is a test email from Amuse Kenya to verify SendGrid integration.</p>'
        }]
      })
    });

    const responseStatus = emailResponse.status;
    console.log('📤 SendGrid response status:', responseStatus);

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('❌ SendGrid error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `SendGrid returned ${responseStatus}`,
          details: errorText,
          status: responseStatus
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const messageId = emailResponse.headers.get('X-Message-Id') || 'no-message-id';
    console.log('✅ Email sent successfully! Message ID:', messageId);

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: messageId,
        recipient: recipientEmail,
        status: responseStatus
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("❌ Exception in test-sendgrid function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
