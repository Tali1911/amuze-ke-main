-- Fix: Allow coach and marketing roles to insert action items
-- These roles perform check-ins from Daily Operations and need to create
-- pending collection items for unpaid attendees.

DROP POLICY IF EXISTS "Accounts can insert action items" ON public.accounts_action_items;

CREATE POLICY "Staff can insert action items" ON public.accounts_action_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'accounts'::app_role) OR
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role)
  );
