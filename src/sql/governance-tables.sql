
-- Governance and Compliance Tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Policies Table
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  version VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
  category VARCHAR(100) NOT NULL,
  effective_date DATE,
  review_date DATE,
  owner VARCHAR(255) NOT NULL,
  approver VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk Assessments Table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  probability VARCHAR(20) CHECK (probability IN ('low', 'medium', 'high')),
  impact VARCHAR(20) CHECK (impact IN ('low', 'medium', 'high')),
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  mitigation_plan TEXT,
  owner VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'monitoring')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Records Table
CREATE TABLE IF NOT EXISTS compliance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  framework VARCHAR(100) NOT NULL,
  requirement VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('compliant', 'non_compliant', 'review_required', 'in_progress')),
  evidence TEXT,
  last_assessment DATE,
  next_review DATE,
  responsible_party VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Governance Documents Table
CREATE TABLE IF NOT EXISTS governance_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  access_level VARCHAR(20) DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'confidential', 'restricted')),
  tags TEXT[],
  owner VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy Approvals Table (for workflow tracking)
CREATE TABLE IF NOT EXISTS policy_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  approver_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Tasks Table (for general workflow management)
CREATE TABLE IF NOT EXISTS workflow_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(100) NOT NULL, -- 'policy', 'risk', 'document', etc.
  entity_id UUID NOT NULL,
  assignee_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(category);
CREATE INDEX IF NOT EXISTS idx_policies_review_date ON policies(review_date);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_status ON risk_assessments(status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_due_date ON risk_assessments(due_date);

CREATE INDEX IF NOT EXISTS idx_compliance_records_framework ON compliance_records(framework);
CREATE INDEX IF NOT EXISTS idx_compliance_records_status ON compliance_records(status);
CREATE INDEX IF NOT EXISTS idx_compliance_records_next_review ON compliance_records(next_review);

CREATE INDEX IF NOT EXISTS idx_governance_documents_category ON governance_documents(category);
CREATE INDEX IF NOT EXISTS idx_governance_documents_access_level ON governance_documents(access_level);
CREATE INDEX IF NOT EXISTS idx_governance_documents_status ON governance_documents(status);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assignee ON workflow_tasks(assignee_email);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_entity ON workflow_tasks(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for governance tables
CREATE POLICY "Governance users can read all governance data" ON policies
  FOR SELECT USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('GOVERNANCE', 'CEO', 'ADMIN')));

CREATE POLICY "Governance users can manage policies" ON policies
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('GOVERNANCE', 'CEO')));

CREATE POLICY "Governance users can read risk assessments" ON risk_assessments
  FOR SELECT USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('GOVERNANCE', 'CEO', 'ADMIN')));

CREATE POLICY "Governance users can manage risk assessments" ON risk_assessments
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('GOVERNANCE', 'CEO')));

CREATE POLICY "Governance users can read compliance records" ON compliance_records
  FOR SELECT USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('GOVERNANCE', 'CEO', 'ADMIN')));

CREATE POLICY "Governance users can manage compliance records" ON compliance_records
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND role IN ('GOVERNANCE', 'CEO')));

-- Triggers for updated_at
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON risk_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_records_updated_at BEFORE UPDATE ON compliance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_governance_documents_updated_at BEFORE UPDATE ON governance_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_tasks_updated_at BEFORE UPDATE ON workflow_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
