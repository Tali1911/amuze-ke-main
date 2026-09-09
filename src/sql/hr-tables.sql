
-- Human Resources Management Tables

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  department VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  hire_date DATE NOT NULL,
  salary DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  manager_id UUID REFERENCES employees(id),
  emergency_contact JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Reviews Table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  reviewer_id UUID REFERENCES admin_users(id),
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  goals_achieved INTEGER CHECK (goals_achieved BETWEEN 0 AND 100),
  areas_of_strength TEXT[],
  areas_for_improvement TEXT[],
  goals_next_period TEXT[],
  comments TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'final')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  total_hours DECIMAL(4,2),
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half_day', 'sick_leave', 'vacation')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Training Records Table
CREATE TABLE IF NOT EXISTS training_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  training_name VARCHAR(255) NOT NULL,
  training_type VARCHAR(50) CHECK (training_type IN ('internal', 'external', 'online', 'certification')),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'failed')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  certificate_url TEXT,
  cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_title VARCHAR(255) NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  applicant_phone VARCHAR(50),
  resume_url TEXT NOT NULL,
  cover_letter TEXT,
  application_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  interview_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_training_employee ON training_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- Triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Employee policies
CREATE POLICY "HR team can manage employees" ON employees
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('HR', 'ADMIN', 'CEO')));

-- Performance review policies
CREATE POLICY "HR team can manage performance reviews" ON performance_reviews
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('HR', 'ADMIN', 'CEO')));

-- Attendance policies
CREATE POLICY "HR team can manage attendance" ON attendance_records
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('HR', 'ADMIN', 'CEO')));

-- Training policies
CREATE POLICY "HR team can manage training" ON training_records
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('HR', 'ADMIN', 'CEO')));

-- Job application policies
CREATE POLICY "HR team can manage job applications" ON job_applications
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('HR', 'ADMIN', 'CEO')));
