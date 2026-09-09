-- Site Analytics Tables for CTR Tracking
-- This migration creates tables to track page views and clicks on the public website

-- Page Views table
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  page_title TEXT,
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page Clicks table
CREATE TABLE IF NOT EXISTS page_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_view_id UUID REFERENCES page_views(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  element_type TEXT NOT NULL,
  element_text TEXT,
  element_href TEXT,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_clicks_created_at ON page_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_page_clicks_page_path ON page_clicks(page_path);
CREATE INDEX IF NOT EXISTS idx_page_clicks_visitor_id ON page_clicks(visitor_id);

-- Enable RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking (public site visitors)
CREATE POLICY "Allow anonymous page view inserts"
  ON page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous click inserts"
  ON page_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only marketing/admin can view analytics
CREATE POLICY "Marketing and admin can view page views"
  ON page_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'marketing', 'ceo')
    )
  );

CREATE POLICY "Marketing and admin can view page clicks"
  ON page_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'marketing', 'ceo')
    )
  );
