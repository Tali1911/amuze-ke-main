import { supabase } from '@/integrations/supabase/client';

export interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id?: string | null;
  payment_terms: string;
  category: string;
  status: 'active' | 'inactive';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  vendor_id: string | null;
  vendor?: Vendor;
  bill_number: string;
  bill_date: string;
  due_date: string;
  amount: number;
  amount_paid: number;
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  description: string | null;
  category: string | null;
  payment_method?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillPayment {
  id: string;
  bill_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes?: string | null;
  created_at: string;
}

class VendorBillService {
  private static instance: VendorBillService;

  private constructor() {}

  public static getInstance(): VendorBillService {
    if (!VendorBillService.instance) {
      VendorBillService.instance = new VendorBillService();
    }
    return VendorBillService.instance;
  }

  // Vendor Operations
  async getVendors(): Promise<Vendor[]> {
    const { data, error } = await supabase
      .from('vendors' as any)
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }

    return (data || []) as unknown as Vendor[];
  }

  async getVendorById(id: string): Promise<Vendor | undefined> {
    const { data, error } = await supabase
      .from('vendors' as any)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }

    return data as unknown as Vendor | undefined;
  }

  async createVendor(vendor: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>): Promise<Vendor> {
    const { data, error } = await supabase
      .from('vendors' as any)
      .insert(vendor as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }

    return data as unknown as Vendor;
  }

  async updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor | null> {
    const { id: _, created_at, updated_at, ...updateData } = updates as any;
    
    const { data, error } = await supabase
      .from('vendors' as any)
      .update(updateData as any)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }

    return data as unknown as Vendor | null;
  }

  async deleteVendor(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('vendors' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }

    return true;
  }

  // Bill Operations
  async getBills(): Promise<Bill[]> {
    const { data, error } = await supabase
      .from('bills' as any)
      .select(`
        *,
        vendor:vendors(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }

    return ((data || []) as any[]).map(bill => ({
      ...bill,
      amount: Number(bill.amount),
      amount_paid: Number(bill.amount_paid),
      vendor: bill.vendor as Vendor | undefined
    })) as Bill[];
  }

  async getBillById(id: string): Promise<Bill | undefined> {
    const { data, error } = await supabase
      .from('bills' as any)
      .select(`
        *,
        vendor:vendors(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching bill:', error);
      throw error;
    }

    if (!data) return undefined;

    const billData = data as any;
    return {
      ...billData,
      amount: Number(billData.amount),
      amount_paid: Number(billData.amount_paid),
      vendor: billData.vendor as Vendor | undefined
    } as Bill;
  }

  async getBillsByVendor(vendorId: string): Promise<Bill[]> {
    const { data, error } = await supabase
      .from('bills' as any)
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bills by vendor:', error);
      throw error;
    }

    return ((data || []) as any[]).map(bill => ({
      ...bill,
      amount: Number(bill.amount),
      amount_paid: Number(bill.amount_paid)
    })) as Bill[];
  }

  async createBill(bill: Omit<Bill, 'id' | 'bill_number' | 'created_at' | 'updated_at' | 'vendor'>): Promise<Bill> {
    const { data, error } = await supabase
      .from('bills' as any)
      .insert({
        vendor_id: bill.vendor_id,
        bill_date: bill.bill_date,
        due_date: bill.due_date,
        amount: bill.amount,
        amount_paid: bill.amount_paid || 0,
        status: bill.status,
        description: bill.description,
        category: bill.category,
        payment_method: bill.payment_method,
        notes: bill.notes
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating bill:', error);
      throw error;
    }

    const billData = data as any;
    return {
      ...billData,
      amount: Number(billData.amount),
      amount_paid: Number(billData.amount_paid)
    } as Bill;
  }

  async updateBill(id: string, updates: Partial<Bill>): Promise<Bill | null> {
    const { id: _, created_at, updated_at, vendor, bill_number, ...updateData } = updates as any;
    
    const { data, error } = await supabase
      .from('bills' as any)
      .update(updateData as any)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating bill:', error);
      throw error;
    }

    if (!data) return null;

    const billData = data as any;
    return {
      ...billData,
      amount: Number(billData.amount),
      amount_paid: Number(billData.amount_paid)
    } as Bill;
  }

  async deleteBill(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('bills' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }

    return true;
  }

  // Bill Payment Operations
  async recordBillPayment(payment: Omit<BillPayment, 'id' | 'created_at'>): Promise<BillPayment> {
    const { data, error } = await supabase
      .from('bill_payments' as any)
      .insert({
        bill_id: payment.bill_id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        reference: payment.reference,
        notes: payment.notes
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error recording payment:', error);
      throw error;
    }

    const paymentData = data as any;
    return {
      ...paymentData,
      amount: Number(paymentData.amount)
    } as BillPayment;
  }

  async getBillPayments(billId: string): Promise<BillPayment[]> {
    const { data, error } = await supabase
      .from('bill_payments' as any)
      .select('*')
      .eq('bill_id', billId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching bill payments:', error);
      throw error;
    }

    return ((data || []) as any[]).map(payment => ({
      ...payment,
      amount: Number(payment.amount)
    })) as BillPayment[];
  }

  // Summary and Analytics
  async getAccountsPayableSummary() {
    const bills = await this.getBills();
    const vendors = await this.getVendors();
    const today = new Date();
    
    const totalOutstanding = bills
      .filter(b => b.status !== 'paid' && b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.amount - b.amount_paid), 0);

    const overdueBills = bills.filter(b => {
      const dueDate = new Date(b.due_date);
      return b.status !== 'paid' && b.status !== 'cancelled' && dueDate < today;
    });

    const overdueAmount = overdueBills.reduce((sum, b) => sum + (b.amount - b.amount_paid), 0);

    const dueThisWeek = bills.filter(b => {
      const dueDate = new Date(b.due_date);
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return b.status !== 'paid' && b.status !== 'cancelled' && dueDate >= today && dueDate <= weekFromNow;
    });

    const dueThisWeekAmount = dueThisWeek.reduce((sum, b) => sum + (b.amount - b.amount_paid), 0);

    return {
      totalOutstanding,
      overdueCount: overdueBills.length,
      overdueAmount,
      dueThisWeekCount: dueThisWeek.length,
      dueThisWeekAmount,
      totalVendors: vendors.filter(v => v.status === 'active').length,
      pendingBills: bills.filter(b => b.status === 'pending' || b.status === 'partial').length
    };
  }
}

export const vendorBillService = VendorBillService.getInstance();
