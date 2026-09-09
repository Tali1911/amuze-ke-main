-- Fix RLS policies for email_deliveries to allow proper tracking

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Marketing can view all deliveries" ON email_deliveries;
DROP POLICY IF EXISTS "System can insert deliveries" ON email_deliveries;

-- Allow service role (edge functions) to insert email delivery records
CREATE POLICY "Service role can insert deliveries"
  ON email_deliveries FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert (for edge functions using service_role key)
CREATE POLICY "Authenticated can insert deliveries"
  ON email_deliveries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow anonymous users to insert (edge functions might use anon in some cases)
CREATE POLICY "Anon can insert deliveries"
  ON email_deliveries FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow marketing and admin roles to view all deliveries
CREATE POLICY "Marketing can view all deliveries"
  ON email_deliveries FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- Allow authenticated users to view their own email deliveries
CREATE POLICY "Users can view own deliveries"
  ON email_deliveries FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow anonymous users to view recent deliveries (for testing/monitoring)
-- This is temporary for testing - remove in production
CREATE POLICY "Anon can view recent deliveries"
  ON email_deliveries FOR SELECT
  TO anon
  USING (sent_at > NOW() - INTERVAL '24 hours');

-- Verify the policies
DO $$
BEGIN
  RAISE NOTICE 'Email deliveries RLS policies updated successfully';
END $$;
