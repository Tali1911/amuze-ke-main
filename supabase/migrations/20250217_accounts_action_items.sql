-- Create accounts_action_items table for tracking pending collections
CREATE TABLE IF NOT EXISTS public.accounts_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.camp_registrations(id) ON DELETE CASCADE,
  registration_type TEXT NOT NULL DEFAULT 'camp', -- 'camp', 'kenyan_experiences', etc.
  child_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('invoice_needed', 'receipt_needed', 'payment_followup')),
  amount_due NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  camp_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accounts_action_items_status ON public.accounts_action_items(status);
CREATE INDEX IF NOT EXISTS idx_accounts_action_items_registration ON public.accounts_action_items(registration_id);
CREATE INDEX IF NOT EXISTS idx_accounts_action_items_created ON public.accounts_action_items(created_at DESC);

-- Enable RLS
ALTER TABLE public.accounts_action_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies - accounts, admin, ceo can manage action items
CREATE POLICY "Accounts can view action items" ON public.accounts_action_items
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'accounts') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Accounts can insert action items" ON public.accounts_action_items
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'accounts') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Accounts can update action items" ON public.accounts_action_items
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'accounts') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_accounts_action_items_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_accounts_action_items_timestamp
  BEFORE UPDATE ON public.accounts_action_items
  FOR EACH ROW EXECUTE FUNCTION update_accounts_action_items_timestamp();
