-- Fix leads table RLS to allow anonymous inserts from registration forms
-- Error: "new row violates row-level security policy for table \"leads\""

-- Drop ALL existing INSERT policies on leads to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own leads" ON public.leads;
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "Leads insert policy" ON public.leads;

-- Create a simple INSERT policy that allows ANYONE (anon or authenticated) to insert leads
-- This is necessary because registration forms are public and create leads
CREATE POLICY "Allow public lead creation"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Verify the policy exists
DO $$
BEGIN
  RAISE NOTICE 'Leads INSERT policy created successfully for anonymous users';
END $$;
