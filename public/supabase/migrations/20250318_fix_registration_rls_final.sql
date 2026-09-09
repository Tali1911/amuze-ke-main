-- =============================================================================
-- FIX: Allow anonymous users to submit registration forms
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================================================

-- Step 1: Disable RLS temporarily to modify policies
ALTER TABLE kenyan_experiences_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE homeschooling_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_experience_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_building_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE camp_registrations DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on these tables
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'kenyan_experiences_registrations',
            'homeschooling_registrations', 
            'school_experience_registrations',
            'team_building_registrations',
            'parties_registrations',
            'camp_registrations'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Step 3: Grant table-level permissions
GRANT INSERT ON kenyan_experiences_registrations TO anon;
GRANT INSERT ON homeschooling_registrations TO anon;
GRANT INSERT ON school_experience_registrations TO anon;
GRANT INSERT ON team_building_registrations TO anon;
GRANT INSERT ON parties_registrations TO anon;
GRANT INSERT ON camp_registrations TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON kenyan_experiences_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON homeschooling_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON school_experience_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_building_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON parties_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON camp_registrations TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Step 4: Re-enable RLS
ALTER TABLE kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeschooling_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_experience_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_building_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_registrations ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, permissive policies

-- kenyan_experiences_registrations
CREATE POLICY "anon_insert_kenyan" ON kenyan_experiences_registrations
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "auth_select_kenyan" ON kenyan_experiences_registrations
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_kenyan" ON kenyan_experiences_registrations
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_kenyan" ON kenyan_experiences_registrations
    FOR DELETE TO authenticated USING (true);

-- homeschooling_registrations
CREATE POLICY "anon_insert_homeschool" ON homeschooling_registrations
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "auth_select_homeschool" ON homeschooling_registrations
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_homeschool" ON homeschooling_registrations
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_homeschool" ON homeschooling_registrations
    FOR DELETE TO authenticated USING (true);

-- school_experience_registrations
CREATE POLICY "anon_insert_school" ON school_experience_registrations
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "auth_select_school" ON school_experience_registrations
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_school" ON school_experience_registrations
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_school" ON school_experience_registrations
    FOR DELETE TO authenticated USING (true);

-- team_building_registrations
CREATE POLICY "anon_insert_team" ON team_building_registrations
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "auth_select_team" ON team_building_registrations
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_team" ON team_building_registrations
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_team" ON team_building_registrations
    FOR DELETE TO authenticated USING (true);

-- parties_registrations
CREATE POLICY "anon_insert_parties" ON parties_registrations
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "auth_select_parties" ON parties_registrations
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_parties" ON parties_registrations
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_parties" ON parties_registrations
    FOR DELETE TO authenticated USING (true);

-- camp_registrations
CREATE POLICY "anon_insert_camp" ON camp_registrations
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "auth_select_camp" ON camp_registrations
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_camp" ON camp_registrations
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_camp" ON camp_registrations
    FOR DELETE TO authenticated USING (true);

-- Verification
DO $$
DECLARE
    cnt integer;
BEGIN
    SELECT COUNT(*) INTO cnt FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN (
        'kenyan_experiences_registrations',
        'homeschooling_registrations',
        'school_experience_registrations',
        'team_building_registrations',
        'parties_registrations',
        'camp_registrations'
    );
    RAISE NOTICE '✅ Created % RLS policies for registration tables', cnt;
    RAISE NOTICE '✅ Anonymous users can now INSERT into all registration tables';
    RAISE NOTICE '✅ Authenticated users have full access to all registration tables';
END $$;
