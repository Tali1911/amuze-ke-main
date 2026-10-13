-- Fix: camp_registrations trigger referenced NEW.parent_email/parent_name,
-- which don't exist on camp_registrations (parent details live in form_data JSON).
-- Re-create the function to read from form_data, matching the program_registrations pattern.

CREATE OR REPLACE FUNCTION public.trg_enroll_on_camp_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _name text;
BEGIN
  _email := COALESCE(
    (NEW.form_data->>'parent_email'),
    (NEW.form_data->>'parentEmail'),
    (NEW.form_data->>'email')
  );
  _name := COALESCE(
    (NEW.form_data->>'parent_name'),
    (NEW.form_data->>'parentName'),
    (NEW.form_data->>'fullName'),
    (NEW.form_data->>'name')
  );

  IF _email IS NOT NULL AND _email <> '' THEN
    PERFORM public.enroll_in_automations(
      'registration_created',
      _email,
      _name,
      NULL,
      jsonb_build_object('camp_type', NEW.camp_type, 'registration_id', NEW.id, 'source', 'camp')
    );
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.camp_registrations') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS camp_registrations_automation_enroll ON public.camp_registrations';
    EXECUTE 'CREATE TRIGGER camp_registrations_automation_enroll
      AFTER INSERT ON public.camp_registrations
      FOR EACH ROW EXECUTE FUNCTION public.trg_enroll_on_camp_registration()';
  END IF;
END $$;
