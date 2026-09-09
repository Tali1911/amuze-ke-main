-- Fix RLS policies - use correct 'anon' role instead of 'public'
-- Drop all existing policies first
DROP POLICY IF EXISTS "public_insert_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "public_insert_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "public_insert_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "public_insert_team" ON team_building_registrations;
DROP POLICY IF EXISTS "public_insert_parties" ON parties_registrations;

DROP POLICY IF EXISTS "auth_all_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "auth_all_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "auth_all_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "auth_all_team" ON team_building_registrations;
DROP POLICY IF EXISTS "auth_all_parties" ON parties_registrations;

-- Create correct policies using 'anon' role (not 'public')
CREATE POLICY "anon_insert_kenyan" 
  ON kenyan_experiences_registrations 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

CREATE POLICY "anon_insert_homeschooling" 
  ON homeschooling_registrations 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

CREATE POLICY "anon_insert_school" 
  ON school_experience_registrations 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

CREATE POLICY "anon_insert_team" 
  ON team_building_registrations 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

CREATE POLICY "anon_insert_parties" 
  ON parties_registrations 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Authenticated users can do everything
CREATE POLICY "auth_all_kenyan" 
  ON kenyan_experiences_registrations 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "auth_all_homeschooling" 
  ON homeschooling_registrations 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "auth_all_school" 
  ON school_experience_registrations 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "auth_all_team" 
  ON team_building_registrations 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "auth_all_parties" 
  ON parties_registrations 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Verification
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Fixed: Using anon role (not public)';
  RAISE NOTICE '✓ Anonymous users can now INSERT';
  RAISE NOTICE '✓ Authenticated users have full access';
  RAISE NOTICE '========================================';
END $$;
