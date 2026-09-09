import { supabase, isSupabaseAvailable } from './supabaseService';

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  program_name?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_terms: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Payment {
  id: string;
  invoice_id?: string | null;
  registration_id?: string | null;
  registration_type?: 'camp' | 'program' | null;
  source?: 'pending_collections' | 'ground_registration' | 'invoice' | 'camp_registration' | 'manual';
  customer_name?: string | null;
  program_name?: string | null;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'mpesa' | 'cash_ground' | 'other';
  payment_reference?: string;
  payment_date: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  created_at: string;
  created_by?: string;
  // Joined data
  invoice?: Invoice;
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  period_start: string;
  period_end: string;
  department?: string;
  status: 'active' | 'completed' | 'exceeded';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  department?: string;
  expense_date: string;
  receipt_url?: string;
  vendor?: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  budget_id?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  // Joined data
  budget?: Budget;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalOutstanding: number;
  totalExpenses: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  activeBudgets: number;
  pendingExpenses: number;
}

// Type-safe wrapper for financial tables that may not exist in generated types yet
const getSupabaseClient = () => supabase as any;

export class FinancialService {
  private static instance: FinancialService;

  static getInstance(): FinancialService {
    if (!FinancialService.instance) {
      FinancialService.instance = new FinancialService();
    }
    return FinancialService.instance;
  }

  // ============ INVOICES ============

  async getInvoices(): Promise<Invoice[]> {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available');
      return [];
    }

    try {
      const { data, error } = await getSupabaseClient()
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }

      return (data || []) as Invoice[];
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    if (!isSupabaseAvailable()) return null;

    try {
      const { data, error } = await getSupabaseClient()
        .from('invoices')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching invoice:', error);
        return null;
      }

