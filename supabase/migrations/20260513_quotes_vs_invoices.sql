-- Quotation vs Invoice distinction for camp registrations.
--
-- Rules:
--   payment_status = 'paid'                          -> 'paid'
--   payment_status IN ('unpaid','partial') AND has attendance row -> 'invoice'
--   payment_status IN ('unpaid','partial') AND no attendance     -> 'quotation'
--
-- The doc type is persisted on the registration so reporting/filtering
-- stays fast and is consistent regardless of which client wrote the row.

------------------------------------------------------------------------------
-- 1. Schema
------------------------------------------------------------------------------

ALTER TABLE public.camp_registrations
  ADD COLUMN IF NOT EXISTS billing_doc_type text
    NOT NULL DEFAULT 'quotation'
    CHECK (billing_doc_type IN ('quotation', 'invoice', 'paid'));

ALTER TABLE public.camp_registrations
  ADD COLUMN IF NOT EXISTS quote_number text;

ALTER TABLE public.camp_registrations
  ADD COLUMN IF NOT EXISTS invoice_number text;

ALTER TABLE public.camp_registrations
  ADD COLUMN IF NOT EXISTS converted_to_invoice_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_camp_registrations_billing_doc_type
  ON public.camp_registrations(billing_doc_type);

------------------------------------------------------------------------------
-- 2. Backfill existing rows
------------------------------------------------------------------------------

-- Paid registrations → paid
UPDATE public.camp_registrations
SET billing_doc_type = 'paid'
WHERE payment_status = 'paid';

-- Unpaid/partial with any attendance → invoice
UPDATE public.camp_registrations cr
SET billing_doc_type = 'invoice',
    converted_to_invoice_at = COALESCE(converted_to_invoice_at, NOW())
WHERE cr.payment_status <> 'paid'
  AND EXISTS (
    SELECT 1 FROM public.camp_attendance ca
    WHERE ca.registration_id = cr.id
  );

-- Backfill numbers from registration_number for legacy rows
UPDATE public.camp_registrations
SET quote_number = 'QUO-' || REGEXP_REPLACE(COALESCE(registration_number, id::text), '^[A-Z]+-', '')
WHERE quote_number IS NULL
  AND billing_doc_type IN ('quotation','invoice','paid');

UPDATE public.camp_registrations
SET invoice_number = 'INV-' || REGEXP_REPLACE(COALESCE(registration_number, id::text), '^[A-Z]+-', '')
WHERE invoice_number IS NULL
  AND billing_doc_type IN ('invoice','paid');

------------------------------------------------------------------------------
-- 3. Trigger: maintain doc type when payment_status changes
------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_billing_doc_type_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Paid trumps everything
  IF NEW.payment_status = 'paid' THEN
    NEW.billing_doc_type := 'paid';
    -- Ensure an invoice number exists once they've paid
    IF NEW.invoice_number IS NULL THEN
      NEW.invoice_number := 'INV-' || REGEXP_REPLACE(COALESCE(NEW.registration_number, NEW.id::text), '^[A-Z]+-', '');
    END IF;
    RETURN NEW;
  END IF;

  -- Moving back from paid to unpaid/partial: keep as invoice if attendance exists,
  -- otherwise revert to quotation
  IF OLD.payment_status = 'paid' AND NEW.payment_status <> 'paid' THEN
    IF EXISTS (
      SELECT 1 FROM public.camp_attendance ca WHERE ca.registration_id = NEW.id
    ) THEN
      NEW.billing_doc_type := 'invoice';
    ELSE
      NEW.billing_doc_type := 'quotation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_billing_doc_type_on_payment ON public.camp_registrations;
CREATE TRIGGER trigger_sync_billing_doc_type_on_payment
BEFORE UPDATE OF payment_status ON public.camp_registrations
FOR EACH ROW
EXECUTE FUNCTION public.sync_billing_doc_type_on_payment();

------------------------------------------------------------------------------
-- 4. Trigger: convert quotation → invoice when first attendance is recorded.
--    We extend the existing create_accounts_action_item_on_checkin behavior
--    by adding a second, dedicated trigger so the original logic is untouched.
------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.convert_quote_to_invoice_on_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reg RECORD;
BEGIN
  SELECT id, payment_status, billing_doc_type, registration_number, invoice_number
  INTO reg
  FROM public.camp_registrations
  WHERE id = NEW.registration_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Only flip when currently a quotation and not yet paid
  IF reg.payment_status <> 'paid' AND reg.billing_doc_type = 'quotation' THEN
    UPDATE public.camp_registrations
    SET billing_doc_type = 'invoice',
        converted_to_invoice_at = NOW(),
        invoice_number = COALESCE(
          reg.invoice_number,
          'INV-' || REGEXP_REPLACE(COALESCE(reg.registration_number, reg.id::text), '^[A-Z]+-', '')
        )
    WHERE id = reg.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_convert_quote_to_invoice_on_checkin ON public.camp_attendance;
CREATE TRIGGER trigger_convert_quote_to_invoice_on_checkin
AFTER INSERT ON public.camp_attendance
FOR EACH ROW
EXECUTE FUNCTION public.convert_quote_to_invoice_on_checkin();
