-- Grant explicit permissions to anon role for all registration tables
-- This is required in addition to RLS policies

-- ============================================================================
-- GRANT TABLE-LEVEL PERMISSIONS TO ANON ROLE
-- ============================================================================

-- Grant INSERT permission to anon (public users) for all registration tables
GRANT INSERT ON kenyan_experiences_registrations TO anon;
GRANT INSERT ON homeschooling_registrations TO anon;
GRANT INSERT ON school_experience_registrations TO anon;
GRANT INSERT ON team_building_registrations TO anon;
GRANT INSERT ON parties_registrations TO anon;
GRANT INSERT ON camp_registrations TO anon;

-- Grant SELECT permission to anon for sequence (needed for id generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant ALL permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON kenyan_experiences_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON homeschooling_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON school_experience_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON team_building_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON parties_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON camp_registrations TO authenticated;

-- ============================================================================
-- VERIFY PERMISSIONS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Granted INSERT permissions to anon role';
  RAISE NOTICE '✅ Granted SELECT, INSERT, UPDATE to authenticated role';
  RAISE NOTICE '✅ Granted USAGE on sequences to anon';
  RAISE NOTICE '';
  RAISE NOTICE 'Registration forms should now work for anonymous users!';
END $$;
