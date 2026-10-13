import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendGridEvent {
  email: string;
  event: 'bounce' | 'delivered' | 'open' | 'click' | 'dropped' | 'spamreport';
  timestamp: number;
  reason?: string;
  type?: string;
  sg_message_id: string;
  url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const events: SendGridEvent[] = await req.json();
    console.log(`Processing ${events.length} SendGrid webhook events`);

    for (const event of events) {
      console.log(`Processing ${event.event} for ${event.email}`);

      switch (event.event) {
        case 'bounce':
        case 'dropped':
          await handleBounce(supabase, event);
          break;
        case 'delivered':
          await handleDelivery(supabase, event);
          break;
        case 'open':
          await handleOpen(supabase, event);
          break;
        case 'click':
          await handleClick(supabase, event);
          break;
        case 'spamreport':
          await handleSpamReport(supabase, event);
          break;
        default:
          console.log('Unhandled event type:', event.event);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

async function handleBounce(supabase: any, event: SendGridEvent) {
  const email = event.email.toLowerCase();
  const isHardBounce = event.type === 'bounce' || event.event === 'dropped';

  const suppressionType = isHardBounce ? 'bounce_hard' : 'bounce_soft';

  if (isHardBounce) {
    await supabase
      .from('email_suppressions')
      .upsert({
        email,
        suppression_type: suppressionType,
        reason: event.reason || 'Email bounced',
        bounce_date: new Date(event.timestamp * 1000).toISOString()
      }, { onConflict: 'email' });

    await supabase
      .from('leads')
      .update({ email_valid: false })
      .eq('email', email);
  }

  if (!isHardBounce) {
    const { data: lead } = await supabase
      .from('leads')
      .select('bounce_count')
      .eq('email', email)
      .maybeSingle();

    const bounceCount = (lead?.bounce_count || 0) + 1;

    await supabase
      .from('leads')
      .update({
        bounce_count: bounceCount,
        last_bounce_date: new Date(event.timestamp * 1000).toISOString(),
        email_valid: bounceCount >= 3 ? false : true
      })
      .eq('email', email);

    if (bounceCount >= 3) {
      await supabase
        .from('email_suppressions')
        .upsert({
          email,
          suppression_type: 'bounce_soft',
          reason: `3+ soft bounces: ${event.reason || 'Unknown'}`,
          bounce_date: new Date(event.timestamp * 1000).toISOString()
        }, { onConflict: 'email' });
    }
  }

  await supabase
    .from('email_deliveries')
    .update({
      status: 'bounced',
      bounce_type: isHardBounce ? 'hard' : 'soft',
      bounce_reason: event.reason,
      bounced_at: new Date(event.timestamp * 1000).toISOString()
    })
    .eq('message_id', event.sg_message_id);
}

async function handleDelivery(supabase: any, event: SendGridEvent) {
  await supabase
    .from('email_deliveries')
    .update({
      status: 'delivered',
      delivered_at: new Date(event.timestamp * 1000).toISOString()
    })
    .eq('message_id', event.sg_message_id);
}

async function handleOpen(supabase: any, event: SendGridEvent) {
  await supabase
    .from('email_deliveries')
    .update({
      status: 'opened',
      opened_at: new Date(event.timestamp * 1000).toISOString()
    })
    .eq('message_id', event.sg_message_id);
}

async function handleClick(supabase: any, event: SendGridEvent) {
  await supabase
    .from('email_deliveries')
    .update({
      status: 'clicked',
      clicked_at: new Date(event.timestamp * 1000).toISOString(),
      click_url: event.url
    })
    .eq('message_id', event.sg_message_id);
}

async function handleSpamReport(supabase: any, event: SendGridEvent) {
  const email = event.email.toLowerCase();

  await supabase
    .from('email_suppressions')
    .upsert({
      email,
      suppression_type: 'complaint',
      reason: 'Spam complaint',
      bounce_date: new Date(event.timestamp * 1000).toISOString()
    }, { onConflict: 'email' });

  await supabase
    .from('leads')
    .update({ email_valid: false })
    .eq('email', email);

  await supabase
    .from('email_deliveries')
    .update({
      status: 'spam',
      bounced_at: new Date(event.timestamp * 1000).toISOString()
    })
    .eq('message_id', event.sg_message_id);
}

serve(handler);
