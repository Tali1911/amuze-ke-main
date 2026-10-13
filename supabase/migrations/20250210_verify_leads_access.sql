-- Verify leads table and RLS policies
-- This migration checks and fixes any issues with leads visibility

-- First, let's ensure the leads table has RLS enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies to avoid duplicates
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "Marketing can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Marketing can manage leads" ON public.leads;

-- Recreate clean RLS policies for leads
-- Policy 1: Anyone (even anonymous) can insert leads (for registration forms)
CREATE POLICY "Public can insert leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Marketing, Admin, and CEO can view all leads
CREATE POLICY "Marketing can view leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- Policy 3: Marketing, Admin, and CEO can update/delete leads
CREATE POLICY "Marketing can manage leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Marketing can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- Verify: Check if any leads exist
-- Run this query after migration to see results:
-- SELECT COUNT(*) as lead_count FROM public.leads;

-- Verify: Check if current user can see leads
-- SELECT * FROM public.leads LIMIT 10;
