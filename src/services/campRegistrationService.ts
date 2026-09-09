import { supabase } from '@/integrations/supabase/client';
import { CampRegistration, CampChild } from '@/types/campRegistration';
import { Tables } from '@/integrations/supabase/types';
import { financialService } from './financialService';

type DbCampRegistration = Tables<'camp_registrations'>;

// Helper to convert DB row to CampRegistration
const fromDb = (row: DbCampRegistration): CampRegistration => ({
  ...row,
  children: row.children as unknown as CampChild[],
} as CampRegistration);

// Helper to convert CampRegistration to DB format
const toDb = (data: Partial<CampRegistration>): any => ({
  ...data,
  children: data.children ? (data.children as any) : undefined,
});

const isCompletedPayment = (payment: any) => {
  const status = String(payment?.status || '').toLowerCase();
  const source = String(payment?.source || '');
  return source !== 'camp_registration_attempt' && (status === 'completed' || status === 'paid' || status === '');
};

const withResolvedPaymentStatuses = async (registrations: CampRegistration[]): Promise<CampRegistration[]> => {
  const ids = registrations.map((reg) => reg.id).filter(Boolean) as string[];
  if (!ids.length) return registrations;

  const { data, error } = await (supabase as any)
    .from('payments')
    .select('registration_id, amount, status, source, payment_method, payment_reference, created_at')
    .in('registration_id', ids)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error resolving registration payments:', error);
    return registrations;
  }

  const totals = new Map<string, number>();
  const latest = new Map<string, { method?: string; reference?: string }>();
  (data || []).filter(isCompletedPayment).forEach((payment: any) => {
    const registrationId = payment.registration_id;
    if (!registrationId) return;
    totals.set(registrationId, (totals.get(registrationId) || 0) + (Number(payment.amount) || 0));
    if (!latest.has(registrationId)) {
      latest.set(registrationId, {
        method: payment.payment_method || undefined,
        reference: payment.payment_reference || undefined,
      });
    }
  });

  return registrations.map((registration): CampRegistration => {
    const paidAmount = totals.get(registration.id || '') || 0;
    if (paidAmount <= 0) return registration;

    const discount = Number((registration as any).discount_amount) || 0;
    const netTotal = Math.max(0, (Number(registration.total_amount) || 0) - discount);
    const payment = latest.get(registration.id || '');

    if (paidAmount >= netTotal) {
      return {
        ...registration,
        payment_status: 'paid' as const,
        billing_doc_type: 'paid' as const,
        payment_method: (payment?.method as CampRegistration['payment_method']) || registration.payment_method,
        payment_reference: payment?.reference || registration.payment_reference,
      };
    }

    if (registration.payment_status !== 'paid') {
      return {
        ...registration,
        payment_status: 'partial' as const,
        payment_method: (payment?.method as CampRegistration['payment_method']) || registration.payment_method,
        payment_reference: payment?.reference || registration.payment_reference,
      };
    }

    return registration;
  });
};

