-- Add clicked_at column to email_deliveries table
ALTER TABLE email_deliveries 
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;

-- Create index for better query performance on clicked_at
CREATE INDEX IF NOT EXISTS idx_email_deliveries_clicked_at 
ON email_deliveries(clicked_at) WHERE clicked_at IS NOT NULL;
