-- Fix: camp_registrations has no form_data/parent_email columns.
-- Real columns are: email, parent_name, children (jsonb).
-- Previous trigger functions referenced non-existent fields, breaking
-- ground registration INSERTs and attendance check-in INSERTs.

-- 1) camp_registrations enroll trigger -> read NEW.email / NEW.parent_name
CREATE OR REPLACE FUNCTION public.trg_enroll_on_camp_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
    PERFORM public.enroll_in_automations(
      'registration_created',
      NEW.email,
      NEW.parent_name,
      NULL,
      jsonb_build_object('camp_type', NEW.camp_type, 'registration_id', NEW.id, 'source', 'camp')
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block a registration insert because of automation side-effects
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

-- 2) camp_attendance enroll trigger -> select email/parent_name (not parent_email)
CREATE OR REPLACE FUNCTION public.trg_enroll_on_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _name  text;
BEGIN
  SELECT email, parent_name
    INTO _email, _name
    FROM public.camp_registrations
   WHERE id = NEW.registration_id;

  IF _email IS NOT NULL AND _email <> '' THEN
    PERFORM public.enroll_in_automations(
      'attendance_marked',
      _email,
      _name,
      NULL,
      jsonb_build_object('attendance_id', NEW.id, 'registration_id', NEW.registration_id)
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block an attendance check-in because of automation side-effects
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.camp_attendance') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS camp_attendance_automation_enroll ON public.camp_attendance';
    EXECUTE 'CREATE TRIGGER camp_attendance_automation_enroll
      AFTER INSERT ON public.camp_attendance
      FOR EACH ROW EXECUTE FUNCTION public.trg_enroll_on_attendance()';
  END IF;
END $$;
