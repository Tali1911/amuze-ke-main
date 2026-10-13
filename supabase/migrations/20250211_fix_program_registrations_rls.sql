-- Fix RLS policies for all program registration tables
-- Allow anonymous users to submit registrations while protecting read/update access

-- ============================================================================
-- KENYAN EXPERIENCES REGISTRATIONS
-- ============================================================================
DROP POLICY IF EXISTS "allow_anon_insert_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "allow_auth_all_kenyan" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Public can insert registrations" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Staff can view registrations" ON kenyan_experiences_registrations;
DROP POLICY IF EXISTS "Staff can update registrations" ON kenyan_experiences_registrations;

-- Allow anyone to insert (for public registration forms)
CREATE POLICY "Anyone can submit kenyan experiences registration"
  ON kenyan_experiences_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow marketing, admin, CEO to view
CREATE POLICY "Staff can view kenyan experiences registrations"
  ON kenyan_experiences_registrations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- Allow marketing, admin, CEO to update
CREATE POLICY "Staff can update kenyan experiences registrations"
  ON kenyan_experiences_registrations
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- ============================================================================
-- HOMESCHOOLING REGISTRATIONS
-- ============================================================================
DROP POLICY IF EXISTS "allow_anon_insert_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "allow_auth_all_homeschooling" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Public can insert registrations" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Staff can view registrations" ON homeschooling_registrations;
DROP POLICY IF EXISTS "Staff can update registrations" ON homeschooling_registrations;

CREATE POLICY "Anyone can submit homeschooling registration"
  ON homeschooling_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can view homeschooling registrations"
  ON homeschooling_registrations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Staff can update homeschooling registrations"
  ON homeschooling_registrations
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- ============================================================================
-- SCHOOL EXPERIENCE REGISTRATIONS
-- ============================================================================
DROP POLICY IF EXISTS "allow_anon_insert_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "allow_auth_all_school" ON school_experience_registrations;
DROP POLICY IF EXISTS "Public can insert registrations" ON school_experience_registrations;
DROP POLICY IF EXISTS "Staff can view registrations" ON school_experience_registrations;
DROP POLICY IF EXISTS "Staff can update registrations" ON school_experience_registrations;

CREATE POLICY "Anyone can submit school experience registration"
  ON school_experience_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can view school experience registrations"
  ON school_experience_registrations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Staff can update school experience registrations"
  ON school_experience_registrations
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- ============================================================================
-- TEAM BUILDING REGISTRATIONS
-- ============================================================================
DROP POLICY IF EXISTS "allow_anon_insert_team" ON team_building_registrations;
DROP POLICY IF EXISTS "allow_auth_all_team" ON team_building_registrations;
DROP POLICY IF EXISTS "Public can insert registrations" ON team_building_registrations;
DROP POLICY IF EXISTS "Staff can view registrations" ON team_building_registrations;
DROP POLICY IF EXISTS "Staff can update registrations" ON team_building_registrations;

CREATE POLICY "Anyone can submit team building registration"
  ON team_building_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can view team building registrations"
  ON team_building_registrations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Staff can update team building registrations"
  ON team_building_registrations
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- ============================================================================
-- PARTIES REGISTRATIONS
-- ============================================================================
DROP POLICY IF EXISTS "allow_anon_insert_parties" ON parties_registrations;
DROP POLICY IF EXISTS "allow_auth_all_parties" ON parties_registrations;
DROP POLICY IF EXISTS "Public can insert registrations" ON parties_registrations;
DROP POLICY IF EXISTS "Staff can view registrations" ON parties_registrations;
DROP POLICY IF EXISTS "Staff can update registrations" ON parties_registrations;

CREATE POLICY "Anyone can submit parties registration"
  ON parties_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can view parties registrations"
  ON parties_registrations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Staff can update parties registrations"
  ON parties_registrations
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- ============================================================================
-- CAMP REGISTRATIONS (Day Camps)
-- ============================================================================
-- Ensure camp_registrations also has proper RLS policies
DROP POLICY IF EXISTS "Anyone can register for camps" ON camp_registrations;
DROP POLICY IF EXISTS "Public can register" ON camp_registrations;
DROP POLICY IF EXISTS "Staff can view registrations" ON camp_registrations;
DROP POLICY IF EXISTS "Staff can manage registrations" ON camp_registrations;

CREATE POLICY "Anyone can submit camp registration"
  ON camp_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can view camp registrations"
  ON camp_registrations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
  );

CREATE POLICY "Staff can update camp registrations"
  ON camp_registrations
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
  );

-- Verify RLS is enabled on all tables
ALTER TABLE kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeschooling_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_experience_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_building_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_registrations ENABLE ROW LEVEL SECURITY;
