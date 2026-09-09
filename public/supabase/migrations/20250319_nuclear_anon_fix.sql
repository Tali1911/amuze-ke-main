-- NUCLEAR FIX: Grant anon INSERT access to all registration tables
-- Run this in Supabase SQL Editor

-- Step 1: Grant INSERT privilege to anon role explicitly
GRANT INSERT ON public.kenyan_experiences_registrations TO anon;
GRANT INSERT ON public.homeschooling_registrations TO anon;
GRANT INSERT ON public.school_experience_registrations TO anon;
GRANT INSERT ON public.team_building_registrations TO anon;
GRANT INSERT ON public.parties_registrations TO anon;

-- Step 2: Grant sequence usage (needed for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Step 3: Drop any existing anon insert policies and recreate them
DROP POLICY IF EXISTS "anon_insert_kenyan" ON public.kenyan_experiences_registrations;
DROP POLICY IF EXISTS "anon_insert_homeschooling" ON public.homeschooling_registrations;
DROP POLICY IF EXISTS "anon_insert_school" ON public.school_experience_registrations;
DROP POLICY IF EXISTS "anon_insert_team" ON public.team_building_registrations;
DROP POLICY IF EXISTS "anon_insert_parties" ON public.parties_registrations;

DROP POLICY IF EXISTS "anon_can_insert_kenyan_experiences" ON public.kenyan_experiences_registrations;
DROP POLICY IF EXISTS "anon_can_insert_homeschooling" ON public.homeschooling_registrations;
DROP POLICY IF EXISTS "anon_can_insert_school_experience" ON public.school_experience_registrations;
DROP POLICY IF EXISTS "anon_can_insert_team_building" ON public.team_building_registrations;
DROP POLICY IF EXISTS "anon_can_insert_parties" ON public.parties_registrations;

-- Step 4: Create INSERT policies for BOTH anon and authenticated roles
CREATE POLICY "public_insert_kenyan"
  ON public.kenyan_experiences_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "public_insert_homeschooling"
  ON public.homeschooling_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "public_insert_school"
  ON public.school_experience_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "public_insert_team"
  ON public.team_building_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "public_insert_parties"
  ON public.parties_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Verify the grants worked
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'kenyan_experiences_registrations'
ORDER BY grantee, privilege_type;
