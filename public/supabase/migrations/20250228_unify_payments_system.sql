-- ============================================
-- UNIFIED PAYMENTS SYSTEM MIGRATION
-- Extends payments table to track all payment sources
-- ============================================

-- Add new columns to payments table for unified tracking
ALTER TABLE payments 
  ALTER COLUMN invoice_id DROP NOT NULL;

ALTER TABLE payments 
  ADD COLUMN IF NOT EXISTS registration_id UUID,
  ADD COLUMN IF NOT EXISTS registration_type TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS program_name TEXT;

-- Add index for faster lookups by registration
CREATE INDEX IF NOT EXISTS idx_payments_registration_id ON payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_source ON payments(source);

-- Add unique constraint to prevent duplicate payments for same registration+source
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_registration 
  ON payments(registration_id, source) 
  WHERE registration_id IS NOT NULL;

-- Update RLS policies to allow viewing payments by source
DROP POLICY IF EXISTS "Authenticated users can view payments" ON payments;
CREATE POLICY "Authenticated users can view payments" 
  ON payments FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert payments" ON payments;
CREATE POLICY "Authenticated users can insert payments" 
  ON payments FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update payments" ON payments;
CREATE POLICY "Authenticated users can update payments" 
  ON payments FOR UPDATE 
  TO authenticated 
  USING (true);

-- Comment on columns for documentation
COMMENT ON COLUMN payments.registration_id IS 'Links to camp_registrations or program_registrations';
COMMENT ON COLUMN payments.registration_type IS 'Type of registration: camp, program';
COMMENT ON COLUMN payments.source IS 'Where the payment was recorded: pending_collections, ground_registration, invoice, camp_registration, manual';
COMMENT ON COLUMN payments.customer_name IS 'Parent/customer name for display purposes';
COMMENT ON COLUMN payments.program_name IS 'Camp/program name for display purposes';
