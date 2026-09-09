// List Paystack transactions and upsert any missing ones into the local payments table.
// Admin/accounts only. Requires PAYSTACK_SECRET_KEY.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const reconcileCampRegistrationPayment = async (
  admin: any,
  registrationId: string | null,
  paymentMethod?: string | null,
  reference?: string | null,
) => {
  if (!registrationId) return

  const { data: reg, error: regErr } = await admin
    .from('camp_registrations')
    .select('id, total_amount, discount_amount')
    .eq('id', registrationId)
    .maybeSingle()

  if (regErr || !reg) return

  const { data: allPaid } = await admin
    .from('payments')
    .select('amount, status, source')
    .eq('registration_id', registrationId)

  const totalPaid = (allPaid || [])
    .filter((p: any) => {
      const s = String(p.status || '').toLowerCase()
      const src = String(p.source || '')
      return src !== 'camp_registration_attempt' && (s === 'completed' || s === 'paid' || s === '')
    })
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)

  const netTotal = Math.max(0, (Number(reg.total_amount) || 0) - (Number(reg.discount_amount) || 0))
  const newStatus = totalPaid >= netTotal ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid'
  const updates: Record<string, string> = { payment_status: newStatus }
  if (newStatus === 'paid') updates.billing_doc_type = 'paid'
  if (paymentMethod) updates.payment_method = paymentMethod
  if (reference) updates.payment_reference = reference

  const { error: updErr } = await admin
    .from('camp_registrations')
    .update(updates)
    .eq('id', registrationId)

  if (updErr) console.error('Registration reconciliation failed:', registrationId, updErr.message)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const paystackSecretKey =
      Deno.env.get('PAYSTACK_SECRET_KEY') ||
      Deno.env.get('PAYSTACK_SECRET_API') ||
      Deno.env.get('PAYSTACK_LIVE_SECRET_KEY') ||
      Deno.env.get('PAYSTACK_SECRET')

    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: 'Server configuration error: missing database credentials' }, 500)
    }

    if (!paystackSecretKey) {
      console.error('Paystack sync unavailable: missing PAYSTACK_SECRET_KEY')
      return jsonResponse({
        success: false,
        code: 'PAYSTACK_SECRET_MISSING',
        error: 'Paystack sync is not configured. Add or update the PAYSTACK_SECRET_KEY secret, then retry sync.',
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const admin = createClient(supabaseUrl, serviceKey)
    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) {
      console.error('token validation failed:', userErr?.message || 'No user returned')
      return jsonResponse({ error: 'Invalid or expired authentication token' }, 401)
    }
    const userId = userData.user.id

    // Authorize: admin OR accounts role (query directly to avoid enum mismatch in has_role)
    const { data: roles, error: rolesErr } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
    if (rolesErr) {
      console.error('roles lookup failed:', rolesErr.message)
      return jsonResponse({ error: 'Forbidden', detail: rolesErr.message }, 403)
    }
    const roleNames = (roles || []).map((r: any) => String(r.role))
    const allowed = roleNames.some((r) => ['admin', 'accounts', 'ceo'].includes(r))
    if (!allowed) {
      return jsonResponse({ error: 'Forbidden', roles: roleNames }, 403)
    }

    let body: any = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }
    const perPage = Math.min(Math.max(Number(body.perPage) || 100, 1), 200)
    const page = Math.max(Number(body.page) || 1, 1)
    const from = body.from ? String(body.from) : ''
    const to = body.to ? String(body.to) : ''

    const params = new URLSearchParams({
      perPage: String(perPage),
      page: String(page),
      status: 'success',
    })
    if (from) params.set('from', from)
    if (to) params.set('to', to)

    const psResp = await fetch(`https://api.paystack.co/transaction?${params}`, {
      headers: { Authorization: `Bearer ${paystackSecretKey}` },
      signal: AbortSignal.timeout(20000),
    })
    const psText = await psResp.text()
    let psJson: any = null
    try {
      psJson = psText ? JSON.parse(psText) : null
    } catch {
      psJson = { message: psText || 'Paystack returned a non-JSON response' }
    }
    if (!psResp.ok || !psJson?.status) {
      return new Response(
        JSON.stringify({ error: 'Paystack API error', detail: psJson }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const txs: any[] = Array.isArray(psJson.data) ? psJson.data : []
    let inserted = 0
    let skipped = 0

    for (const tx of txs) {
      const reference = String(tx?.reference || '').trim()
      if (!reference) {
        skipped++
        continue
      }

      const { data: existing } = await admin
        .from('payments')
        .select('id, registration_id, payment_method')
        .eq('payment_reference', reference)
        .maybeSingle()

      if (existing) {
        await reconcileCampRegistrationPayment(
          admin,
          existing.registration_id,
          existing.payment_method,
          reference,
        )
        skipped++
        continue
      }

      const amountKES = Math.round((Number(tx.amount) || 0) / 100)
      const channel = String(tx.channel || '').toLowerCase()
      const paymentMethod =
        channel === 'mobile_money' ? 'mpesa' : channel === 'card' ? 'card' : 'card'

      const metadata = tx.metadata || {}
      const registrationId =
        String(metadata.registrationId || metadata.registration_id || '').trim() || null

      let regRow: any = null
      if (registrationId) {
        const { data } = await admin
          .from('camp_registrations')
          .select('id, parent_name, camp_type')
          .eq('id', registrationId)
          .maybeSingle()
        regRow = data
      }

      const customerEmail =
        tx?.customer?.email || metadata.email || null
      const customerName =
        regRow?.parent_name ||
        [tx?.customer?.first_name, tx?.customer?.last_name].filter(Boolean).join(' ').trim() ||
        customerEmail ||
        'Paystack Customer'

      const paidAt = tx.paid_at || tx.transaction_date || new Date().toISOString()

      const { error: insErr } = await admin.from('payments').insert({
        registration_id: regRow?.id || null,
        registration_type: regRow ? 'camp' : null,
        source: regRow ? 'camp_registration' : 'paystack_external',
        customer_name: customerName,
        program_name: regRow?.camp_type || 'Paystack Transaction',
        amount: amountKES,
        payment_method: paymentMethod,
        payment_reference: reference,
        payment_date: String(paidAt).slice(0, 10),
        status: 'completed',
        notes: `Synced from Paystack (${channel || 'online'})`,
      })

      if (insErr) {
        console.error('Insert failed for', reference, insErr.message)
        skipped++
      } else {
        await reconcileCampRegistrationPayment(admin, regRow?.id || null, paymentMethod, reference)
        inserted++
      }
    }

    return new Response(
      JSON.stringify({
        fetched: txs.length,
        inserted,
        skipped,
        page,
        perPage,
        meta: psJson.meta || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('paystack-list-transactions error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