      return data as Invoice | null;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'invoice_number'>): Promise<Invoice> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    // Generate invoice number
    let invoiceNumber: string;
    try {
      const { data: numData } = await getSupabaseClient().rpc('generate_invoice_number');
      invoiceNumber = numData || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
    } catch {
      invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
    }

    const { data, error } = await getSupabaseClient()
      .from('invoices')
      .insert({ ...invoice, invoice_number: invoiceNumber })
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }

    return data as Invoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    const { data, error } = await getSupabaseClient()
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }

    return data as Invoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    const { error } = await getSupabaseClient()
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // ============ PAYMENTS ============

  async getPayments(): Promise<Payment[]> {
    if (!isSupabaseAvailable()) return [];

    try {
      const { data, error } = await getSupabaseClient()
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        return [];
      }

      return (data || []) as Payment[];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    if (!isSupabaseAvailable()) return [];

    try {
      const { data, error } = await getSupabaseClient()
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        return [];
      }

      return (data || []) as Payment[];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  async createPayment(payment: Omit<Payment, 'id' | 'created_at' | 'invoice'>): Promise<Payment> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    const { data, error } = await getSupabaseClient()
      .from('payments')
      .insert(payment)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      throw error;
    }

    // Update invoice status if fully paid (only if invoice_id exists)
    if (payment.status === 'completed' && payment.invoice_id) {
      await this.updateInvoicePaymentStatus(payment.invoice_id);
    }

    return data as Payment;
  }

  // Create payment from registration (camp or program)
  async createPaymentFromRegistration(data: {
    registrationId: string;
    registrationType: 'camp' | 'program';
    source: Payment['source'];
    customerName: string;
    programName: string;
    amount: number;
    paymentMethod: Payment['payment_method'];
    paymentReference?: string;
    notes?: string;
    createdBy?: string;
    invoiceId?: string; // Link to invoice if one exists
  }): Promise<Payment | null> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    // Check for existing payment to prevent duplicates
    const existing = await this.checkExistingRegistrationPayment(data.registrationId, data.source);
    if (existing) {
      console.log('Payment already exists for this registration and source');
      return existing;
    }

    const payment: Omit<Payment, 'id' | 'created_at' | 'invoice'> = {
      invoice_id: data.invoiceId || null,
      registration_id: data.registrationId,
      registration_type: data.registrationType,
      source: data.source,
      customer_name: data.customerName,
      program_name: data.programName,
      amount: data.amount,
      payment_method: data.paymentMethod,
      payment_reference: data.paymentReference,
      payment_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      notes: data.notes,
      created_by: data.createdBy
    };

    return this.createPayment(payment);
  }

  // Check if payment already exists for registration
  async checkExistingRegistrationPayment(registrationId: string, source?: string): Promise<Payment | null> {
    if (!isSupabaseAvailable()) return null;

    try {
      let query = getSupabaseClient()
        .from('payments')
        .select('*')
        .eq('registration_id', registrationId);

      if (source) {
        query = query.eq('source', source);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error checking existing payment:', error);
        return null;
      }

      return data as Payment | null;
    } catch (error) {
      console.error('Error checking existing payment:', error);
      return null;
    }
  }

  private async updateInvoicePaymentStatus(invoiceId: string): Promise<void> {
    if (!invoiceId) return;
    
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) return;

    const payments = await this.getPaymentsByInvoice(invoiceId);
    const totalPaid = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    if (totalPaid >= Number(invoice.total_amount)) {
      await this.updateInvoice(invoiceId, { status: 'paid' });
    }
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    const { data, error } = await getSupabaseClient()
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      throw error;
    }

    return data as Payment;
  }

  // ============ BUDGETS ============

  async getBudgets(): Promise<Budget[]> {
    if (!isSupabaseAvailable()) return [];

    try {
      const { data, error } = await getSupabaseClient()
        .from('budgets')
        .select('*')
        .order('period_start', { ascending: false });

      if (error) {
        console.error('Error fetching budgets:', error);
        return [];
      }

      return (data || []) as Budget[];
    } catch (error) {
      console.error('Error fetching budgets:', error);
      return [];
    }
  }

  async getActiveBudgets(): Promise<Budget[]> {
    if (!isSupabaseAvailable()) return [];

    const today = new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await getSupabaseClient()
        .from('budgets')
        .select('*')
        .eq('status', 'active')
        .lte('period_start', today)
        .gte('period_end', today)
        .order('period_start', { ascending: false });

      if (error) {
        console.error('Error fetching active budgets:', error);
        return [];
      }

      return (data || []) as Budget[];
    } catch (error) {
      console.error('Error fetching active budgets:', error);
      return [];
    }
  }

  async createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'spent_amount'>): Promise<Budget> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    const { data, error } = await getSupabaseClient()
      .from('budgets')
      .insert({ ...budget, spent_amount: 0 })
      .select()
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      throw error;
    }

    return data as Budget;
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    const { data, error } = await getSupabaseClient()
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating budget:', error);
      throw error;
    }

    return data as Budget;
  }

  async deleteBudget(id: string): Promise<void> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    const { error } = await getSupabaseClient()
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }

  // ============ EXPENSES ============

  async getExpenses(): Promise<Expense[]> {
    if (!isSupabaseAvailable()) return [];

    try {
      const { data, error } = await getSupabaseClient()
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        return [];
      }

      return (data || []) as Expense[];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }

  async getExpensesByBudget(budgetId: string): Promise<Expense[]> {
    if (!isSupabaseAvailable()) return [];

    try {
      const { data, error } = await getSupabaseClient()
        .from('expenses')
        .select('*')
        .eq('budget_id', budgetId)
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        return [];
      }

      return (data || []) as Expense[];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }

  async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'budget'>): Promise<Expense> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    const { data, error } = await getSupabaseClient()
      .from('expenses')
      .insert(expense)
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      throw error;
    }

    // Update budget spent amount if linked
    if (expense.budget_id && expense.status === 'approved') {
      await this.updateBudgetSpentAmount(expense.budget_id);
    }

    return data as Expense;
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    const { data, error } = await getSupabaseClient()
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      throw error;
    }

    return data as Expense;
  }

  async approveExpense(id: string, approvedBy: string): Promise<Expense> {
    const expense = await this.updateExpense(id, { 
      status: 'approved', 
      approved_by: approvedBy 
    });

    // Update budget spent amount if linked
    if (expense.budget_id) {
      await this.updateBudgetSpentAmount(expense.budget_id);
    }

    return expense;
  }

  async rejectExpense(id: string, approvedBy: string): Promise<Expense> {
    return this.updateExpense(id, { 
      status: 'rejected', 
      approved_by: approvedBy 
    });
  }

  private async updateBudgetSpentAmount(budgetId: string): Promise<void> {
    const expenses = await this.getExpensesByBudget(budgetId);
    const totalSpent = expenses
      .filter(e => e.status === 'approved' || e.status === 'paid')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const { data: budget } = await getSupabaseClient()
      .from('budgets')
      .select('allocated_amount')
      .eq('id', budgetId)
      .single();

    if (budget) {
      const status = totalSpent > Number(budget.allocated_amount) ? 'exceeded' : 'active';
      await this.updateBudget(budgetId, { spent_amount: totalSpent, status });
    }
  }

  async deleteExpense(id: string): Promise<void> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    const { error } = await getSupabaseClient()
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // ============ SUMMARY & ANALYTICS ============

  async getFinancialSummary(): Promise<FinancialSummary> {
    if (!isSupabaseAvailable()) {
      return {
        totalRevenue: 0,
        totalOutstanding: 0,
        totalExpenses: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        activeBudgets: 0,
        pendingExpenses: 0
      };
    }

    try {
      const [invoices, expenses, budgets] = await Promise.all([
        this.getInvoices(),
        this.getExpenses(),
        this.getBudgets()
      ]);

      const paidInvoices = invoices.filter(i => i.status === 'paid');
      const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'draft');
      const overdueInvoices = invoices.filter(i => i.status === 'overdue');

      const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0);
      const totalOutstanding = [...pendingInvoices, ...overdueInvoices].reduce(
        (sum, i) => sum + Number(i.total_amount), 0
      );
      const totalExpenses = expenses
        .filter(e => e.status === 'approved' || e.status === 'paid')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const activeBudgets = budgets.filter(b => b.status === 'active').length;
      const pendingExpenses = expenses.filter(e => e.status === 'pending').length;

      return {
        totalRevenue,
        totalOutstanding,
        totalExpenses,
        paidInvoices: paidInvoices.length,
        pendingInvoices: pendingInvoices.length,
        overdueInvoices: overdueInvoices.length,
        activeBudgets,
        pendingExpenses
      };
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      return {
        totalRevenue: 0,
        totalOutstanding: 0,
        totalExpenses: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        activeBudgets: 0,
        pendingExpenses: 0
      };
    }
  }
}

export const financialService = FinancialService.getInstance();
