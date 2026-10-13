-- Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  category TEXT DEFAULT 'General',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  bill_number TEXT NOT NULL UNIQUE,
  bill_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled')),
  description TEXT,
  category TEXT,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bill_payments table
CREATE TABLE IF NOT EXISTS public.bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bills_vendor_id ON public.bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON public.bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_id ON public.bill_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors (authenticated users can manage)
CREATE POLICY "Authenticated users can view vendors"
  ON public.vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vendors"
  ON public.vendors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vendors"
  ON public.vendors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vendors"
  ON public.vendors FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for bills
CREATE POLICY "Authenticated users can view bills"
  ON public.bills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bills"
  ON public.bills FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bills"
  ON public.bills FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bills"
  ON public.bills FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for bill_payments
CREATE POLICY "Authenticated users can view bill payments"
  ON public.bill_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bill payments"
  ON public.bill_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bill payments"
  ON public.bill_payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bill payments"
  ON public.bill_payments FOR DELETE
  TO authenticated
  USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_vendors_updated_at ON public.vendors;
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bills_updated_at ON public.bills;
CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate bill number
CREATE OR REPLACE FUNCTION public.generate_bill_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  next_num INTEGER;
BEGIN
  year_str := to_char(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(bill_number FROM 'BILL-\d{4}-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM public.bills
  WHERE bill_number LIKE 'BILL-' || year_str || '-%';
  
  NEW.bill_number := 'BILL-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating bill numbers
DROP TRIGGER IF EXISTS generate_bill_number_trigger ON public.bills;
CREATE TRIGGER generate_bill_number_trigger
  BEFORE INSERT ON public.bills
  FOR EACH ROW
  WHEN (NEW.bill_number IS NULL OR NEW.bill_number = '')
  EXECUTE FUNCTION public.generate_bill_number();

-- Function to update bill status after payment
CREATE OR REPLACE FUNCTION public.update_bill_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  total_paid DECIMAL(12, 2);
  bill_amount DECIMAL(12, 2);
BEGIN
  -- Calculate total paid for this bill
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.bill_payments
  WHERE bill_id = NEW.bill_id;
  
  -- Get bill amount
  SELECT amount INTO bill_amount
  FROM public.bills
  WHERE id = NEW.bill_id;
  
  -- Update bill amount_paid and status
  UPDATE public.bills
  SET 
    amount_paid = total_paid,
    status = CASE
      WHEN total_paid >= bill_amount THEN 'paid'
      WHEN total_paid > 0 THEN 'partial'
      ELSE status
    END,
    payment_method = NEW.payment_method
  WHERE id = NEW.bill_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating bill after payment
DROP TRIGGER IF EXISTS update_bill_after_payment_trigger ON public.bill_payments;
CREATE TRIGGER update_bill_after_payment_trigger
  AFTER INSERT ON public.bill_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bill_after_payment();