export const campRegistrationService = {
  async createRegistration(
    data: Omit<CampRegistration, 'id' | 'registration_number' | 'created_at' | 'updated_at'>
  ) {
    // Generate a temporary ID for client-side use (we avoid SELECT for anon users)
    const tempId = crypto.randomUUID();

    // IMPORTANT:
    // A DB trigger is expected to generate `registration_number`, but we are currently
    // seeing frequent failures:
    //   duplicate key value violates unique constraint camp_registrations_registration_number_key
    // To keep registrations unblocked, we generate a unique registration number client-side.
    const campType = (data as any).camp_type as string | undefined;
    const prefix = (() => {
      switch (campType) {
        case 'little-forest':
          return 'LF';
        case 'day-camps':
          return 'DC';
        case 'holiday-camp':
          return 'HC';
        default:
          return 'CR';
      }
    })();

    // Short, collision-resistant token: time + random
    const rand = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase();
    const time = Date.now().toString(36).toUpperCase();
    const registrationNumber = `${prefix}-${time}-${rand}`;

    // Derive billing doc type + quote/invoice number from initial payment status.
    // Unpaid/partial registrations begin life as a QUOTATION; paying converts it to an
    // INVOICE (handled by DB trigger). Attendance also converts quote -> invoice.
    const initialPaymentStatus = (data as any).payment_status as string | undefined;
    const isPaid = initialPaymentStatus === 'paid';
    const billingDocType: 'quotation' | 'invoice' | 'paid' = isPaid ? 'paid' : 'quotation';
    const quoteNumber = `QUO-${time}-${rand}`;
    const invoiceNumber = isPaid ? `INV-${time}-${rand}` : undefined;

    const insertData = {
      ...toDb(data),
      id: tempId,
      // Override/bypass DB auto-generation if it is misbehaving
      registration_number: registrationNumber,
      billing_doc_type: billingDocType,
      quote_number: quoteNumber,
      ...(invoiceNumber ? { invoice_number: invoiceNumber } : {}),
    };

    const { error } = await supabase.from('camp_registrations').insert(insertData);

    // IMPORTANT: anonymous users do not have SELECT access, so we must not request
    // returned rows here (no .select(), no .single()).
    if (error) throw error;

    // Return constructed object with temp ID for client use
    return {
      id: tempId,
      ...data,
      registration_number: registrationNumber,
      billing_doc_type: billingDocType,
      quote_number: quoteNumber,
      invoice_number: invoiceNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as CampRegistration;
  },

  async getRegistrationById(id: string) {
    const { data, error } = await supabase
      .from('camp_registrations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    const [registration] = await withResolvedPaymentStatuses([fromDb(data)]);
    return registration;
  },

  async getRegistrationByQRCode(qrCode: string) {
    const { data, error } = await supabase
      .from('camp_registrations')
      .select('*')
      .eq('qr_code_data', qrCode)
      .single();

    if (error) throw error;
    const [registration] = await withResolvedPaymentStatuses([fromDb(data)]);
    return registration;
  },

  async getRegistrationByNumber(registrationNumber: string) {
    const { data, error } = await supabase
      .from('camp_registrations')
      .select('*')
      .eq('registration_number', registrationNumber)
      .single();

    if (error) throw error;
    const [registration] = await withResolvedPaymentStatuses([fromDb(data)]);
    return registration;
  },

  async getAllRegistrations(filters?: {
    campType?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let query = supabase
      .from('camp_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.campType) {
      query = query.eq('camp_type', filters.campType);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    let registrations = await withResolvedPaymentStatuses(data.map(fromDb));
    if (filters?.paymentStatus) {
      registrations = registrations.filter((reg) => reg.payment_status === filters.paymentStatus);
    }
    return registrations;
  },

  async updateRegistration(id: string, updates: Partial<CampRegistration>) {
    const { data, error } = await supabase
      .from('camp_registrations')
      .update(toDb(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async addAdminNote(id: string, note: string) {
    const { data: current } = await supabase
      .from('camp_registrations')
      .select('admin_notes')
      .eq('id', id)
      .single();

    const existingNotes = current?.admin_notes || '';
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${note}`;
    const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

    return this.updateRegistration(id, { admin_notes: updatedNotes });
  },

  async updatePaymentStatus(
    id: string,
    status: 'unpaid' | 'paid' | 'partial',
    method?: 'pending' | 'card' | 'mpesa' | 'cash_ground' | 'bank_transfer',
    reference?: string,
    options?: {
      createPaymentRecord?: boolean;
      parentName?: string;
      campType?: string;
      totalAmount?: number;
      createdBy?: string;
    }
  ) {
    // Guard: a paid registration must record a real payment method.
    // Reject 'pending' or missing method so the row never ends up as paid|pending.
    if (status === 'paid' && (!method || method === 'pending')) {
      throw new Error('Payment method is required when marking a registration as paid. Choose mpesa, card, cash_ground, or bank_transfer.');
    }

    const updates: Partial<CampRegistration> = { payment_status: status };
    if (method) updates.payment_method = method;
    if (reference) updates.payment_reference = reference;

    const result = await this.updateRegistration(id, updates);

    // Create unified payment record if requested and status is paid
    if (options?.createPaymentRecord && status === 'paid' && options.totalAmount) {
      try {
        await financialService.createPaymentFromRegistration({
          registrationId: id,
          registrationType: 'camp',
          source: 'camp_registration',
          customerName: options.parentName || 'Unknown',
          programName: options.campType || 'Camp',
          amount: options.totalAmount,
          paymentMethod: (method === 'pending' ? 'other' : method) || 'mpesa',
          paymentReference: reference,
          notes: 'Payment recorded from camp registration',
          createdBy: options.createdBy
        });
      } catch (error) {
        console.error('Error creating unified payment record:', error);
      }
    }

    return result;
  },

  /**
   * Get total amount paid for a registration from the payments table.
   */
  async getAmountPaidForRegistration(registrationId: string): Promise<number> {
    const { data, error } = await (supabase as any)
      .from('payments')
      .select('amount, status, source')
      .eq('registration_id', registrationId);

    if (error) {
      console.error('Error fetching payments for registration:', error);
      return 0;
    }

    return (data || [])
      .filter(isCompletedPayment)
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  },

  /**
   * Update payment with a specific amount paid. Auto-derives status, syncs payments table & action items.
   */
  async updatePaymentWithAmount(
    id: string,
    amountPaid: number,
    totalAmount: number,
    method?: 'pending' | 'card' | 'mpesa' | 'cash_ground' | 'bank_transfer',
    reference?: string,
    context?: {
      parentName?: string;
      campType?: string;
      children?: { childName: string; price: number }[];
      discountAmount?: number;
    }
  ) {
    const discount = Math.max(0, Number(context?.discountAmount) || 0);
    const effectiveTotal = Math.max(0, totalAmount - discount);

    // Derive status against the discounted (net) total
    let status: 'unpaid' | 'paid' | 'partial' = 'unpaid';
    if (amountPaid >= effectiveTotal && effectiveTotal > 0) status = 'paid';
    else if (amountPaid >= effectiveTotal && effectiveTotal === 0 && discount > 0) status = 'paid';
    else if (amountPaid > 0) status = 'partial';

    // Guard: paid/partial registrations must record a real payment method
    // (skip when amountPaid is 0 but discount makes it paid — still require method for paid).
    if ((status === 'paid' || status === 'partial') && (!method || method === 'pending')) {
      throw new Error('Payment method is required for paid/partial registrations. Choose mpesa, card, cash_ground, or bank_transfer.');
    }

    // 1. Update registration record (include discount_amount and possibly billing_doc_type)
    const updates: Partial<CampRegistration> & Record<string, any> = { payment_status: status };
    if (method) updates.payment_method = method;
    if (reference) updates.payment_reference = reference;
    if (context?.discountAmount !== undefined) updates.discount_amount = discount;
    if (status === 'paid') {
      updates.billing_doc_type = 'paid';
    }
    await this.updateRegistration(id, updates as Partial<CampRegistration>);

    // 2. Upsert payment record (delete old + insert new to avoid duplicate constraint)
    try {
      await (supabase as any).from('payments').delete().eq('registration_id', id).eq('source', 'camp_registration');

      if (amountPaid > 0) {
        await financialService.createPaymentFromRegistration({
          registrationId: id,
          registrationType: 'camp',
          source: 'camp_registration',
          customerName: context?.parentName || 'Unknown',
          programName: context?.campType || 'Camp',
          amount: amountPaid,
          paymentMethod: (method === 'pending' ? 'other' : method) || 'mpesa',
          paymentReference: reference,
          notes: `Admin payment update – KES ${amountPaid} of ${effectiveTotal} (gross ${totalAmount}, discount ${discount})`,
        });
      }
    } catch (err) {
      console.error('Error upserting payment record:', err);
    }

    // 3. Update accounts_action_items for each child (pro-rate discount)
    try {
      const children = context?.children || [];
      const childCount = children.length || 1;
      const perChildPaid = Math.round((amountPaid / childCount) * 100) / 100;
      const perChildDiscount = Math.round((discount / childCount) * 100) / 100;
      const newItemStatus = status === 'paid' ? 'completed' : 'pending';

      for (const child of children) {
        const childDue = Math.max(0, (Number(child.price) || 0) - perChildDiscount);
        await (supabase as any)
          .from('accounts_action_items')
          .update({
            amount_due: childDue,
            amount_paid: perChildPaid,
            status: newItemStatus,
          })
          .eq('registration_id', id)
          .eq('child_name', child.childName);
      }
    } catch (err) {
      console.error('Error updating action items:', err);
    }

    return { status, amountPaid, effectiveTotal, discount };
  },

  /**
   * Update children array + recomputed total_amount for a registration.
   * Used when an operator adjusts a child's session (half/full) after registration.
   */
  async updateChildrenAndTotal(id: string, children: CampChild[], newTotal: number) {
    return this.updateRegistration(id, {
      children,
      total_amount: newTotal,
    } as Partial<CampRegistration>);
  },

  async searchRegistrations(searchTerm: string) {
    const { data, error } = await supabase
      .from('camp_registrations')
      .select('*')
      .or(`registration_number.ilike.%${searchTerm}%,parent_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return withResolvedPaymentStatuses(data.map(fromDb));
  },

  async deleteRegistration(id: string) {
    // First delete related attendance records
    await supabase
      .from('camp_attendance')
      .delete()
      .eq('registration_id', id);

    // Then delete the registration
    const { error } = await supabase
      .from('camp_registrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async deleteRegistrations(ids: string[]) {
    // First delete related attendance records for all registrations
    await supabase
      .from('camp_attendance')
      .delete()
      .in('registration_id', ids);

    // Then delete all registrations
    const { error } = await supabase
      .from('camp_registrations')
      .delete()
      .in('id', ids);

    if (error) throw error;
    return true;
  },
};
