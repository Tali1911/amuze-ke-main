import { supabase } from '@/integrations/supabase/client';

export type TillStream = 'mpesa' | 'cash';
export type PeriodType = 'day' | 'month' | 'year';

export interface TillStatement {
  id: string;
  statement_date: string;
  stream: TillStream;
  declared_total: number;
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TillReconciliation {
  id: string;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  stream: TillStream;
  system_total: number;
  declared_total: number;
  variance: number;
  status: 'open' | 'reconciled' | 'disputed';
  notes?: string;
  reconciled_by?: string;
  reconciled_at: string;
}

export interface PaymentRow {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  payment_reference?: string;
  customer_name?: string;
  source?: string;
}

const stmt = () => (supabase as any).from('till_statements');
const recon = () => (supabase as any).from('till_reconciliations');
const pay = () => (supabase as any).from('payments');

const methodsForStream = (stream: TillStream): string[] =>
  stream === 'mpesa' ? ['mpesa'] : ['cash', 'cash_ground'];

export const periodRange = (type: PeriodType, anchor: Date): { start: string; end: string } => {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  let start: Date, end: Date;
  if (type === 'day') {
    start = new Date(y, m, anchor.getDate());
    end = new Date(y, m, anchor.getDate());
  } else if (type === 'month') {
    start = new Date(y, m, 1);
    end = new Date(y, m + 1, 0);
  } else {
    start = new Date(y, 0, 1);
    end = new Date(y, 11, 31);
  }
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { start: fmt(start), end: fmt(end) };
};

export const tillReconciliationService = {
  async getPayments(stream: TillStream, start: string, end: string): Promise<PaymentRow[]> {
    const { data, error } = await pay()
      .select('id,payment_date,amount,payment_method,payment_reference,customer_name,source')
      .in('payment_method', methodsForStream(stream))
      .eq('status', 'completed')
      .gte('payment_date', start)
      .lte('payment_date', end)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return (data || []) as PaymentRow[];
  },

  async getSystemTotal(stream: TillStream, start: string, end: string): Promise<number> {
    const rows = await this.getPayments(stream, start, end);
    return rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  },

  async getDeclaredTotals(stream: TillStream, start: string, end: string): Promise<TillStatement[]> {
    const { data, error } = await stmt()
      .select('*')
      .eq('stream', stream)
      .gte('statement_date', start)
      .lte('statement_date', end)
      .order('statement_date', { ascending: true });
    if (error) throw error;
    return (data || []) as TillStatement[];
  },

  async upsertDeclaredTotal(date: string, stream: TillStream, declared_total: number, reference?: string, notes?: string): Promise<TillStatement> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await stmt()
      .upsert(
        { statement_date: date, stream, declared_total, reference, notes, created_by: user?.id },
        { onConflict: 'statement_date,stream' }
      )
      .select()
      .single();
    if (error) throw error;
    return data as TillStatement;
  },

  async createReconciliation(input: Omit<TillReconciliation, 'id' | 'reconciled_at' | 'reconciled_by'>): Promise<TillReconciliation> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await recon()
      .insert({ ...input, reconciled_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data as TillReconciliation;
  },

  async listReconciliations(stream?: TillStream): Promise<TillReconciliation[]> {
    let q = recon().select('*').order('reconciled_at', { ascending: false }).limit(100);
    if (stream) q = q.eq('stream', stream);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as TillReconciliation[];
  },
};
