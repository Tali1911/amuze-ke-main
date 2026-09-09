-- Invoice Line Items Migration
-- Adds support for multiple line items per invoice with discounts

-- Invoice Line Items Table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add discount columns to invoices table
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS registration_id UUID,
  ADD COLUMN IF NOT EXISTS registration_type VARCHAR(50);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_registration ON public.invoices(registration_id);

-- RLS for invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accounts team can view invoice items" ON public.invoice_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i 
      WHERE i.id = invoice_id AND (
        public.has_role(auth.uid(), 'accounts'::app_role) OR 
        public.has_role(auth.uid(), 'admin'::app_role) OR 
        public.has_role(auth.uid(), 'ceo'::app_role)
      )
    )
  );

CREATE POLICY "Accounts team can insert invoice items" ON public.invoice_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Accounts team can update invoice items" ON public.invoice_items
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Accounts team can delete invoice items" ON public.invoice_items
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'accounts'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );
