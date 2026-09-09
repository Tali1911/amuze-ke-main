-- Promote a registration from QUOTATION to INVOICE when the first child checks in.
-- Business rule: a quotation becomes an invoice the moment a child is marked as
-- attending. This keeps the All page, Attendance, and Accounts pages in sync
-- (the Pending Collection bucket = invoices not yet fully paid).

CREATE OR REPLACE FUNCTION public.promote_quote_to_invoice_on_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reg RECORD;
  new_invoice_no TEXT;
BEGIN
  SELECT id, billing_doc_type, payment_status, invoice_number, converted_to_invoice_at
  INTO reg
  FROM public.camp_registrations
  WHERE id = NEW.registration_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Already an invoice or already paid → nothing to do
  IF reg.billing_doc_type IN ('invoice', 'paid') THEN
    RETURN NEW;
  END IF;

  IF reg.payment_status = 'paid' THEN
    RETURN NEW;
  END IF;

  -- Build a unique invoice number if one isn't already set
  IF reg.invoice_number IS NULL OR reg.invoice_number = '' THEN
    new_invoice_no := 'INV-' ||
      upper(to_char(now(), 'YYMMDD')) || '-' ||
      upper(substring(md5(reg.id::text || clock_timestamp()::text) for 6));
  ELSE
    new_invoice_no := reg.invoice_number;
  END IF;

  UPDATE public.camp_registrations
  SET
    billing_doc_type = 'invoice',
    invoice_number = new_invoice_no,
    converted_to_invoice_at = COALESCE(converted_to_invoice_at, now())
  WHERE id = reg.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_promote_quote_to_invoice_on_checkin
  ON public.camp_attendance;

CREATE TRIGGER trigger_promote_quote_to_invoice_on_checkin
AFTER INSERT ON public.camp_attendance
FOR EACH ROW
EXECUTE FUNCTION public.promote_quote_to_invoice_on_checkin();
