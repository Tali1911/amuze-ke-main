-- Diagnostic and Fix Script for Program Registration RLS Issues
-- This script will verify tables exist and set up simple, working RLS policies

-- ============================================================================
-- VERIFY TABLES EXIST
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kenyan_experiences_registrations') THEN
    RAISE NOTICE 'WARNING: kenyan_experiences_registrations table does not exist!';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'homeschooling_registrations') THEN
    RAISE NOTICE 'WARNING: homeschooling_registrations table does not exist!';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'school_experience_registrations') THEN
    RAISE NOTICE 'WARNING: school_experience_registrations table does not exist!';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_building_registrations') THEN
    RAISE NOTICE 'WARNING: team_building_registrations table does not exist!';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'parties_registrations') THEN
    RAISE NOTICE 'WARNING: parties_registrations table does not exist!';
  END IF;
END $$;

-- ============================================================================
-- DISABLE RLS TEMPORARILY TO CLEAN UP
-- ============================================================================
ALTER TABLE IF EXISTS kenyan_experiences_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS homeschooling_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_experience_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_building_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parties_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS camp_registrations DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP ALL EXISTING POLICIES
-- ============================================================================
-- Kenyan Experiences
DROP POLICY IF EXISTS "Anyone can submit kenyan experiences registration" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Staff can view kenyan experiences registrations" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Staff can update kenyan experiences registrations" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "allow_anon_insert_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "allow_auth_all_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Public can insert registrations" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - kenyan_experiences" ON kenyan_experiences_registrations;

-- Homeschooling
DROP POLICY IF EXISTS "Anyone can submit homeschooling registration" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Staff can view homeschooling registrations" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Staff can update homeschooling registrations" ON homeschooling_registrations;
DROP POLICY IF EXISTS "allow_anon_insert_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "allow_auth_all_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - homeschooling" ON homeschooling_registrations;

-- School Experience
DROP POLICY IF EXISTS "Anyone can submit school experience registration" ON school_experience_registrations;
DROP POLICY IF EXISTS "Staff can view school experience registrations" ON school_experience_registrations;
DROP POLICY IF EXISTS "Staff can update school experience registrations" ON school_experience_registrations;
DROP POLICY IF EXISTS "allow_anon_insert_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "allow_auth_all_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - school_experience" ON school_experience_registrations;

-- Team Building
DROP POLICY IF EXISTS "Anyone can submit team building registration" ON team_building_registrations;
DROP POLICY IF EXISTS "Staff can view team building registrations" ON team_building_registrations;
DROP POLICY IF EXISTS "Staff can update team building registrations" ON team_building_registrations;
DROP POLICY IF EXISTS "allow_anon_insert_team" ON team_building_registrations;
DROP POLICY IF EXISTS "allow_auth_all_team" ON team_building_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - team_building" ON team_building_registrations;

-- Parties
DROP POLICY IF EXISTS "Anyone can submit parties registration" ON parties_registrations;
DROP POLICY IF EXISTS "Staff can view parties registrations" ON parties_registrations;
DROP POLICY IF EXISTS "Staff can update parties registrations" ON parties_registrations;
DROP POLICY IF EXISTS "allow_anon_insert_parties" ON parties_registrations;
DROP POLICY IF EXISTS "allow_auth_all_parties" ON parties_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - parties" ON parties_registrations;

-- Camp Registrations
DROP POLICY IF EXISTS "Anyone can submit camp registration" ON camp_registrations;
DROP POLICY IF EXISTS "Staff can view camp registrations" ON camp_registrations;
DROP POLICY IF EXISTS "Staff can update camp registrations" ON camp_registrations;
DROP POLICY IF EXISTS "Anyone can register for camps" ON camp_registrations;
DROP POLICY IF EXISTS "Public can register" ON camp_registrations;

-- ============================================================================
-- RE-ENABLE RLS
-- ============================================================================
ALTER TABLE IF EXISTS kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS homeschooling_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_experience_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_building_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parties_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS camp_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE SIMPLE INSERT POLICIES (NO ROLE CHECKING)
-- ============================================================================

-- Kenyan Experiences
CREATE POLICY "public_insert_kenyan"
  ON kenyan_experiences_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "auth_select_kenyan"
  ON kenyan_experiences_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_update_kenyan"
  ON kenyan_experiences_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Homeschooling
CREATE POLICY "public_insert_homeschooling"
  ON homeschooling_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "auth_select_homeschooling"
  ON homeschooling_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_update_homeschooling"
  ON homeschooling_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- School Experience
CREATE POLICY "public_insert_school"
  ON school_experience_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "auth_select_school"
  ON school_experience_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_update_school"
  ON school_experience_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Team Building
CREATE POLICY "public_insert_team"
  ON team_building_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "auth_select_team"
  ON team_building_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_update_team"
  ON team_building_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Parties
CREATE POLICY "public_insert_parties"
  ON parties_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "auth_select_parties"
  ON parties_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_update_parties"
  ON parties_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Camp Registrations
CREATE POLICY "public_insert_camps"
  ON camp_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "auth_select_camps"
  ON camp_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_update_camps"
  ON camp_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies have been reset with simple, permissive rules';
  RAISE NOTICE '✅ All users can now INSERT into registration tables';
  RAISE NOTICE '✅ Authenticated users can SELECT and UPDATE';
  RAISE NOTICE '';
  RAISE NOTICE 'If you still get errors, the tables may not exist.';
  RAISE NOTICE 'Check the warnings at the top of this output.';
END $$;
