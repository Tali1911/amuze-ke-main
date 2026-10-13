import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProgramConfirmationRequest {
  email: string;
  name: string;
  programType: 'kenyan-experiences' | 'homeschooling' | 'school-experience' | 'team-building' | 'parties' | 'day-camps' | 'holiday-camp';
  details: any;
  totalAmount?: number;
  registrationId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendGridApiKey) {
      console.error('❌ SENDGRID_API_KEY not configured');
      throw new Error('SENDGRID_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, name, programType, details, totalAmount, registrationId }: ProgramConfirmationRequest = await req.json();
    console.log('📧 Received request:', { email, programType, registrationId });

    // Check suppression list
    let isSuppressed = false;
    try {
      const { data: suppression } = await supabase
        .from('email_suppressions')
        .select('suppression_type, reason')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (suppression) {
        console.log(`❌ Email suppressed (${suppression.suppression_type}): ${email}`);
        isSuppressed = true;
      }
    } catch (error) {
      console.error('⚠️ Error checking suppression:', error);
    }

    if (isSuppressed) {
      return new Response(
        JSON.stringify({ error: 'Email address is suppressed' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('✅ Email not suppressed, proceeding with send');

    // Generate program-specific content
    let programTitle = '';
    let programDetails = '';
    let invoiceAmount = totalAmount || 0;

    switch (programType) {
      case 'kenyan-experiences':
        programTitle = 'Kenyan Experiences (5-Day Adventure)';
        programDetails = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Circuit:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.circuit}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Participants:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.participants?.length || 0}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Transport Required:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.transport ? 'Yes' : 'No'}</td></tr>
        `;
        break;
      case 'homeschooling':
        programTitle = 'Homeschooling Outdoor Experiences';
        programDetails = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Package:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.package}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Number of Children:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.children?.length || 0}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Focus Areas:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.focus?.join(', ') || 'N/A'}</td></tr>
        `;
        break;
      case 'school-experience':
        programTitle = 'School Experience Package';
        programDetails = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>School Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.schoolName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Number of Students:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.numberOfStudents}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Visit Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.visitDate}</td></tr>
        `;
        break;
      case 'team-building':
        programTitle = 'Team Building Program';
        programDetails = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Company:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.company}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Number of Participants:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.numberOfParticipants}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Program Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.programDate}</td></tr>
        `;
        break;
      case 'parties':
        programTitle = 'Birthday Party Package';
        programDetails = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Child Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.childName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Age:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.age}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Party Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.partyDate}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Number of Guests:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.numberOfGuests}</td></tr>
        `;
        break;
      case 'day-camps':
        programTitle = 'Day Camps Program';
        programDetails = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Child Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.childName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Age:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.age}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Selected Dates:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.selectedDates?.join(', ') || 'N/A'}</td></tr>
        `;
        break;
      case 'holiday-camp':
        programTitle = 'Holiday Camp Registration';
        programDetails = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Child Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.childName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Age:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.age}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Camp Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.campType}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Selected Dates:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.selectedDates?.join(', ') || 'N/A'}</td></tr>
        `;
        break;
    }

    const invoiceSection = totalAmount ? `
      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <h3 style="margin: 0 0 15px 0; color: #2d3748;">Invoice Summary</h3>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 2px solid #2d3748;">
          <strong>Total Amount:</strong>
          <strong style="font-size: 18px;">KSH ${invoiceAmount.toLocaleString()}</strong>
        </div>
      </div>
    ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Amuse Bush Camp</h1>
          <p style="color: #e8f5e9; margin: 10px 0 0 0;">Your Adventure Awaits!</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #2d5016; margin-top: 0;">Registration Confirmed!</h2>
          
          <p>Dear ${name},</p>
          
          <p>Thank you for registering with Amuse Bush Camp! We're excited to have you join us for an unforgettable outdoor experience.</p>
          
          <div style="margin: 25px 0; padding: 20px; background-color: #f0f7ed; border-left: 4px solid #4a7c2c; border-radius: 4px;">
            <h3 style="margin: 0 0 15px 0; color: #2d5016;">${programTitle}</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${programDetails}
            </table>
          </div>
          
          ${invoiceSection}
          
          <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">Important Information:</h4>
            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
              <li>Please arrive 15 minutes before the scheduled start time</li>
              <li>Bring comfortable outdoor clothing and closed shoes</li>
              <li>Don't forget water bottles and sun protection</li>
              <li>All necessary equipment will be provided</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">If you have any questions or need to make changes to your registration, please don't hesitate to contact us.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center;">
            <p style="margin: 5px 0;"><strong>Contact Us:</strong></p>
            <p style="margin: 5px 0;">Email: info@amusekenya.co.ke</p>
            <p style="margin: 5px 0;">Phone: +254 123 456 789</p>
            <p style="margin: 5px 0;">Location: Karura Forest, Nairobi</p>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; margin-top: 0;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">© 2025 Amuse Bush Camp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">Connecting children with nature through outdoor education</p>
        </div>
      </body>
      </html>
    `;

    console.log('📤 Sending email via SendGrid to:', email);

    // Send email via SendGrid
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: email }],
        }],
        from: {
          email: 'peterokata47@gmail.com',
          name: 'Amuse Bush Camp'
        },
        subject: `Registration Confirmed - ${programTitle}`,
        content: [{
          type: 'text/html',
          value: emailHtml
        }],
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true }
        }
      })
    });

    const responseStatus = emailResponse.status;
    console.log('📬 SendGrid response status:', responseStatus);

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('❌ SendGrid API error:', errorText);
      throw new Error(`SendGrid returned ${responseStatus}: ${errorText}`);
    }

    const messageId = emailResponse.headers.get('X-Message-Id') || 'unknown';
    console.log('✅ Email sent! Message ID:', messageId);

    // Track delivery (async, non-blocking)
    try {
      console.log('📊 Tracking email delivery in database...');
      const { error: trackError } = await supabase
        .from('email_deliveries')
        .insert({
          recipient_email: email.toLowerCase(),
          message_id: messageId,
          status: 'sent',
          email_type: 'program_confirmation',
          program_type: programType,
          sent_at: new Date().toISOString()
        });

      if (trackError) {
        console.error('⚠️ Error tracking delivery:', trackError);
      } else {
        console.log('✅ Delivery tracked successfully');
      }
    } catch (trackError) {
      console.error('⚠️ Exception tracking delivery:', trackError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: messageId,
        email: email,
        programType: programType
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("❌ Error in send-program-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);
