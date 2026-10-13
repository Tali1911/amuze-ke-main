-- Migration to add invoice tracking to accounts_action_items
-- and fix invoice payment status sync

-- Add invoice tracking columns to accounts_action_items
ALTER TABLE accounts_action_items 
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id),
  ADD COLUMN IF NOT EXISTS invoice_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoice_sent_at TIMESTAMPTZ;

-- Create index for invoice lookups
CREATE INDEX IF NOT EXISTS idx_accounts_action_items_invoice_id 
  ON accounts_action_items(invoice_id);

-- Fix any existing invoices that have full payment but status is not 'paid'
UPDATE invoices 
SET status = 'paid'
WHERE id IN (
  SELECT i.id 
  FROM invoices i
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(p.amount), 0) as total_paid
    FROM payments p 
    WHERE p.invoice_id = i.id 
    AND p.status = 'completed'
  ) payments_sum ON true
  WHERE i.status != 'paid'
  AND i.status != 'cancelled'
  AND payments_sum.total_paid >= i.total_amount
);

-- Add trigger to auto-update invoice status when payment is created
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total NUMERIC;
  total_paid NUMERIC;
BEGIN
  -- Only process if payment is completed and has an invoice_id
  IF NEW.status = 'completed' AND NEW.invoice_id IS NOT NULL THEN
    -- Get invoice total
    SELECT total_amount INTO invoice_total
    FROM invoices
    WHERE id = NEW.invoice_id;
    
    -- Get total paid for this invoice
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments
    WHERE invoice_id = NEW.invoice_id
    AND status = 'completed';
    
    -- Update invoice status if fully paid
    IF total_paid >= invoice_total THEN
      UPDATE invoices
      SET status = 'paid'
      WHERE id = NEW.invoice_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS trigger_update_invoice_status_on_payment ON payments;
CREATE TRIGGER trigger_update_invoice_status_on_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_payment();
