// Resend webhook handler for email event tracking
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Webhook } from 'https://esm.sh/svix@1.15.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    bounce?: {
      type: 'hard_bounce' | 'soft_bounce';
    };
    click?: {
      link: string;
      timestamp: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🎣 Resend webhook received');
  console.log(`📍 Request method: ${req.method}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    // Get raw body for signature verification
    const payload = await req.text();
    
    // SECURITY: Webhook signature verification is MANDATORY in production
    if (!webhookSecret) {
      console.error('❌ RESEND_WEBHOOK_SECRET not configured - rejecting request');
      return new Response(
        JSON.stringify({ error: 'Webhook configuration error' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify webhook signature
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('❌ Missing Svix headers');
      return new Response(
        JSON.stringify({ error: 'Missing webhook signature headers' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const wh = new Webhook(webhookSecret);
      wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
      console.log('✅ Webhook signature verified');
    } catch (verifyError) {
      console.error('❌ Webhook signature verification failed:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    const event: ResendWebhookEvent = JSON.parse(payload);
    console.log(`📧 Event type: ${event.type}`);
    console.log(`📊 Event data:`, JSON.stringify(event.data, null, 2));

    const { email_id, from, to, subject } = event.data;
    const recipientEmail = to[0]; // Resend sends array of recipients

    // Find existing delivery record by message_id
    const { data: existingDelivery } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('message_id', email_id)
      .maybeSingle();

    // Handle different event types
    switch (event.type) {
      case 'email.sent':
        console.log(`✅ Email sent to ${recipientEmail}`);
        if (!existingDelivery) {
          await supabase
            .from('email_deliveries')
            .insert({
              email: recipientEmail,
              message_id: email_id,
              email_type: 'transactional',
              subject: subject,
              status: 'sent',
              postmark_data: { provider: 'resend', event: event },
              sent_at: event.created_at
            });
        }
        break;

      case 'email.delivered':
        console.log(`📬 Email delivered to ${recipientEmail}`);
        if (existingDelivery) {
          await supabase
            .from('email_deliveries')
            .update({
              status: 'delivered',
              delivered_at: event.created_at,
              postmark_data: { provider: 'resend', event: event }
            })
            .eq('message_id', email_id);
        }
        break;

      case 'email.delivery_delayed':
        console.log(`⏱️ Email delivery delayed for ${recipientEmail}`);
        if (existingDelivery) {
          await supabase
            .from('email_deliveries')
            .update({
              postmark_data: { provider: 'resend', event: event }
            })
            .eq('message_id', email_id);
        }
        break;

      case 'email.bounced':
        console.log(`🚫 Email bounced for ${recipientEmail}`);
        const bounceType = event.data.bounce?.type || 'hard_bounce';
        const isHardBounce = bounceType === 'hard_bounce';

        // Update delivery record
        if (existingDelivery) {
          await supabase
            .from('email_deliveries')
            .update({
              status: 'bounced',
              bounced_at: event.created_at,
              bounce_type: bounceType,
              bounce_reason: `Resend ${bounceType}`,
              postmark_data: { provider: 'resend', event: event }
            })
            .eq('message_id', email_id);
        }

        // Handle hard bounces - suppress immediately
        if (isHardBounce) {
          console.log(`❌ Hard bounce detected - suppressing ${recipientEmail}`);
          
          const { error: suppressError } = await supabase
            .from('email_suppressions')
            .upsert({
              email: recipientEmail,
              suppression_type: 'bounce_hard',
              reason: `Hard bounce from Resend on ${event.created_at}`,
              bounce_date: event.created_at
            }, {
              onConflict: 'email'
            });

          if (suppressError) {
            console.error('Error suppressing email:', suppressError);
          }

          // Update leads table
          await supabase
            .from('leads')
            .update({
              email_valid: false,
              bounce_count: supabase.rpc('increment', { row_id: recipientEmail }),
              last_bounce_date: event.created_at
            })
            .eq('email', recipientEmail);
        } else {
          // Handle soft bounces - track count
          console.log(`⚠️ Soft bounce detected for ${recipientEmail}`);
          
          const { data: lead } = await supabase
            .from('leads')
            .select('bounce_count')
            .eq('email', recipientEmail)
            .maybeSingle();

          const newBounceCount = (lead?.bounce_count || 0) + 1;
          
          await supabase
            .from('leads')
            .update({
              bounce_count: newBounceCount,
              last_bounce_date: event.created_at
            })
            .eq('email', recipientEmail);

          // Suppress after 3 soft bounces
          if (newBounceCount >= 3) {
            console.log(`❌ 3 soft bounces reached - suppressing ${recipientEmail}`);
            await supabase
              .from('email_suppressions')
              .upsert({
                email: recipientEmail,
                suppression_type: 'bounce_soft',
                reason: `3 soft bounces from Resend, last on ${event.created_at}`,
                bounce_date: event.created_at
              }, {
                onConflict: 'email'
              });

            await supabase
              .from('leads')
              .update({ email_valid: false })
              .eq('email', recipientEmail);
          }
        }
        break;

      case 'email.complained':
        console.log(`🚨 Spam complaint received for ${recipientEmail}`);
        
        // Update delivery record
        if (existingDelivery) {
          await supabase
            .from('email_deliveries')
            .update({
              status: 'spam',
              postmark_data: { provider: 'resend', event: event }
            })
            .eq('message_id', email_id);
        }

        // Add to suppression list
        await supabase
          .from('email_suppressions')
          .upsert({
            email: recipientEmail,
            suppression_type: 'spam_complaint',
            reason: `Spam complaint from Resend on ${event.created_at}`,
            bounce_date: event.created_at
          }, {
            onConflict: 'email'
          });

        // Update leads table
        await supabase
          .from('leads')
          .update({
            email_valid: false,
            email_subscribed: false,
            unsubscribed_at: event.created_at
          })
          .eq('email', recipientEmail);
        break;

      case 'email.opened':
        console.log(`👀 Email opened by ${recipientEmail}`);
        if (existingDelivery) {
          await supabase
            .from('email_deliveries')
            .update({
              status: 'opened',
              opened_at: event.created_at,
              postmark_data: { provider: 'resend', event: event }
            })
            .eq('message_id', email_id);
        }
        break;

      case 'email.clicked':
        console.log(`🖱️ Email link clicked by ${recipientEmail}`);
        const clickUrl = event.data.click?.link || 'unknown';
        
        if (existingDelivery) {
          await supabase
            .from('email_deliveries')
            .update({
              status: 'clicked',
              click_url: clickUrl,
              postmark_data: { provider: 'resend', event: event }
            })
            .eq('message_id', email_id);
        }
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ success: true, event_type: event.type }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error('❌ Error processing Resend webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);
