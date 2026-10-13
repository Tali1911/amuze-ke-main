-- Fix RLS policies for registration tables to allow anonymous submissions

-- ==========================================
-- HOMESCHOOLING REGISTRATIONS
-- ==========================================

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_anon_insert_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Allow public insert homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "anon_can_insert_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Public can insert homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "anon_insert_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "public_insert_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "allow_auth_all_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Admins can view all homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Admins can update homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "authenticated_can_select_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "authenticated_can_update_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Authenticated users can view homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Authenticated users can update homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "auth_all_homeschooling" ON homeschooling_registrations;

-- Enable RLS
ALTER TABLE homeschooling_registrations ENABLE ROW LEVEL SECURITY;

-- Create simple policies
-- Allow anyone (including anonymous) to insert
CREATE POLICY "Anyone can insert homeschooling registrations"
  ON homeschooling_registrations
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view and manage all
CREATE POLICY "Authenticated users can manage homeschooling registrations"
  ON homeschooling_registrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- CAMP REGISTRATIONS
-- ==========================================

-- Drop all existing policies for camp_registrations
DROP POLICY IF EXISTS "Anyone can insert camp registrations" ON camp_registrations;
DROP POLICY IF EXISTS "Authenticated users can manage camp registrations" ON camp_registrations;
DROP POLICY IF EXISTS "anon_insert_camps" ON camp_registrations;
DROP POLICY IF EXISTS "public_insert_camps" ON camp_registrations;
DROP POLICY IF EXISTS "auth_all_camps" ON camp_registrations;

-- Enable RLS
ALTER TABLE camp_registrations ENABLE ROW LEVEL SECURITY;

-- Create simple policies
-- Allow anyone (including anonymous) to insert
CREATE POLICY "Anyone can insert camp registrations"
  ON camp_registrations
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view and manage all
CREATE POLICY "Authenticated users can manage camp registrations"
  ON camp_registrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- OTHER PROGRAM REGISTRATIONS
-- ==========================================

-- KENYAN EXPERIENCES
DROP POLICY IF EXISTS "allow_anon_insert_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Allow public insert kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "anon_can_insert_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Public can insert kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "anon_insert_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "public_insert_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "allow_auth_all_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "authenticated_can_select_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "authenticated_can_update_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "auth_all_kenyan" ON kenyan_experiences_registrations;

ALTER TABLE kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert kenyan registrations"
  ON kenyan_experiences_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage kenyan registrations"
  ON kenyan_experiences_registrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- SCHOOL EXPERIENCE
DROP POLICY IF EXISTS "allow_anon_insert_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "Allow public insert school" ON school_experience_registrations;
DROP POLICY IF EXISTS "Enable insert for all users - school" ON school_experience_registrations;
DROP POLICY IF EXISTS "anon_can_insert_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "Public can insert school" ON school_experience_registrations;
DROP POLICY IF EXISTS "anon_insert_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "public_insert_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "allow_auth_all_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "authenticated_can_select_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "authenticated_can_update_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "auth_all_school" ON school_experience_registrations;

ALTER TABLE school_experience_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert school registrations"
  ON school_experience_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage school registrations"
  ON school_experience_registrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- TEAM BUILDING
DROP POLICY IF EXISTS "allow_anon_insert_team" ON team_building_registrations;
DROP POLICY IF EXISTS "Allow public insert team" ON team_building_registrations;
DROP POLICY IF EXISTS "anon_can_insert_team" ON team_building_registrations;
DROP POLICY IF EXISTS "Public can insert team" ON team_building_registrations;
DROP POLICY IF EXISTS "anon_insert_team" ON team_building_registrations;
DROP POLICY IF EXISTS "public_insert_team" ON team_building_registrations;
DROP POLICY IF EXISTS "allow_auth_all_team" ON team_building_registrations;
DROP POLICY IF EXISTS "authenticated_can_select_team" ON team_building_registrations;
DROP POLICY IF EXISTS "authenticated_can_update_team" ON team_building_registrations;
DROP POLICY IF EXISTS "auth_all_team" ON team_building_registrations;

ALTER TABLE team_building_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert team building registrations"
  ON team_building_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage team building registrations"
  ON team_building_registrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PARTIES
DROP POLICY IF EXISTS "allow_anon_insert_parties" ON parties_registrations;
DROP POLICY IF EXISTS "Allow public insert parties" ON parties_registrations;
DROP POLICY IF EXISTS "anon_can_insert_parties" ON parties_registrations;
DROP POLICY IF EXISTS "Public can insert parties" ON parties_registrations;
DROP POLICY IF EXISTS "anon_insert_parties" ON parties_registrations;
DROP POLICY IF EXISTS "public_insert_parties" ON parties_registrations;
DROP POLICY IF EXISTS "allow_auth_all_parties" ON parties_registrations;
DROP POLICY IF EXISTS "authenticated_can_select_parties" ON parties_registrations;
DROP POLICY IF EXISTS "authenticated_can_update_parties" ON parties_registrations;
DROP POLICY IF EXISTS "auth_all_parties" ON parties_registrations;

ALTER TABLE parties_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert party registrations"
  ON parties_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage party registrations"
  ON parties_registrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
