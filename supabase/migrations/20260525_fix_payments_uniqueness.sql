-- Allow multiple completed payments per registration (e.g. partial top-ups via
-- Paystack). The previous unique index on (registration_id, source) silently
-- blocked subsequent successful payment inserts, leaving clients stuck as
-- "unpaid" in the system even after a verified Paystack receipt.
--
-- New rule: a payment is uniquely identified by (registration_id, payment_reference).
-- Duplicate webhook deliveries for the same Paystack reference are still rejected,
-- but two different references (e.g. two real charges) are both recorded.

DROP INDEX IF EXISTS public.idx_payments_unique_registration;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_registration_reference
  ON public.payments(registration_id, payment_reference)
  WHERE registration_id IS NOT NULL
    AND payment_reference IS NOT NULL;

-- Helpful index for the reconciliation totalling query
CREATE INDEX IF NOT EXISTS idx_payments_registration_status
  ON public.payments(registration_id, status);

NOTIFY pgrst, 'reload schema';
