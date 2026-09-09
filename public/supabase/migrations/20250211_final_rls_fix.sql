-- FINAL FIX: Complete RLS reset with explicit role targeting
-- This addresses the root cause of RLS policy violations

-- ============================================================================
-- STEP 1: Completely disable RLS and drop all policies
-- ============================================================================

ALTER TABLE IF EXISTS kenyan_experiences_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS homeschooling_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_experience_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_building_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parties_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS camp_registrations DISABLE ROW LEVEL SECURITY;

-- Drop every possible policy that might exist
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename IN ('kenyan_experiences_registrations', 'homeschooling_registrations', 
                               'school_experience_registrations', 'team_building_registrations',
                               'parties_registrations', 'camp_registrations'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Grant explicit table permissions
-- ============================================================================

-- Revoke all first
REVOKE ALL ON kenyan_experiences_registrations FROM anon, authenticated, public;
REVOKE ALL ON homeschooling_registrations FROM anon, authenticated, public;
REVOKE ALL ON school_experience_registrations FROM anon, authenticated, public;
REVOKE ALL ON team_building_registrations FROM anon, authenticated, public;
REVOKE ALL ON parties_registrations FROM anon, authenticated, public;
REVOKE ALL ON camp_registrations FROM anon, authenticated, public;

-- Grant specific permissions
GRANT INSERT ON kenyan_experiences_registrations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON kenyan_experiences_registrations TO authenticated;

GRANT INSERT ON homeschooling_registrations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON homeschooling_registrations TO authenticated;

GRANT INSERT ON school_experience_registrations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON school_experience_registrations TO authenticated;

GRANT INSERT ON team_building_registrations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON team_building_registrations TO authenticated;

GRANT INSERT ON parties_registrations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON parties_registrations TO authenticated;

GRANT INSERT ON camp_registrations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON camp_registrations TO authenticated;

-- Grant sequence usage
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- STEP 3: Re-enable RLS with simplest possible policies
-- ============================================================================

ALTER TABLE kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeschooling_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_experience_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_building_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_registrations ENABLE ROW LEVEL SECURITY;

-- Kenyan Experiences - Ultra permissive policies
CREATE POLICY "kenyan_anon_insert" ON kenyan_experiences_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "kenyan_auth_select" ON kenyan_experiences_registrations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "kenyan_auth_update" ON kenyan_experiences_registrations
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Homeschooling - Ultra permissive policies
CREATE POLICY "homeschool_anon_insert" ON homeschooling_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "homeschool_auth_select" ON homeschooling_registrations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "homeschool_auth_update" ON homeschooling_registrations
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- School Experience - Ultra permissive policies
CREATE POLICY "school_anon_insert" ON school_experience_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "school_auth_select" ON school_experience_registrations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "school_auth_update" ON school_experience_registrations
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Team Building - Ultra permissive policies
CREATE POLICY "team_anon_insert" ON team_building_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "team_auth_select" ON team_building_registrations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "team_auth_update" ON team_building_registrations
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Parties - Ultra permissive policies
CREATE POLICY "parties_anon_insert" ON parties_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "parties_auth_select" ON parties_registrations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "parties_auth_update" ON parties_registrations
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Camp Registrations - Ultra permissive policies
CREATE POLICY "camps_anon_insert" ON camp_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "camps_auth_select" ON camp_registrations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "camps_auth_update" ON camp_registrations
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('kenyan_experiences_registrations', 'homeschooling_registrations', 
                     'school_experience_registrations', 'team_building_registrations',
                     'parties_registrations', 'camp_registrations');
    
    RAISE NOTICE '════════════════════════════════════════════════';
    RAISE NOTICE '✅ FINAL RLS FIX COMPLETED';
    RAISE NOTICE '════════════════════════════════════════════════';
    RAISE NOTICE 'Total RLS policies created: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Granted INSERT to anon and authenticated';
    RAISE NOTICE '✅ Granted SELECT, UPDATE to authenticated only';
    RAISE NOTICE '✅ All policies use WITH CHECK (true)';
    RAISE NOTICE '✅ No role-based checks that could fail';
    RAISE NOTICE '';
    RAISE NOTICE 'Registration forms should now work!';
    RAISE NOTICE '════════════════════════════════════════════════';
END $$;
