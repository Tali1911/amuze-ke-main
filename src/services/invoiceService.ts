import { supabase, isSupabaseAvailable } from './supabaseService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  line_total: number;
}

export interface InvoiceWithItems {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  program_name?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  subtotal?: number;
  discount_percent?: number;
  discount_amount?: number;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_terms: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  registration_id?: string;
  registration_type?: string;
  items?: InvoiceItem[];
}

const getSupabaseClient = () => supabase as any;

export const invoiceService = {
  // Create invoice with line items
  async createInvoiceWithItems(
    invoice: Omit<InvoiceWithItems, 'id' | 'created_at' | 'updated_at' | 'invoice_number' | 'items'>,
    items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
  ): Promise<InvoiceWithItems> {
    if (!isSupabaseAvailable()) throw new Error('Supabase not available');

    // Generate invoice number
    let invoiceNumber: string;
    try {
      const { data: numData } = await getSupabaseClient().rpc('generate_invoice_number');
      invoiceNumber = numData || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
    } catch {
      invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
    }

    // Create invoice
    const { data: invoiceData, error: invoiceError } = await getSupabaseClient()
      .from('invoices')
      .insert({ ...invoice, invoice_number: invoiceNumber })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create line items
    if (items.length > 0) {
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoice_id: invoiceData.id
      }));

      const { error: itemsError } = await getSupabaseClient()
        .from('invoice_items')
        .insert(itemsWithInvoiceId);

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
      }
    }

    return { ...invoiceData, items } as InvoiceWithItems;
  },

  // Get invoice with items
  async getInvoiceWithItems(invoiceId: string): Promise<InvoiceWithItems | null> {
    if (!isSupabaseAvailable()) return null;

    const { data: invoice, error: invoiceError } = await getSupabaseClient()
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle();

    if (invoiceError || !invoice) return null;

    const { data: items } = await getSupabaseClient()
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);

    return { ...invoice, items: items || [] } as InvoiceWithItems;
  },

  // Calculate line item total
  calculateLineTotal(quantity: number, unitPrice: number, discountPercent: number = 0): number {
    const subtotal = quantity * unitPrice;
    const discount = subtotal * (discountPercent / 100);
    return subtotal - discount;
  },

  // Calculate invoice totals
  calculateInvoiceTotals(
    items: Omit<InvoiceItem, 'id' | 'invoice_id'>[],
    overallDiscountPercent: number = 0,
    taxPercent: number = 0
  ) {
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const discountAmount = subtotal * (overallDiscountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxPercent / 100);
    const totalAmount = afterDiscount + taxAmount;

    return {
      subtotal,
      discount_percent: overallDiscountPercent,
      discount_amount: discountAmount,
      amount: afterDiscount,
      tax_amount: taxAmount,
      total_amount: totalAmount
    };
  },

  // Generate PDF invoice (or quotation)
  generatePDF(invoice: InvoiceWithItems, documentType: 'invoice' | 'quotation' = 'invoice'): Blob {
    const isQuotation = documentType === 'quotation';
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(45, 80, 22); // Forest green
    doc.text(isQuotation ? 'QUOTATION' : 'INVOICE', pageWidth / 2, 25, { align: 'center' });

    // Company info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Amuse Kenya', 14, 40);
    doc.text('Karura Forest, Gate F', 14, 45);
    doc.text('Thigiri Ridge, Nairobi', 14, 50);
    doc.text('info@amusekenya.co.ke', 14, 55);
    doc.text('+254 114 705 763', 14, 60);

    // Invoice details (right side)
    doc.setFontSize(10);
    doc.text(`${isQuotation ? 'Quote' : 'Invoice'} #: ${invoice.invoice_number}`, pageWidth - 14, 40, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, pageWidth - 14, 45, { align: 'right' });
    doc.text(`${isQuotation ? 'Valid Until' : 'Due Date'}: ${new Date(invoice.due_date).toLocaleDateString()}`, pageWidth - 14, 50, { align: 'right' });
    doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 14, 55, { align: 'right' });

    // Bill To
    doc.setFontSize(11);
    doc.setTextColor(45, 80, 22);
    doc.text('Bill To:', 14, 75);
    doc.setTextColor(60);
    doc.setFontSize(10);
    doc.text(invoice.customer_name, 14, 82);
    if (invoice.customer_email) {
      doc.text(invoice.customer_email, 14, 87);
    }

    // Line items table
    const tableData = (invoice.items || []).map(item => [
      item.description,
      item.quantity.toString(),
      `KES ${item.unit_price.toLocaleString()}`,
      item.discount_percent > 0 ? `${item.discount_percent}%` : '-',
      `KES ${item.line_total.toLocaleString()}`
    ]);

    // If no items, show single row with program name
    if (tableData.length === 0 && invoice.program_name) {
      tableData.push([
        invoice.program_name,
        '1',
        `KES ${invoice.amount.toLocaleString()}`,
        '-',
        `KES ${invoice.amount.toLocaleString()}`
      ]);
    }

    autoTable(doc, {
      startY: 95,
      head: [['Description', 'Qty', 'Unit Price', 'Discount', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [45, 80, 22] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 35, halign: 'right' }
      }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.text('Subtotal:', pageWidth - 70, finalY);
    doc.text(`KES ${(invoice.subtotal || invoice.amount).toLocaleString()}`, pageWidth - 14, finalY, { align: 'right' });

    if (invoice.discount_amount && invoice.discount_amount > 0) {
      doc.text(`Discount (${invoice.discount_percent}%):`, pageWidth - 70, finalY + 6);
      doc.text(`-KES ${invoice.discount_amount.toLocaleString()}`, pageWidth - 14, finalY + 6, { align: 'right' });
    }

    if (invoice.tax_amount > 0) {
      doc.text('Tax:', pageWidth - 70, finalY + 12);
      doc.text(`KES ${invoice.tax_amount.toLocaleString()}`, pageWidth - 14, finalY + 12, { align: 'right' });
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', pageWidth - 70, finalY + 22);
    doc.text(`KES ${invoice.total_amount.toLocaleString()}`, pageWidth - 14, finalY + 22, { align: 'right' });

    // Payment terms
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Payment Terms: ${invoice.payment_terms}`, 14, finalY + 35);

    if (invoice.notes) {
      doc.text(`Notes: ${invoice.notes}`, 14, finalY + 42);
    }

    // Refund Policy
    doc.setFontSize(7);
    doc.setTextColor(220, 38, 38);
    doc.text('Refund Policy: 7+ days before: full refund minus 10% admin fee | 3–6 days before: 50% refund | Less than 3 days: non-refundable | No-shows: non-refundable', pageWidth / 2, 272, { align: 'center', maxWidth: pageWidth - 28 });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Thank you for your business!', pageWidth / 2, 280, { align: 'center' });

    return doc.output('blob');
  },

  // Download PDF
  downloadPDF(invoice: InvoiceWithItems, documentType: 'invoice' | 'quotation' = 'invoice') {
    const blob = this.generatePDF(invoice, documentType);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoice_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Send invoice (or quotation) email
  async sendInvoiceEmail(
    invoice: InvoiceWithItems,
    documentType: 'invoice' | 'quotation' = 'invoice'
  ): Promise<{ success: boolean; error?: string }> {
    if (!invoice.customer_email) {
      return { success: false, error: 'No customer email provided' };
    }

    const extractFunctionError = async (error: any): Promise<string> => {
      if (error?.message && error.message !== 'Edge Function returned a non-2xx status code') {
        return error.message;
      }

      const response = error?.context;
      if (response instanceof Response) {
        try {
          const payload = await response.clone().json();
          if (payload?.error) return payload.error;
        } catch {
          try {
            const text = await response.clone().text();
            if (text) return text;
          } catch {
            // Ignore parse failures and fall through to generic message
          }
        }
      }

      return error?.message || 'Failed to send invoice email.';
    };

    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: documentType === 'quotation' ? undefined : invoice.id,
          email: invoice.customer_email,
          invoiceNumber: invoice.invoice_number,
          customerName: invoice.customer_name,
          totalAmount: invoice.total_amount,
          dueDate: invoice.due_date,
          items: invoice.items || [],
          subtotal: invoice.subtotal || invoice.amount,
          discountAmount: invoice.discount_amount || 0,
          taxAmount: invoice.tax_amount,
          notes: invoice.notes,
          paymentTerms: invoice.payment_terms,
          documentType,
        }
      });

      if (error) {
        return { success: false, error: await extractFunctionError(error) };
      }

      if (data?.success === false) {
        return { success: false, error: data.error || 'Failed to send invoice email.' };
      }

      if (data?.warnings?.length) {
        console.warn('Invoice email warnings:', data.warnings);
      }

      return { success: true };
    } catch (error: any) {
      const message = await extractFunctionError(error);
      console.error('Error sending invoice email:', error);
      return { success: false, error: message };
    }
  },

  // Create auto-invoice from registration
  async createFromRegistration(
    registrationData: {
      id: string;
      type: 'camp' | 'kenyan-experiences' | 'homeschooling' | 'team-building' | 'parties' | 'school-experience';
      parentName: string;
      email: string;
      programName: string;
      totalAmount: number;
      children?: Array<{ childName: string; price: number; selectedDates?: string[] }>;
    },
    createdBy?: string
  ): Promise<InvoiceWithItems> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    // Build line items from children or single item
    const items: Omit<InvoiceItem, 'id' | 'invoice_id'>[] = [];

    if (registrationData.children && registrationData.children.length > 0) {
      registrationData.children.forEach(child => {
        items.push({
          description: `${registrationData.programName} - ${child.childName}${child.selectedDates ? ` (${child.selectedDates.length} days)` : ''}`,
          quantity: 1,
          unit_price: child.price,
          discount_percent: 0,
          discount_amount: 0,
          line_total: child.price
        });
      });
    } else {
      items.push({
        description: registrationData.programName,
        quantity: 1,
        unit_price: registrationData.totalAmount,
        discount_percent: 0,
        discount_amount: 0,
        line_total: registrationData.totalAmount
      });
    }

    const totals = this.calculateInvoiceTotals(items, 0, 0);

    return this.createInvoiceWithItems(
      {
        customer_name: registrationData.parentName,
        customer_email: registrationData.email,
        program_name: registrationData.programName,
        ...totals,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'sent',
        payment_terms: 'Due on Receipt',
        registration_id: registrationData.id,
        registration_type: registrationData.type,
        created_by: createdBy
      },
      items
    );
  }
};
