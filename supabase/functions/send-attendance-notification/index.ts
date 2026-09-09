// Attendance notification email sender
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AttendanceNotificationRequest {
  registrationId: string;
  childName: string;
  parentEmail: string;
  parentName: string;
  campType: string;
  eventType: 'check-in' | 'check-out';
  timestamp: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 send-attendance-notification function started');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!resendApiKey || !supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('❌ Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Check user role - only coaches, admin can mark attendance
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const allowedRoles = ['admin', 'coach', 'ceo'];
    if (!roles?.some(r => allowedRoles.includes(r.role))) {
      console.error('❌ User lacks required role');
      return new Response(
        JSON.stringify({ error: 'Forbidden - insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestBody = await req.json();
    const { 
      registrationId, 
      childName, 
      parentEmail, 
      parentName, 
      campType, 
      eventType, 
      timestamp,
      notes 
    }: AttendanceNotificationRequest = requestBody;

    console.log(`📧 Sending ${eventType} notification for ${childName} to ${parentEmail}`);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Check if email is suppressed
    const { data: suppression } = await supabase
      .from('email_suppressions')
      .select('email, suppression_type')
      .eq('email', parentEmail)
      .maybeSingle();

    if (suppression) {
      console.warn(`Email suppressed: ${parentEmail}`);
      return new Response(
        JSON.stringify({ 
          error: `Email suppressed: ${suppression.suppression_type}`,
          suppressed: true 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format timestamp
    const eventTime = new Date(timestamp);
    const formattedTime = eventTime.toLocaleTimeString('en-KE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const formattedDate = eventTime.toLocaleDateString('en-KE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format camp type for display
    const campTypeDisplay = campType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const isCheckIn = eventType === 'check-in';
    const emoji = isCheckIn ? '🟢' : '🔴';
    const actionText = isCheckIn ? 'checked in' : 'checked out';
    const subject = `${emoji} ${childName} has ${actionText} - ${campTypeDisplay}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: ${isCheckIn ? '#2d5016' : '#b45309'}; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Amuse Kenya</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Camp Attendance Update</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="text-align: center; margin-bottom: 25px;">
              <span style="font-size: 48px;">${emoji}</span>
              <h2 style="color: ${isCheckIn ? '#2d5016' : '#b45309'}; margin: 10px 0 0 0;">
                ${isCheckIn ? 'Check-In Confirmed' : 'Check-Out Confirmed'}
              </h2>
            </div>
            
            <p style="font-size: 16px;">Dear <strong>${parentName}</strong>,</p>
            
            <p>This is to notify you that <strong>${childName}</strong> has ${actionText} at our ${campTypeDisplay} program.</p>
            
            <div style="background-color: ${isCheckIn ? '#e8f5e9' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isCheckIn ? '#2d5016' : '#b45309'};">
              <h3 style="margin-top: 0; color: ${isCheckIn ? '#2d5016' : '#b45309'};">Attendance Details</h3>
              <p style="margin: 8px 0;"><strong>Child:</strong> ${childName}</p>
              <p style="margin: 8px 0;"><strong>Event:</strong> ${isCheckIn ? 'Check-In' : 'Check-Out'}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${formattedTime}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0;"><strong>Program:</strong> ${campTypeDisplay}</p>
              ${notes ? `<p style="margin: 8px 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
            </div>
            
            ${isCheckIn ? `
              <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #0369a1;">
                  <strong>📍 Location:</strong> Karura Forest, Gate F, Thigiri Ridge<br>
                  <strong>⏰ Pick-up Time:</strong> Full Day: 5:00 PM / Half Day: 12:00 PM
                </p>
              </div>
            ` : `
              <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #0369a1;">
                  <strong>🎉</strong> Thank you for another wonderful day at camp! We hope ${childName} had a great time.
                </p>
              </div>
            `}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <h3 style="color: #2d5016;">Questions?</h3>
              <p style="margin: 5px 0;">
                <strong>📧 Email:</strong> admin@amusekenya.co.ke<br>
                <strong>📞 Phone:</strong> +254 114 705 763
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This is an automated notification from Amuse Kenya.</p>
            <p>&copy; 2025 Amuse Kenya. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const resend = new Resend(resendApiKey);
    const senderEmail = 'Amuse Kenya <admin@amusekenya.co.ke>';
    
    console.log('📤 Sending email via Resend...');
    
    const emailResponse = await resend.emails.send({
      from: senderEmail,
      to: [parentEmail],
      subject: subject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error('❌ Resend error:', emailResponse.error);
      throw new Error(`Resend error: ${emailResponse.error.message}`);
    }

    console.log('✅ Notification sent successfully:', emailResponse.data?.id);

    // Track delivery
    const messageId = emailResponse.data?.id || `resend-${Date.now()}`;
    try {
      await supabase
        .from('email_deliveries')
        .insert({
          email: parentEmail,
          message_id: messageId,
          recipient_type: 'registration',
          email_type: `attendance-${eventType}`,
          subject: subject,
          status: 'sent',
          postmark_data: { provider: 'resend', message_id: messageId },
          sent_at: new Date().toISOString()
        });
    } catch (trackingError) {
      console.error('⚠️ Error tracking delivery:', trackingError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: messageId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    // Return generic error - don't expose internal details
    return new Response(
      JSON.stringify({ error: 'Failed to send attendance notification. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);
