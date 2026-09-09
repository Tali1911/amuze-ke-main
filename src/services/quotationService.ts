import { supabase } from '@/integrations/supabase/client';
import { CampRegistration, CampChild } from '@/types/campRegistration';
import { InvoiceWithItems, InvoiceItem } from './invoiceService';

const fromDb = (row: any): CampRegistration => ({
  ...row,
  children: row.children as unknown as CampChild[],
} as CampRegistration);

export const quotationService = {
  /** List all open quotations (camp registrations that are unpaid & not yet attended). */
  async listQuotations(): Promise<CampRegistration[]> {
    const { data, error } = await (supabase as any)
      .from('camp_registrations')
      .select('*')
      .eq('billing_doc_type', 'quotation')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromDb);
  },

  /** List system-generated invoices: registrations that attended but have not paid (billing_doc_type='invoice'). */
  async listSystemInvoices(): Promise<CampRegistration[]> {
    const { data, error } = await (supabase as any)
      .from('camp_registrations')
      .select('*')
      .eq('billing_doc_type', 'invoice')
      .neq('status', 'cancelled')
      .order('converted_to_invoice_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromDb);
  },

  /**
   * "Delete" a quotation. We do NOT hard-delete the registration (would lose
   * the family record). We clear the quote document fields so the row is
   * removed from the Quotations list. A new quotation can later be re-issued
   * by re-stamping quote_number / billing_doc_type.
   */
  async deleteQuotation(registrationId: string): Promise<void> {
    const { error } = await supabase
      .from('camp_registrations')
      .update({
        quote_number: null,
        billing_doc_type: null as any,
        status: 'cancelled',
      } as any)
      .eq('id', registrationId);

    if (error) throw error;
  },

  /** Convert a CampRegistration into the InvoiceWithItems shape used by the PDF + email helpers. */
  buildInvoiceShape(reg: CampRegistration): InvoiceWithItems {
    const children = reg.children || [];
    const items: InvoiceItem[] = children.length > 0
      ? children.map((child) => {
          const days = Array.isArray(child.selectedDates) ? child.selectedDates.length : 0;
          const desc = `${reg.camp_type} - ${child.childName}${days ? ` (${days} day${days === 1 ? '' : 's'})` : ''}`;
          return {
            description: desc,
            quantity: 1,
            unit_price: Number(child.price) || 0,
            discount_percent: 0,
            discount_amount: 0,
            line_total: Number(child.price) || 0,
          };
        })
      : [{
          description: `${reg.camp_type} camp registration`,
          quantity: 1,
          unit_price: Number(reg.total_amount) || 0,
          discount_percent: 0,
          discount_amount: 0,
          line_total: Number(reg.total_amount) || 0,
        }];

    const subtotal = items.reduce((s, i) => s + i.line_total, 0);

    // Quotation validity: 14 days from creation
    const created = reg.created_at ? new Date(reg.created_at) : new Date();
    const validUntil = new Date(created);
    validUntil.setDate(validUntil.getDate() + 14);

    return {
      id: reg.id || '',
      invoice_number: reg.quote_number || reg.registration_number || 'QUO',
      customer_name: reg.parent_name,
      customer_email: reg.email,
      program_name: reg.camp_type,
      amount: subtotal,
      tax_amount: 0,
      total_amount: Number(reg.total_amount) || subtotal,
      subtotal,
      discount_percent: 0,
      discount_amount: 0,
      due_date: validUntil.toISOString().split('T')[0],
      status: 'draft',
      payment_terms: 'Quote valid for 14 days',
      notes: 'This is a quotation. Payment confirms your booking and converts this into an invoice.',
      created_at: reg.created_at || new Date().toISOString(),
      updated_at: reg.updated_at || new Date().toISOString(),
      registration_id: reg.id,
      registration_type: 'camp',
      items,
    };
  },
};
