-- Bank transfer payments failed to save because camp_registrations.payment_method
-- still had the original CHECK constraint allowing only pending/card/mpesa/cash_ground.
-- Any update with 'bank_transfer' was rejected ("Failed to update registration").

ALTER TABLE public.camp_registrations
  DROP CONSTRAINT IF EXISTS camp_registrations_payment_method_check;

ALTER TABLE public.camp_registrations
  ADD CONSTRAINT camp_registrations_payment_method_check
  CHECK (payment_method IN ('pending', 'card', 'mpesa', 'cash_ground', 'bank_transfer', 'cash', 'other'));

-- Same fix for program registrations if that table exists
DO $$
BEGIN
  IF to_regclass('public.program_registrations') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.program_registrations DROP CONSTRAINT IF EXISTS program_registrations_payment_method_check';
    EXECUTE 'ALTER TABLE public.program_registrations ADD CONSTRAINT program_registrations_payment_method_check CHECK (payment_method IS NULL OR payment_method IN (''pending'', ''card'', ''mpesa'', ''cash_ground'', ''bank_transfer'', ''cash'', ''other''))';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
