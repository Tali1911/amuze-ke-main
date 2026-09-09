import { supabase } from '@/integrations/supabase/client';

export interface PaymentHistoryRow {
  id: string;
  payment_reference: string | null;
  amount: number;
  payment_method: string | null;
  payment_date: string | null;
  status: string | null;
  source: string | null;
  customer_name: string | null;
  program_name: string | null;
  notes: string | null;
  created_at: string | null;
  registration_id: string | null;
  registration_number: string | null;
  parent_name: string | null;
}

export interface ListLocalPaymentsParams {
  scope: 'all' | 'camp';
  search?: string;
  from?: string; // YYYY-MM-DD
  to?: string;
  page: number;
  pageSize: number;
}

export const paystackPaymentsService = {
  async listLocalPayments(
    params: ListLocalPaymentsParams
  ): Promise<{ rows: PaymentHistoryRow[]; total: number }> {
    const { scope, search, from, to, page, pageSize } = params;
    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    let query = (supabase as any)
      .from('payments')
      .select(
        `id, payment_reference, amount, payment_method, payment_date, status, source,
         customer_name, program_name, notes, created_at, registration_id`,
        { count: 'exact' }
      )
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (scope === 'camp') {
      query = query.not('registration_id', 'is', null);
    }
    if (from) query = query.gte('payment_date', from);
    if (to) query = query.lte('payment_date', to);
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      query = query.or(
        `payment_reference.ilike.${s},customer_name.ilike.${s},program_name.ilike.${s}`
      );
    }

    const { data, count, error } = await query.range(fromIdx, toIdx);
    if (error) throw error;

    const regIds = Array.from(
      new Set((data || []).map((r: any) => r.registration_id).filter(Boolean))
    );
    let regMap: Record<string, { registration_number: string | null; parent_name: string | null }> = {};
    if (regIds.length) {
      const { data: regs } = await (supabase as any)
        .from('camp_registrations')
        .select('id, registration_number, parent_name')
        .in('id', regIds);
      regMap = Object.fromEntries(
        (regs || []).map((r: any) => [
          r.id,
          { registration_number: r.registration_number, parent_name: r.parent_name },
        ])
      );
    }

    const rows: PaymentHistoryRow[] = (data || []).map((r: any) => ({
      id: r.id,
      payment_reference: r.payment_reference,
      amount: Number(r.amount) || 0,
      payment_method: r.payment_method,
      payment_date: r.payment_date,
      status: r.status,
      source: r.source,
      customer_name: r.customer_name,
      program_name: r.program_name,
      notes: r.notes,
      created_at: r.created_at,
      registration_id: r.registration_id,
      registration_number: r.registration_id ? regMap[r.registration_id]?.registration_number || null : null,
      parent_name: r.registration_id ? regMap[r.registration_id]?.parent_name || null : null,
    }));

    return { rows, total: count || 0 };
  },


  async syncFromPaystack(opts: { from?: string; to?: string; page?: number; perPage?: number }) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error('You are not signed in. Please log in again and retry.');
    }

    const supabaseClient = supabase as any;
    const functionsBaseUrl = (supabaseClient.functionsUrl?.href || `${supabaseClient.supabaseUrl}/functions/v1`).replace(/\/$/, '');
    const response = await fetch(`${functionsBaseUrl}/paystack-list-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: supabaseClient.supabaseKey,
      },
      body: JSON.stringify({
        from: opts.from || '',
        to: opts.to || '',
        page: opts.page || 1,
        perPage: opts.perPage || 100,
      }),
    });

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text };
    }

    if (!response.ok || data?.success === false) {
      const detail = typeof data?.detail === 'string'
        ? data.detail
        : data?.detail
          ? JSON.stringify(data.detail)
          : '';
      throw new Error(data?.error ? `${data.error}${detail ? `: ${detail}` : ''}` : `Paystack sync failed with status ${response.status}`);
    }

    return data as {
      fetched: number;
      inserted: number;
      skipped: number;
      page: number;
      perPage: number;
      meta?: any;
    };
  },
};
