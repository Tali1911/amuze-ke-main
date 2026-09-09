// Paystack webhook receiver
// Validates the x-paystack-signature header (HMAC SHA-512 of raw body using PAYSTACK_SECRET_KEY)
// and reconciles successful charges into payments + camp_registrations.
// Idempotent: safe to receive duplicate deliveries.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { createHmac } from 'node:crypto'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-paystack-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') || Deno.env.get('PAYSTACK_SECRET_API')
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Read RAW body — required for signature verification
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature') || ''

    const expected = createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex')

    if (!signature || signature !== expected) {
      console.warn('Invalid Paystack signature', {
        got: signature?.slice(0, 16),
        expected: expected.slice(0, 16),
      })
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let event: any
    try {
      event = JSON.parse(rawBody)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const eventType = String(event?.event || '')
    console.log('Paystack webhook received:', eventType, event?.data?.reference)

    const SUCCESS_EVENTS = ['charge.success']
    const NEGATIVE_EVENTS = [
      'charge.failed',
      'charge.reversed',
      'refund.processed',
      'refund.pending',
      'refund.failed',
      'transfer.reversed',
    ]

    // Acknowledge anything we don't act on with 200 so Paystack stops retrying.
    if (!SUCCESS_EVENTS.includes(eventType) && !NEGATIVE_EVENTS.includes(eventType)) {
      return new Response(JSON.stringify({ received: true, ignored: eventType }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tx = event.data || {}
    const reference = String(
      tx.reference || tx.transaction_reference || tx.transaction?.reference || ''
    ).trim()
    if (!reference) {
      return new Response(JSON.stringify({ error: 'Missing reference' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)


    // Resolve registrationId from metadata; fallback to payments table lookup by reference
    const metadata = tx.metadata || {}
    let registrationId: string =
      String(metadata.registrationId || metadata.registration_id || '').trim()

    if (!registrationId) {
      const { data: priorPayment } = await supabase
        .from('payments')
        .select('registration_id')
        .eq('payment_reference', reference)
        .not('registration_id', 'is', null)
        .maybeSingle()
      if (priorPayment?.registration_id) {
        registrationId = priorPayment.registration_id
      }
    }

    if (!registrationId) {
      console.warn('Webhook: no registrationId resolved for reference', reference)
      // Acknowledge so Paystack doesn't retry forever; nothing actionable.
      return new Response(
        JSON.stringify({ received: true, warning: 'no_registration_id', reference }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Load registration
    const { data: reg, error: regErr } = await supabase
      .from('camp_registrations')
      .select('id, parent_name, email, camp_type, total_amount, discount_amount, payment_status')
      .eq('id', registrationId)
      .maybeSingle()

    if (regErr || !reg) {
      console.error('Webhook: registration not found', registrationId, regErr)
      return new Response(
        JSON.stringify({ received: true, warning: 'registration_not_found', registrationId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const totalAmount = Math.max(
      0,
      (Number(reg.total_amount) || 0) - (Number(reg.discount_amount) || 0)
    )

    // Recompute paid total from completed payments only
    const recomputeStatus = async () => {
      const { data: allPaid } = await supabase
        .from('payments')
        .select('amount, status, source')
        .eq('registration_id', registrationId)

      const totalPaid = (allPaid || [])
        .filter((p: any) => {
          const s = String(p.status || '').toLowerCase()
          const src = String(p.source || '')
          return src !== 'camp_registration_attempt' && (s === 'completed' || s === '' || s === 'paid')
        })
        .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)

      const status = totalPaid >= totalAmount && totalPaid > 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid'
      return { totalPaid, status }
    }

    // ===== Failures / reversals / refunds =====
    if (NEGATIVE_EVENTS.includes(eventType)) {
      const isRefund = eventType.startsWith('refund.')
      const refundFailed = eventType === 'refund.failed'

      if (refundFailed) {
        // Refund did not go through — the original payment stands. Nothing to reverse.
        return new Response(
          JSON.stringify({ received: true, reference, registrationId, ignored: eventType }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const newPaymentStatus = isRefund ? 'refunded' : 'failed'

      const { data: existingNeg } = await supabase
        .from('payments')
        .select('id, status')
        .eq('payment_reference', reference)
        .eq('registration_id', registrationId)
        .maybeSingle()

      if (existingNeg) {
        if (String(existingNeg.status || '').toLowerCase() !== newPaymentStatus) {
          const { error: negErr } = await supabase
            .from('payments')
            .update({
              status: newPaymentStatus,
              notes: `Paystack ${eventType} (webhook) — payment reversed/not completed`,
            })
            .eq('id', existingNeg.id)
          if (negErr) console.error('Webhook: payment reversal update failed', negErr)
        } else {
          console.log('Webhook: reversal already applied for', reference)
        }
      } else {
        // Log the failed/refunded attempt so accounts has a trail
        const { error: insNegErr } = await supabase.from('payments').insert({
          registration_id: registrationId,
          registration_type: 'camp',
          source: 'camp_registration_attempt',
          customer_name: reg.parent_name,
          program_name: reg.camp_type,
          amount: Math.round((Number(tx.amount) || 0) / 100),
          payment_method: 'card',
          payment_reference: reference,
          payment_date: new Date().toISOString().slice(0, 10),
          status: newPaymentStatus,
          notes: `Paystack ${eventType} (webhook)`,
        })
        if (insNegErr) console.error('Webhook: failed-attempt insert failed', insNegErr)
      }

      const { totalPaid, status } = await recomputeStatus()

      const negUpdates: Record<string, string> = { payment_status: status }
      if (status !== 'paid') negUpdates.billing_doc_type = 'quotation'
      if (status === 'unpaid') negUpdates.payment_method = 'pending'

      const { error: negRegErr } = await supabase
        .from('camp_registrations')
        .update(negUpdates)
        .eq('id', registrationId)
      if (negRegErr) console.error('Webhook: registration reversal update failed', negRegErr)

      // Notify the client so their latest email matches reality
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
      if (RESEND_API_KEY && reg.email) {
        const balance = Math.max(0, totalAmount - totalPaid)
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Amuse Kenya <registration@amusekenya.co.ke>',
              to: [reg.email],
              subject: isRefund
                ? 'Your payment has been refunded — balance still outstanding'
                : 'Your card payment could not be completed',
              html: `
                <div style="font-family: Arial, sans-serif; color: #2b4321;">
                  <p>Dear ${reg.parent_name || 'Parent'},</p>
                  <p>${
                    isRefund
                      ? 'Your recent card payment was reversed and the amount has been refunded by our payment provider, so it has not been applied to your registration.'
                      : 'Unfortunately your recent card payment did not go through, so no amount has been applied to your registration.'
                  }</p>
                  <p><strong>Total Amount:</strong> KES ${totalAmount.toLocaleString()}<br/>
                     <strong>Amount Paid:</strong> KES ${totalPaid.toLocaleString()}<br/>
                     <strong>Balance Due:</strong> KES ${balance.toLocaleString()}<br/>
                     <strong>Reference:</strong> ${reference}</p>
                  <p>You can retry payment any time from <strong>My Registrations</strong> on our website, or pay on arrival.</p>
                  <p>Sorry for the inconvenience,<br/>Amuse Kenya Team</p>
                </div>
              `,
            }),
          })
        } catch (mailErr) {
          console.error('Webhook: reversal notice email failed (non-blocking)', mailErr)
        }
      }

      return new Response(
        JSON.stringify({
          received: true,
          reference,
          registrationId,
          event: eventType,
          status,
          amountPaid: totalPaid,
          totalAmount,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const thisAmountKES = Math.round((Number(tx.amount) || 0) / 100)
    const channel = String(tx.channel || '').toLowerCase()
    const paymentMethod =
      channel === 'mobile_money' ? 'mpesa' : channel === 'card' ? 'card' : 'card'


    // Idempotency: only insert if no payment with this reference + registration exists
    const { data: existing } = await supabase
      .from('payments')
      .select('id, status')
      .eq('payment_reference', reference)
      .eq('registration_id', registrationId)
      .maybeSingle()

    if (!existing) {
      const { error: insErr } = await supabase.from('payments').insert({
        registration_id: registrationId,
        registration_type: 'camp',
        source: 'camp_registration',
        customer_name: reg.parent_name,
        program_name: reg.camp_type,
        amount: thisAmountKES,
        payment_method: paymentMethod,
        payment_reference: reference,
        payment_date: new Date().toISOString().slice(0, 10),
        status: 'completed',
        notes: `Paystack ${channel || 'online'} payment (webhook)`,
      })
      if (insErr) {
        console.error('Webhook: payments insert failed', insErr)
      }
    } else if (existing.status !== 'completed') {
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          amount: thisAmountKES,
          payment_method: paymentMethod,
          notes: `Paystack ${channel || 'online'} payment (webhook, promoted)`,
        })
        .eq('id', existing.id)
    } else {
      console.log('Webhook: payment already recorded for', reference)
    }

    // Recompute total paid and update registration status
    const { totalPaid, status: newStatus } = await recomputeStatus()


    const registrationUpdates: Record<string, string> = {
      payment_status: newStatus,
      payment_method: paymentMethod,
      payment_reference: reference,
    }
    if (newStatus === 'paid') registrationUpdates.billing_doc_type = 'paid'

    const { error: updErr } = await supabase
      .from('camp_registrations')
      .update(registrationUpdates)
      .eq('id', registrationId)

    if (updErr) {
      console.error('Webhook: registration update failed', updErr)
    }

    return new Response(
      JSON.stringify({
        received: true,
        reference,
        registrationId,
        status: newStatus,
        amountPaid: totalPaid,
        totalAmount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('paystack-webhook error:', err)
    // Return 200 so Paystack does not endlessly retry on our internal bugs;
    // logs above will surface the issue.
    return new Response(
      JSON.stringify({ received: true, error: err instanceof Error ? err.message : 'unknown' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
