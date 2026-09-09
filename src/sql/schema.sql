
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('CEO', 'ADMIN', 'HR', 'MARKETING', 'ACCOUNTS', 'COACH')),
  department VARCHAR(100),
  permissions TEXT[] DEFAULT '{}',
  is_super_admin BOOLEAN DEFAULT FALSE,
  company_id VARCHAR(100) DEFAULT 'company-1',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- Programs Table
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  duration VARCHAR(100),
  age_range VARCHAR(50),
  max_participants INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  schedule JSONB,
  requirements TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_name VARCHAR(255) NOT NULL,
  parent_email VARCHAR(255) NOT NULL,
  parent_phone VARCHAR(50),
  children JSONB NOT NULL,
  emergency_contact JSONB,
  medical_conditions TEXT,
  program_id UUID REFERENCES programs(id),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  total_amount DECIMAL(10,2),
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'customers', 'staff', 'parents')),
  publish_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  media_urls TEXT[],
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  details TEXT,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES admin_users(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(parent_email);
CREATE INDEX IF NOT EXISTS idx_customers_program ON customers(program_id);
CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_date ON announcements(publish_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
CREATE POLICY "Admin users can read all admin users" ON admin_users
  FOR SELECT USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Admin users can update themselves" ON admin_users
  FOR UPDATE USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Super admins can manage all admin users" ON admin_users
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND is_super_admin = true));

-- RLS Policies for customers
CREATE POLICY "Authenticated users can read customers" ON customers
  FOR SELECT USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Marketing and admin can manage customers" ON customers
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('MARKETING', 'ADMIN', 'CEO')));

-- RLS Policies for programs
CREATE POLICY "Everyone can read active programs" ON programs
  FOR SELECT USING (is_active = true OR auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Coaches and admins can manage programs" ON programs
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('COACH', 'ADMIN', 'CEO')));

-- RLS Policies for announcements
CREATE POLICY "Everyone can read active announcements" ON announcements
  FOR SELECT USING (is_active = true OR auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Marketing and admins can manage announcements" ON announcements
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('MARKETING', 'ADMIN', 'CEO')));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('ADMIN', 'CEO')));

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for system_settings
CREATE POLICY "Admins can read system settings" ON system_settings
  FOR SELECT USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('ADMIN', 'CEO')));

CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role = 'ADMIN'));

-- Functions to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES 
('migration_completed', 'false', 'Indicates if data migration from localStorage has been completed'),
('site_name', 'Youth Program Management', 'Name of the organization'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('email_notifications', 'true', 'Enable/disable email notifications'),
('backup_frequency', 'daily', 'How often to backup data')
ON CONFLICT (key) DO NOTHING;
