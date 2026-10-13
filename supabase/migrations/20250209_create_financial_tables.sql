-- Financial Management Tables Migration
-- This migration creates invoices, payments, budgets, and expenses tables

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  program_name VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_terms VARCHAR(50) DEFAULT 'Net 30',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mpesa', 'other')),
  payment_reference VARCHAR(100),
  payment_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  allocated_amount DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  department VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'exceeded')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  vendor VARCHAR(255),
  approved_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_department ON public.expenses(department);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_budget ON public.expenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON public.budgets(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON public.invoices 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at 
  BEFORE UPDATE ON public.budgets 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at 
  BEFORE UPDATE ON public.expenses 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Invoice policies - Accounts, Admin, and CEO can manage
CREATE POLICY "Accounts team can view invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Accounts team can insert invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Accounts team can update invoices" ON public.invoices
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Accounts team can delete invoices" ON public.invoices
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- Payment policies
CREATE POLICY "Accounts team can view payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Accounts team can insert payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Accounts team can update payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Accounts team can delete payments" ON public.payments
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- Budget policies
CREATE POLICY "Accounts team can view budgets" ON public.budgets
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Accounts team can insert budgets" ON public.budgets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Accounts team can update budgets" ON public.budgets
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Accounts team can delete budgets" ON public.budgets
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- Expense policies - All authenticated users can create, accounts team can manage
CREATE POLICY "Authenticated users can view own expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid() OR
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Authenticated users can create expenses" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Accounts team can update expenses" ON public.expenses
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  )
  WITH CHECK (
    created_by = auth.uid() OR
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Accounts team can delete expenses" ON public.expenses
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- Helper function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  invoice_prefix TEXT := 'INV';
  year_suffix TEXT;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(NULLIF(REGEXP_REPLACE(invoice_number, '^INV-\d{4}-', ''), '') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || year_suffix || '-%';
  
  RETURN invoice_prefix || '-' || year_suffix || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$;
