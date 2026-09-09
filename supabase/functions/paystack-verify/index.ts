// Paystack payment verification & sync
// Modes:
//   - default: verify a successful Paystack transaction, update camp_registrations + payments
//   - logFailure=true: record a failed/cancelled attempt in payments (no Paystack call)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface VerifyBody {
  reference: string
  registrationId: string
  logFailure?: boolean
  failureReason?: string
  attemptedAmountKES?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as Partial<VerifyBody>
    const reference = String(body.reference || '').trim()
    const registrationId = String(body.registrationId || '').trim()
    const logFailure = Boolean(body.logFailure)

    if (!reference || !registrationId) {
      return new Response(
        JSON.stringify({ success: false, error: 'reference and registrationId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Fetch registration (needed for both flows)
    const { data: reg, error: regErr } = await supabase
      .from('camp_registrations')
      .select('id, parent_name, email, camp_type, total_amount, discount_amount, payment_status')
      .eq('id', registrationId)
      .maybeSingle()

    if (regErr || !reg) {
      console.error('Registration not found:', regErr)
      return new Response(
        JSON.stringify({ success: false, error: 'Registration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ---------- FAILURE / CANCEL LOGGING ----------
    if (logFailure) {
      const failureReason = String(body.failureReason || 'cancelled').slice(0, 200)
      const attemptedAmount = Math.max(0, Math.round(Number(body.attemptedAmountKES) || 0))
      try {
        await supabase.from('payments').insert({
          registration_id: registrationId,
          registration_type: 'camp',
          source: 'camp_registration_attempt',
          customer_name: reg.parent_name,
          program_name: reg.camp_type,
          amount: attemptedAmount,
          payment_method: 'paystack',
          payment_reference: reference,
          status: 'failed',
          notes: `Paystack attempt ${failureReason}`,
        })
      } catch (e) {
        console.error('Failed-attempt insert failed:', e)
      }
      return new Response(
        JSON.stringify({ success: true, logged: true, reference, reason: failureReason }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ---------- VERIFICATION FLOW ----------
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') || Deno.env.get('PAYSTACK_SECRET_API')
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'PAYSTACK_SECRET_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
    const verifyJson = await verifyRes.json()

    if (!verifyRes.ok || !verifyJson?.status || verifyJson?.data?.status !== 'success') {
      // Log failed verification too
      try {
        await supabase.from('payments').insert({
          registration_id: registrationId,
          registration_type: 'camp',
          source: 'camp_registration_attempt',
          customer_name: reg.parent_name,
          program_name: reg.camp_type,
          amount: 0,
          payment_method: 'paystack',
          payment_reference: reference,
          status: 'failed',
          notes: `Paystack verify failed: ${verifyJson?.message || verifyJson?.data?.status || 'unknown'}`,
        })
      } catch (e) {
        console.error('Verify-failure log insert failed:', e)
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: verifyJson?.message || 'Payment verification failed',
          paystack: verifyJson?.data ?? null,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tx = verifyJson.data
    const thisAmountKES = Math.round((Number(tx.amount) || 0) / 100)
    const channel = String(tx.channel || '').toLowerCase()
    const paymentMethod =
      channel === 'mobile_money' ? 'mpesa' : channel === 'card' ? 'card' : 'card'

    const totalAmount = Math.max(0, (Number(reg.total_amount) || 0) - (Number(reg.discount_amount) || 0))

    // Insert this successful payment (idempotent on payment_reference).
    // Note: we deliberately do NOT key on (registration_id, source) any more
    // because that blocked legitimate partial top-up payments.
    try {
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
          notes: `Paystack ${channel || 'online'} payment`,
        })
        if (insErr) {
          console.error('Payments insert failed:', insErr)
        }
      } else if (existing.status !== 'completed') {
        // Was previously logged as a failed/cancelled attempt — promote it.
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            amount: thisAmountKES,
            payment_method: paymentMethod,
            notes: `Paystack ${channel || 'online'} payment (promoted from attempt)`,
          })
          .eq('id', existing.id)
      }
    } catch (e) {
      console.error('Payments insert/upsert failed:', e)
    }

    // Sum all completed payments for this registration to determine status
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

    const newStatus =
      totalPaid >= totalAmount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid'

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
      console.error('Failed to update registration:', updErr)
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: newStatus,
        amountPaid: totalPaid,
        thisPayment: thisAmountKES,
        totalAmount,
        reference,
        channel,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('paystack-verify error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
