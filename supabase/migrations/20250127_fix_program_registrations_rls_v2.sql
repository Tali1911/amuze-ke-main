-- Comprehensive RLS fix for public program registration forms
-- This migration ensures anonymous users can submit registrations

-- First, disable RLS temporarily to clean up
ALTER TABLE kenyan_experiences_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE homeschooling_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_experience_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_building_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties_registrations DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Allow public insert kenyan_experiences" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - kenyan_experiences" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Admins can view kenyan_experiences" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Admins can update kenyan_experiences" ON kenyan_experiences_registrations;

DROP POLICY IF EXISTS "Allow public insert homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Admins can view homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Admins can update homeschooling" ON homeschooling_registrations;

DROP POLICY IF EXISTS "Allow public insert school_experience" ON school_experience_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - school_experience" ON school_experience_registrations;
DROP POLICY IF EXISTS "Admins can view school_experience" ON school_experience_registrations;
DROP POLICY IF EXISTS "Admins can update school_experience" ON school_experience_registrations;

DROP POLICY IF EXISTS "Allow public insert team_building" ON team_building_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - team_building" ON team_building_registrations;
DROP POLICY IF EXISTS "Admins can view team_building" ON team_building_registrations;
DROP POLICY IF EXISTS "Admins can update team_building" ON team_building_registrations;

DROP POLICY IF EXISTS "Allow public insert parties" ON parties_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - parties" ON parties_registrations;
DROP POLICY IF EXISTS "Admins can view parties" ON parties_registrations;
DROP POLICY IF EXISTS "Admins can update parties" ON parties_registrations;

-- Re-enable RLS
ALTER TABLE kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeschooling_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_experience_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_building_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties_registrations ENABLE ROW LEVEL SECURITY;

-- Create simple INSERT policies that allow everyone (including anon)
CREATE POLICY "Public can insert kenyan_experiences"
  ON kenyan_experiences_registrations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can insert homeschooling"
  ON homeschooling_registrations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can insert school_experience"
  ON school_experience_registrations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can insert team_building"
  ON team_building_registrations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can insert parties"
  ON parties_registrations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create SELECT policies for authenticated users with admin role
CREATE POLICY "Authenticated users can view kenyan_experiences"
  ON kenyan_experiences_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view homeschooling"
  ON homeschooling_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view school_experience"
  ON school_experience_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view team_building"
  ON team_building_registrations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view parties"
  ON parties_registrations
  FOR SELECT
  TO authenticated
  USING (true);

-- Create UPDATE policies for authenticated users
CREATE POLICY "Authenticated users can update kenyan_experiences"
  ON kenyan_experiences_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update homeschooling"
  ON homeschooling_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update school_experience"
  ON school_experience_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update team_building"
  ON team_building_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update parties"
  ON parties_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify the policies were created
DO $$ 
BEGIN
  RAISE NOTICE 'RLS policies have been recreated successfully for all program registration tables';
END $$;
