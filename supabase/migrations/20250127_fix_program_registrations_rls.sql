-- Fix RLS policies for public form submissions
-- Drop existing policies
DROP POLICY IF EXISTS "Allow public insert kenyan_experiences" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Allow public insert homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Allow public insert school_experience" ON school_experience_registrations;
DROP POLICY IF EXISTS "Allow public insert team_building" ON team_building_registrations;
DROP POLICY IF EXISTS "Allow public insert parties" ON parties_registrations;

-- Create simpler, more permissive INSERT policies for public forms
CREATE POLICY "Enable insert for all users - kenyan_experiences"
  ON kenyan_experiences_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable insert for all users - homeschooling"
  ON homeschooling_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable insert for all users - school_experience"
  ON school_experience_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable insert for all users - team_building"
  ON team_building_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable insert for all users - parties"
  ON parties_registrations
  FOR INSERT
  WITH CHECK (true);
