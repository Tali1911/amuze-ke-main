-- Definitive fix for kenyan_experiences_registrations RLS
-- Goal: allow anonymous (anon) INSERT with NO authentication.

BEGIN;

-- Ensure privileges
GRANT INSERT ON public.kenyan_experiences_registrations TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Drop *all* policies on this table (including restrictive ones)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename='kenyan_experiences_registrations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Make sure RLS is on
ALTER TABLE public.kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;

-- Create minimal policies
CREATE POLICY "public_insert_kenyan_experiences"
  ON public.kenyan_experiences_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Optional: keep reads restricted (safe default)
CREATE POLICY "auth_select_kenyan_experiences"
  ON public.kenyan_experiences_registrations
  FOR SELECT
  TO authenticated
  USING (true);

COMMIT;

-- Verification: should show ONLY the two policies above
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename='kenyan_experiences_registrations'
ORDER BY policyname;
