-- Email Management System
-- Create tables for email suppressions, deliveries, and segments

-- Email suppression list for bounced/unsubscribed addresses
CREATE TABLE IF NOT EXISTS email_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  suppression_type text NOT NULL CHECK (suppression_type IN ('bounce_hard', 'bounce_soft', 'spam_complaint', 'unsubscribe', 'manual')),
  reason text,
  bounce_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Email delivery tracking
CREATE TABLE IF NOT EXISTS email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  message_id text,
  recipient_type text CHECK (recipient_type IN ('lead', 'customer', 'registration')),
  recipient_id uuid,
  email_type text NOT NULL CHECK (email_type IN ('confirmation', 'marketing', 'transactional', 'notification')),
  subject text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'spam')),
  postmark_data jsonb,
  sent_at timestamp with time zone DEFAULT now(),
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  bounced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Email segments for targeted campaigns
CREATE TABLE IF NOT EXISTS email_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filters jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add email preferences to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_subscribed boolean DEFAULT true;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS subscribed_at timestamp with time zone DEFAULT now();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed_at timestamp with time zone;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bounce_count integer DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_bounce_date timestamp with time zone;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_valid boolean DEFAULT true;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_suppressions_email ON email_suppressions(email);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_email ON email_deliveries(email);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_status ON email_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_leads_email_subscribed ON leads(email_subscribed);
CREATE INDEX IF NOT EXISTS idx_leads_program_type ON leads(program_type);

-- Enable RLS
ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_segments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_suppressions
-- Anyone can check if an email is suppressed (for validation)
CREATE POLICY "Anyone can check suppressions"
  ON email_suppressions FOR SELECT
  USING (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can insert suppressions"
  ON email_suppressions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can delete
CREATE POLICY "Admins can delete suppressions"
  ON email_suppressions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for email_deliveries
CREATE POLICY "Marketing can view all deliveries"
  ON email_deliveries FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "System can insert deliveries"
  ON email_deliveries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for email_segments
CREATE POLICY "Marketing can manage segments"
  ON email_segments FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'marketing')
  );
