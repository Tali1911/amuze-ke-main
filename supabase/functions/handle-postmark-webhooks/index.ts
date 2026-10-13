import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostmarkBounceEvent {
  RecordType: 'Bounce';
  Type: 'HardBounce' | 'Transient' | 'SpamComplaint';
  TypeCode: number;
  Email: string;
  BouncedAt: string;
  Description: string;
  Details: string;
  MessageID: string;
  Subject: string;
}

interface PostmarkDeliveryEvent {
  RecordType: 'Delivery';
  MessageID: string;
  Recipient: string;
  DeliveredAt: string;
  Details: string;
}

interface PostmarkOpenEvent {
  RecordType: 'Open';
  MessageID: string;
  Recipient: string;
  ReceivedAt: string;
  FirstOpen: boolean;
}

interface PostmarkClickEvent {
  RecordType: 'Click';
  MessageID: string;
  Recipient: string;
  ReceivedAt: string;
  OriginalLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const event = await req.json();
    console.log('Postmark webhook received:', event.RecordType);

    switch (event.RecordType) {
      case 'Bounce':
        await handleBounce(supabase, event as PostmarkBounceEvent);
        break;
      case 'Delivery':
        await handleDelivery(supabase, event as PostmarkDeliveryEvent);
        break;
      case 'Open':
        await handleOpen(supabase, event as PostmarkOpenEvent);
        break;
      case 'Click':
        await handleClick(supabase, event as PostmarkClickEvent);
        break;
      default:
        console.log('Unhandled event type:', event.RecordType);
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

async function handleBounce(supabase: any, event: PostmarkBounceEvent) {
  const email = event.Email.toLowerCase();
  console.log(`Processing ${event.Type} for ${email}`);

  // Determine suppression type
  let suppressionType: 'bounce_hard' | 'bounce_soft' | 'spam_complaint';
  if (event.Type === 'HardBounce') {
    suppressionType = 'bounce_hard';
  } else if (event.Type === 'SpamComplaint') {
    suppressionType = 'spam_complaint';
  } else {
    suppressionType = 'bounce_soft';
  }

  // Add to suppression list for hard bounces and spam complaints
  if (event.Type === 'HardBounce' || event.Type === 'SpamComplaint') {
    await supabase
      .from('email_suppressions')
      .upsert({
        email,
        suppression_type: suppressionType,
        reason: event.Description,
        bounce_date: event.BouncedAt
      }, { onConflict: 'email' });

    // Mark email as invalid in leads table
    await supabase
      .from('leads')
      .update({ email_valid: false })
      .eq('email', email);
  }

  // Update bounce count for soft bounces
  if (event.Type === 'Transient') {
    const { data: lead } = await supabase
      .from('leads')
      .select('bounce_count')
      .eq('email', email)
      .maybeSingle();

    const newBounceCount = (lead?.bounce_count || 0) + 1;

    await supabase
      .from('leads')
      .update({
        bounce_count: newBounceCount,
        last_bounce_date: event.BouncedAt,
        email_valid: newBounceCount < 3 // Invalid after 3 soft bounces
      })
      .eq('email', email);

    // Add to suppression after 3 soft bounces
    if (newBounceCount >= 3) {
      await supabase
        .from('email_suppressions')
        .upsert({
          email,
          suppression_type: 'bounce_soft',
          reason: `${newBounceCount} soft bounces`,
          bounce_date: event.BouncedAt
        }, { onConflict: 'email' });
    }
  }

  // Update delivery tracking
  await supabase
    .from('email_deliveries')
    .update({
      status: 'bounced',
      bounced_at: event.BouncedAt,
      postmark_data: event
    })
    .eq('message_id', event.MessageID);
}

async function handleDelivery(supabase: any, event: PostmarkDeliveryEvent) {
  const email = event.Recipient.toLowerCase();
  console.log(`Email delivered to ${email}`);

  await supabase
    .from('email_deliveries')
    .update({
      status: 'delivered',
      delivered_at: event.DeliveredAt,
      postmark_data: event
    })
    .eq('message_id', event.MessageID);
}

async function handleOpen(supabase: any, event: PostmarkOpenEvent) {
  const email = event.Recipient.toLowerCase();
  console.log(`Email opened by ${email}, first open: ${event.FirstOpen}`);

  if (event.FirstOpen) {
    await supabase
      .from('email_deliveries')
      .update({
        status: 'opened',
        opened_at: event.ReceivedAt,
        postmark_data: event
      })
      .eq('message_id', event.MessageID);
  }
}

async function handleClick(supabase: any, event: PostmarkClickEvent) {
  const email = event.Recipient.toLowerCase();
  console.log(`Link clicked by ${email}: ${event.OriginalLink}`);

  await supabase
    .from('email_deliveries')
    .update({
      status: 'clicked',
      postmark_data: event
    })
    .eq('message_id', event.MessageID);
}

serve(handler);
