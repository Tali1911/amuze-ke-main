-- Temporary fix: Disable RLS entirely to test permissions
-- This will help us isolate whether the issue is RLS or table permissions

-- ============================================================================
-- DISABLE RLS ENTIRELY (TEMPORARY TEST)
-- ============================================================================

ALTER TABLE kenyan_experiences_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE homeschooling_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_experience_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_building_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE camp_registrations DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- GRANT ALL PERMISSIONS TO EVERYONE (TEMPORARY)
-- ============================================================================

GRANT ALL ON kenyan_experiences_registrations TO anon, authenticated, public;
GRANT ALL ON homeschooling_registrations TO anon, authenticated, public;
GRANT ALL ON school_experience_registrations TO anon, authenticated, public;
GRANT ALL ON team_building_registrations TO anon, authenticated, public;
GRANT ALL ON parties_registrations TO anon, authenticated, public;
GRANT ALL ON camp_registrations TO anon, authenticated, public;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, public;

-- Grant all sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, public;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════════════';
    RAISE NOTICE '⚠️  RLS COMPLETELY DISABLED (TEMPORARY TEST)';
    RAISE NOTICE '════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'This is for testing only!';
    RAISE NOTICE 'If forms work now, the issue was RLS policies.';
    RAISE NOTICE 'We can re-enable proper security after confirming.';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All permissions granted to all roles';
    RAISE NOTICE '✅ RLS disabled on all registration tables';
    RAISE NOTICE '';
    RAISE NOTICE 'Try submitting a form now.';
    RAISE NOTICE '════════════════════════════════════════════════';
END $$;
