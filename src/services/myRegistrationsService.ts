import { supabase } from '@/integrations/supabase/client';

export interface MyRegistrationRow {
  id: string;
  registration_number: string;
  camp_type: string;
  parent_name: string;
  email: string;
  phone: string;
  children: any[];
  total_amount: number;
  payment_status: 'unpaid' | 'paid' | 'partial' | string;
  payment_method: string | null;
  payment_reference: string | null;
  registration_type: string;
  status: string | null;
  created_at: string | null;
  amount_paid?: number;
  amount_remaining?: number;
  billing_doc_type?: 'quotation' | 'invoice' | 'paid';
  quote_number?: string | null;
  invoice_number?: string | null;
  converted_to_invoice_at?: string | null;
  discount_amount?: number;
}

export const myRegistrationsService = {
  /**
   * Fetch all camp registrations for the signed-in user, matched by email,
   * and enrich each with the total amount already paid (sum of completed
   * payments) and the remaining balance (net of any discount).
   */
  async listByEmail(email: string): Promise<MyRegistrationRow[]> {
    if (!email) return [];
    const { data, error } = await supabase
      .from('camp_registrations')
      .select(
        'id, registration_number, camp_type, parent_name, email, phone, children, total_amount, payment_status, payment_method, payment_reference, registration_type, status, created_at, billing_doc_type, quote_number, invoice_number, converted_to_invoice_at, discount_amount'
      )
      .ilike('email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my registrations:', error);
      return [];
    }

    const rows = (data || []) as unknown as MyRegistrationRow[];
    if (rows.length === 0) return rows;

    const ids = rows.map((r) => r.id);
    const { data: pays, error: payErr } = await (supabase as any)
      .from('payments')
      .select('registration_id, amount, status, source')
      .in('registration_id', ids);

    if (payErr) {
      console.warn('Could not fetch payments for registrations:', payErr);
      return rows.map((r) => {
        const net = Math.max(0, (Number(r.total_amount) || 0) - (Number(r.discount_amount) || 0));
        return {
          ...r,
          amount_paid: 0,
          amount_remaining: net,
        };
      });
    }

    const paidByReg: Record<string, number> = {};
    (pays || []).forEach((p: any) => {
      const src = String(p.source || '');
      const st = String(p.status || '').toLowerCase();
      if (src === 'camp_registration_attempt') return;
      if (st && st !== 'completed' && st !== 'paid') return;
      paidByReg[p.registration_id] =
        (paidByReg[p.registration_id] || 0) + (Number(p.amount) || 0);
    });

    return rows.map((r) => {
      const paid = paidByReg[r.id] || 0;
      const total = Number(r.total_amount) || 0;
      const discount = Number(r.discount_amount) || 0;
      const net = Math.max(0, total - discount);
      return {
        ...r,
        amount_paid: paid,
        amount_remaining: Math.max(0, net - paid),
      };
    });
  },
};
