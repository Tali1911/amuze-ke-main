-- Create program registrations tables for Experiences, Schools, and Group Activities

-- Kenyan Experiences Registrations
CREATE TABLE IF NOT EXISTS kenyan_experiences_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_leader TEXT NOT NULL,
  participants JSONB NOT NULL, -- [{name, ageRange}]
  circuit TEXT NOT NULL CHECK (circuit IN ('mt-kenya', 'coast', 'mara', 'chalbi', 'western')),
  preferred_dates JSONB NOT NULL, -- [{date}]
  transport BOOLEAN DEFAULT FALSE,
  special_medical_needs TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homeschooling Registrations
CREATE TABLE IF NOT EXISTS homeschooling_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name TEXT NOT NULL,
  children JSONB NOT NULL, -- [{name, dateOfBirth}]
  package TEXT NOT NULL CHECK (package IN ('1-day-discovery', 'weekly-pod', 'project-based')),
  focus JSONB NOT NULL, -- ['STEM', 'History', 'Multi-Subject']
  transport BOOLEAN DEFAULT FALSE,
  meal BOOLEAN DEFAULT FALSE,
  allergies TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- School Experience Registrations
CREATE TABLE IF NOT EXISTS school_experience_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL,
  number_of_kids TEXT NOT NULL,
  number_of_adults TEXT NOT NULL,
  age_ranges JSONB NOT NULL, -- [{range}]
  package TEXT NOT NULL CHECK (package IN ('day-trip', 'sleep-away', 'after-school-club', 'physical-education')),
  preferred_dates JSONB NOT NULL, -- [{date}]
  location TEXT NOT NULL CHECK (location IN ('karura-gate-f', 'karura-gate-a', 'tigoni', 'ngong')),
  number_of_students TEXT NOT NULL,
  number_of_teachers TEXT NOT NULL,
  transport BOOLEAN DEFAULT FALSE,
  catering BOOLEAN DEFAULT FALSE,
  special_needs TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Building Registrations
CREATE TABLE IF NOT EXISTS team_building_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion TEXT NOT NULL CHECK (occasion IN ('birthday', 'family', 'corporate')),
  adults_number TEXT NOT NULL,
  children_number TEXT NOT NULL,
  age_range TEXT NOT NULL CHECK (age_range IN ('3-below', '4-6', '7-10', '11-13', '14-17', '18+')),
  package TEXT NOT NULL CHECK (package IN ('adventure', 'bushcraft', 'nature-carnival', 'family-corporate')),
  event_date DATE NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('karura-gate-f', 'karura-gate-a', 'tigoni', 'ngong')),
  decor BOOLEAN DEFAULT FALSE,
  catering BOOLEAN DEFAULT FALSE,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parties Registrations
CREATE TABLE IF NOT EXISTS parties_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion TEXT NOT NULL CHECK (occasion IN ('birthday', 'anniversary', 'reunion', 'other')),
  parent_name TEXT NOT NULL,
  children JSONB NOT NULL, -- [{childName, dateOfBirth, specialNeeds}]
  guests_number TEXT NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('half-day', 'full-day')),
  event_date DATE NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('karura-f', 'tigoni')),
  decor BOOLEAN DEFAULT FALSE,
  catering BOOLEAN DEFAULT FALSE,
  photography BOOLEAN DEFAULT FALSE,
  activities BOOLEAN DEFAULT FALSE,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeschooling_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_experience_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_building_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow anyone to insert (public forms)
CREATE POLICY "Allow public insert kenyan_experiences"
  ON kenyan_experiences_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public insert homeschooling"
  ON homeschooling_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public insert school_experience"
  ON school_experience_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public insert team_building"
  ON team_building_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public insert parties"
  ON parties_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policies - Admin can view/update all
CREATE POLICY "Admins can view all kenyan_experiences"
  ON kenyan_experiences_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'marketing')
    )
  );

CREATE POLICY "Admins can update kenyan_experiences"
  ON kenyan_experiences_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'marketing')
    )
  );

CREATE POLICY "Admins can view all homeschooling"
  ON homeschooling_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'marketing')
    )
  );

CREATE POLICY "Admins can update homeschooling"
  ON homeschooling_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'marketing')
    )
  );

CREATE POLICY "Admins can view all school_experience"
  ON school_experience_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'marketing')
    )
  );

CREATE POLICY "Admins can update school_experience"
  ON school_experience_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'marketing')
    )
  );

CREATE POLICY "Admins can view all team_building"
  ON team_building_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'marketing')
    )
  );

CREATE POLICY "Admins can update team_building"
  ON team_building_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'marketing')
    )
  );

CREATE POLICY "Admins can view all parties"
  ON parties_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'marketing')
    )
  );

CREATE POLICY "Admins can update parties"
  ON parties_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo', 'marketing')
    )
  );

-- Create indexes for better query performance
CREATE INDEX idx_kenyan_experiences_email ON kenyan_experiences_registrations(email);
CREATE INDEX idx_kenyan_experiences_status ON kenyan_experiences_registrations(status);
CREATE INDEX idx_kenyan_experiences_created ON kenyan_experiences_registrations(created_at DESC);

CREATE INDEX idx_homeschooling_email ON homeschooling_registrations(email);
CREATE INDEX idx_homeschooling_status ON homeschooling_registrations(status);
CREATE INDEX idx_homeschooling_created ON homeschooling_registrations(created_at DESC);

CREATE INDEX idx_school_experience_email ON school_experience_registrations(email);
CREATE INDEX idx_school_experience_status ON school_experience_registrations(status);
CREATE INDEX idx_school_experience_created ON school_experience_registrations(created_at DESC);

CREATE INDEX idx_team_building_email ON team_building_registrations(email);
CREATE INDEX idx_team_building_status ON team_building_registrations(status);
CREATE INDEX idx_team_building_event_date ON team_building_registrations(event_date);

CREATE INDEX idx_parties_email ON parties_registrations(email);
CREATE INDEX idx_parties_status ON parties_registrations(status);
CREATE INDEX idx_parties_event_date ON parties_registrations(event_date);
