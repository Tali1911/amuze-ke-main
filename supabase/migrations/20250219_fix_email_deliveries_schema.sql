-- Fix email_deliveries table schema for SendGrid integration
-- Add missing columns needed by webhook handlers

-- Add bounce tracking columns
ALTER TABLE email_deliveries 
ADD COLUMN IF NOT EXISTS bounce_type TEXT,
ADD COLUMN IF NOT EXISTS bounce_reason TEXT,
ADD COLUMN IF NOT EXISTS click_url TEXT,
ADD COLUMN IF NOT EXISTS program_type TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_deliveries_bounce_type ON email_deliveries(bounce_type);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_program_type ON email_deliveries(program_type);

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Email deliveries schema updated successfully with bounce_type, bounce_reason, click_url, and program_type columns';
END $$;
