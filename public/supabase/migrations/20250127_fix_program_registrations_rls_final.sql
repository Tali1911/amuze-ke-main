-- Final RLS fix - Explicitly grant anon role permissions for public form submissions

-- Drop ALL existing policies completely
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeschooling_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_experience_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_building_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties_registrations ENABLE ROW LEVEL SECURITY;

-- Grant table permissions to anon role
GRANT INSERT ON kenyan_experiences_registrations TO anon;
GRANT INSERT ON homeschooling_registrations TO anon;
GRANT INSERT ON school_experience_registrations TO anon;
GRANT INSERT ON team_building_registrations TO anon;
GRANT INSERT ON parties_registrations TO anon;

-- Grant USAGE on sequences to anon role
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create INSERT policies explicitly for anon role
CREATE POLICY "anon_can_insert_kenyan_experiences"
  ON kenyan_experiences_registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_can_insert_homeschooling"
  ON homeschooling_registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_can_insert_school_experience"
  ON school_experience_registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_can_insert_team_building"
  ON team_building_registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_can_insert_parties"
  ON parties_registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create SELECT policies for authenticated users
CREATE POLICY "authenticated_can_select_kenyan_experiences"
  ON kenyan_experiences_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_can_select_homeschooling"
  ON homeschooling_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_can_select_school_experience"
  ON school_experience_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_can_select_team_building"
  ON team_building_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_can_select_parties"
  ON parties_registrations
  FOR SELECT
  TO authenticated
  USING (true);

-- Create UPDATE policies for authenticated users
CREATE POLICY "authenticated_can_update_kenyan_experiences"
  ON kenyan_experiences_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_can_update_homeschooling"
  ON homeschooling_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_can_update_school_experience"
  ON school_experience_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_can_update_team_building"
  ON team_building_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_can_update_parties"
  ON parties_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify setup
DO $$ 
BEGIN
  RAISE NOTICE '✓ RLS policies configured for anonymous form submissions';
  RAISE NOTICE '✓ Table permissions granted to anon role';
  RAISE NOTICE '✓ Authenticated users can view and update registrations';
END $$;
