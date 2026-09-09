-- COMPLETE RLS RESET - Ultimate fix for registration form submissions
-- This migration completely resets all RLS policies and permissions

-- Step 1: Drop all existing policies (comprehensive approach)
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN (
            'kenyan_experiences_registrations',
            'homeschooling_registrations', 
            'school_experience_registrations',
            'team_building_registrations',
            'parties_registrations'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Step 2: Temporarily disable RLS to clear any conflicts
ALTER TABLE kenyan_experiences_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE homeschooling_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_experience_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_building_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties_registrations DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant all necessary permissions to anon and authenticated roles
GRANT ALL ON kenyan_experiences_registrations TO anon, authenticated;
GRANT ALL ON homeschooling_registrations TO anon, authenticated;
GRANT ALL ON school_experience_registrations TO anon, authenticated;
GRANT ALL ON team_building_registrations TO anon, authenticated;
GRANT ALL ON parties_registrations TO anon, authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Step 4: Re-enable RLS
ALTER TABLE kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeschooling_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_experience_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_building_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties_registrations ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, permissive policies for INSERT (public forms)
CREATE POLICY "allow_anon_insert_kenyan" ON kenyan_experiences_registrations
    FOR INSERT TO anon, public WITH CHECK (true);

CREATE POLICY "allow_anon_insert_homeschooling" ON homeschooling_registrations
    FOR INSERT TO anon, public WITH CHECK (true);

CREATE POLICY "allow_anon_insert_school" ON school_experience_registrations
    FOR INSERT TO anon, public WITH CHECK (true);

CREATE POLICY "allow_anon_insert_team" ON team_building_registrations
    FOR INSERT TO anon, public WITH CHECK (true);

CREATE POLICY "allow_anon_insert_parties" ON parties_registrations
    FOR INSERT TO anon, public WITH CHECK (true);

-- Step 6: Create policies for authenticated users to view/manage
CREATE POLICY "allow_auth_all_kenyan" ON kenyan_experiences_registrations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_auth_all_homeschooling" ON homeschooling_registrations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_auth_all_school" ON school_experience_registrations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_auth_all_team" ON team_building_registrations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_auth_all_parties" ON parties_registrations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verification
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ All existing RLS policies removed';
  RAISE NOTICE '✓ Full permissions granted to anon and authenticated roles';
  RAISE NOTICE '✓ RLS re-enabled with permissive policies';
  RAISE NOTICE '✓ Public form submissions should now work';
  RAISE NOTICE '========================================';
END $$;
