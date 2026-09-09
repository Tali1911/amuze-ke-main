
-- Analytics and Reporting Tables

-- Analytics Metrics Table
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('revenue', 'customers', 'employees', 'performance', 'efficiency')),
  department VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard Widgets Table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  widget_type VARCHAR(20) NOT NULL CHECK (widget_type IN ('chart', 'metric', 'table', 'progress')),
  data_source VARCHAR(100) NOT NULL,
  configuration JSONB,
  department VARCHAR(50) NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('financial', 'hr', 'marketing', 'operations', 'cross_departmental')),
  generated_by UUID REFERENCES admin_users(id),
  data JSONB,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_department ON analytics_metrics(department);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type ON analytics_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_period ON analytics_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_department ON dashboard_widgets(department);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_order ON dashboard_widgets(order_index);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);

-- RLS Policies
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Analytics metrics policies
CREATE POLICY "Department users can view their metrics" ON analytics_metrics
  FOR SELECT USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND (department = analytics_metrics.department OR role IN ('ADMIN', 'CEO'))));

CREATE POLICY "Department users can record metrics" ON analytics_metrics
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND (department = analytics_metrics.department OR role IN ('ADMIN', 'CEO'))));

-- Dashboard widget policies
CREATE POLICY "Department users can manage widgets" ON dashboard_widgets
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND (department = dashboard_widgets.department OR role IN ('ADMIN', 'CEO'))));

-- Report policies
CREATE POLICY "Users can view relevant reports" ON reports
  FOR SELECT USING (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND (id = generated_by OR role IN ('ADMIN', 'CEO'))));

CREATE POLICY "Users can generate reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth.uid() FROM admin_users WHERE email = auth.email() AND id = generated_by));
