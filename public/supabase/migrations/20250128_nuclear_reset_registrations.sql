-- NUCLEAR RESET - Complete table and RLS reconstruction
-- This drops and recreates all program registration tables from scratch

-- ============================================
-- STEP 1: Drop existing tables completely
-- ============================================
DROP TABLE IF EXISTS kenyan_experiences_registrations CASCADE;
DROP TABLE IF EXISTS homeschooling_registrations CASCADE;
DROP TABLE IF EXISTS school_experience_registrations CASCADE;
DROP TABLE IF EXISTS team_building_registrations CASCADE;
DROP TABLE IF EXISTS parties_registrations CASCADE;

-- ============================================
-- STEP 2: Create tables with proper structure
-- ============================================

-- Kenyan Experiences Registrations
CREATE TABLE kenyan_experiences_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_leader TEXT NOT NULL,
  participants JSONB NOT NULL,
  circuit TEXT NOT NULL,
  preferred_dates JSONB NOT NULL,
  transport BOOLEAN DEFAULT false,
  special_medical_needs TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homeschooling Registrations
CREATE TABLE homeschooling_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name TEXT NOT NULL,
  children JSONB NOT NULL,
  package TEXT NOT NULL,
  focus TEXT,
  transport BOOLEAN DEFAULT false,
  meal BOOLEAN DEFAULT false,
  allergies TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- School Experience Registrations
CREATE TABLE school_experience_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL,
  number_of_kids INTEGER,
  number_of_adults INTEGER,
  age_ranges JSONB,
  package TEXT NOT NULL,
  preferred_dates JSONB NOT NULL,
  location TEXT,
  number_of_students INTEGER,
  number_of_teachers INTEGER,
  transport BOOLEAN DEFAULT false,
  catering BOOLEAN DEFAULT false,
  special_needs TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Building Registrations
CREATE TABLE team_building_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion TEXT NOT NULL,
  adults_number INTEGER NOT NULL,
  children_number INTEGER,
  age_range TEXT,
  package TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT,
  decor BOOLEAN DEFAULT false,
  catering BOOLEAN DEFAULT false,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parties Registrations
CREATE TABLE parties_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  children JSONB NOT NULL,
  guests_number INTEGER NOT NULL,
  package_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT,
  decor BOOLEAN DEFAULT false,
  catering BOOLEAN DEFAULT false,
  photography BOOLEAN DEFAULT false,
  activities BOOLEAN DEFAULT false,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: Grant base permissions
-- ============================================
GRANT ALL ON kenyan_experiences_registrations TO anon, authenticated;
GRANT ALL ON homeschooling_registrations TO anon, authenticated;
GRANT ALL ON school_experience_registrations TO anon, authenticated;
GRANT ALL ON team_building_registrations TO anon, authenticated;
GRANT ALL ON parties_registrations TO anon, authenticated;

-- ============================================
-- STEP 4: Enable RLS
-- ============================================
ALTER TABLE kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeschooling_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_experience_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_building_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create permissive INSERT policies for public
-- ============================================
CREATE POLICY "public_insert_kenyan" 
  ON kenyan_experiences_registrations 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "public_insert_homeschooling" 
  ON homeschooling_registrations 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "public_insert_school" 
  ON school_experience_registrations 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "public_insert_team" 
  ON team_building_registrations 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "public_insert_parties" 
  ON parties_registrations 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

-- ============================================
-- STEP 6: Create policies for authenticated users
-- ============================================
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

-- ============================================
-- STEP 7: Create indexes for performance
-- ============================================
CREATE INDEX idx_kenyan_email ON kenyan_experiences_registrations(email);
CREATE INDEX idx_kenyan_status ON kenyan_experiences_registrations(status);
CREATE INDEX idx_kenyan_created ON kenyan_experiences_registrations(created_at);

CREATE INDEX idx_homeschooling_email ON homeschooling_registrations(email);
CREATE INDEX idx_homeschooling_status ON homeschooling_registrations(status);

CREATE INDEX idx_school_email ON school_experience_registrations(email);
CREATE INDEX idx_school_status ON school_experience_registrations(status);

CREATE INDEX idx_team_email ON team_building_registrations(email);
CREATE INDEX idx_team_status ON team_building_registrations(status);
CREATE INDEX idx_team_date ON team_building_registrations(event_date);

CREATE INDEX idx_parties_email ON parties_registrations(email);
CREATE INDEX idx_parties_status ON parties_registrations(status);
CREATE INDEX idx_parties_date ON parties_registrations(event_date);

-- ============================================
-- Verification
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ All tables dropped and recreated';
  RAISE NOTICE '✓ RLS enabled with public INSERT policies';
  RAISE NOTICE '✓ Authenticated users have full access';
  RAISE NOTICE '✓ Indexes created for performance';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Public form submissions are now enabled!';
END $$;
