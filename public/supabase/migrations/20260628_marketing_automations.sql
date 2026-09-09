-- =====================================================================
-- Phase 2: Marketing automation engine, drip sequences,
-- lead pipeline stages, activity timeline, and tasks.
-- =====================================================================

-- ----- 1. Lead pipeline columns + tags + owner + follow-up ------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS pipeline_stage text
    CHECK (pipeline_stage IN ('new','contacted','quoted','booked','lost'))
    DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();

-- Backfill pipeline_stage from existing status where possible.
UPDATE public.leads
   SET pipeline_stage = CASE
     WHEN status = 'converted' THEN 'booked'
     WHEN status = 'qualified' THEN 'quoted'
     WHEN status IN ('new','contacted','lost') THEN status
     ELSE 'new'
   END
 WHERE pipeline_stage IS NULL OR pipeline_stage = 'new';

CREATE INDEX IF NOT EXISTS leads_pipeline_stage_idx ON public.leads (pipeline_stage);
CREATE INDEX IF NOT EXISTS leads_owner_idx ON public.leads (owner_id);
CREATE INDEX IF NOT EXISTS leads_next_followup_idx ON public.leads (next_followup_at);
CREATE INDEX IF NOT EXISTS leads_tags_gin_idx ON public.leads USING gin (tags);

-- ----- 2. Lead activity timeline --------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN (
    'email_sent','email_opened','email_clicked','email_bounced','email_unsubscribed',
    'page_visit','registration','note','stage_change','tag_added','task','automation'
  )),
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_read_lead_activities" ON public.lead_activities;
CREATE POLICY "staff_read_lead_activities" ON public.lead_activities
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'marketing')
    OR public.has_role(auth.uid(), 'ceo')
  );

DROP POLICY IF EXISTS "staff_write_lead_activities" ON public.lead_activities;
CREATE POLICY "staff_write_lead_activities" ON public.lead_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'marketing')
    OR public.has_role(auth.uid(), 'ceo')
  );

DROP POLICY IF EXISTS "staff_update_lead_activities" ON public.lead_activities;
CREATE POLICY "staff_update_lead_activities" ON public.lead_activities
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'marketing')
    OR public.has_role(auth.uid(), 'ceo')
  );

CREATE INDEX IF NOT EXISTS lead_activities_lead_idx ON public.lead_activities (lead_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS lead_activities_type_idx ON public.lead_activities (activity_type);

-- ----- 3. Lead tasks --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  due_at timestamptz,
  completed_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_tasks TO authenticated;
GRANT ALL ON public.lead_tasks TO service_role;

ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_all_lead_tasks" ON public.lead_tasks;
CREATE POLICY "staff_all_lead_tasks" ON public.lead_tasks
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'marketing')
    OR public.has_role(auth.uid(), 'ceo')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'marketing')
    OR public.has_role(auth.uid(), 'ceo')
  );

CREATE INDEX IF NOT EXISTS lead_tasks_lead_idx ON public.lead_tasks (lead_id);
CREATE INDEX IF NOT EXISTS lead_tasks_due_idx ON public.lead_tasks (due_at) WHERE completed_at IS NULL;

-- ----- 4. Marketing automations ---------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','archived')),
  trigger_type text NOT NULL
    CHECK (trigger_type IN ('lead_created','registration_created','attendance_marked','time_based','manual')),
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_automations TO authenticated;
GRANT ALL ON public.marketing_automations TO service_role;

ALTER TABLE public.marketing_automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_all_marketing_automations" ON public.marketing_automations;
CREATE POLICY "staff_all_marketing_automations" ON public.marketing_automations
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'marketing')
    OR public.has_role(auth.uid(), 'ceo')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'marketing')
    OR public.has_role(auth.uid(), 'ceo')
  );

CREATE INDEX IF NOT EXISTS marketing_automations_status_idx ON public.marketing_automations (status);
CREATE INDEX IF NOT EXISTS marketing_automations_trigger_idx ON public.marketing_automations (trigger_type);

-- ----- 5. Automation enrollments --------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_automation_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.marketing_automations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  current_step integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','cancelled','failed')),
  next_run_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  last_error text,
  context jsonb DEFAULT '{}'::jsonb,
  UNIQUE (automation_id, recipient_email)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_automation_enrollments TO authenticated;
GRANT ALL ON public.marketing_automation_enrollments TO service_role;

ALTER TABLE public.marketing_automation_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_all_automation_enrollments" ON public.marketing_automation_enrollments;
CREATE POLICY "staff_all_automation_enrollments" ON public.marketing_automation_enrollments
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'marketing')
    OR public.has_role(auth.uid(), 'ceo')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'marketing')
    OR public.has_role(auth.uid(), 'ceo')
  );

CREATE INDEX IF NOT EXISTS automation_enrollments_due_idx
  ON public.marketing_automation_enrollments (status, next_run_at);
CREATE INDEX IF NOT EXISTS automation_enrollments_lead_idx
  ON public.marketing_automation_enrollments (lead_id);

-- ----- 6. Enrollment trigger functions --------------------------------
-- Helper: enroll a recipient into all active automations matching a trigger.
CREATE OR REPLACE FUNCTION public.enroll_in_automations(
  _trigger_type text,
  _email text,
  _name text DEFAULT NULL,
  _lead_id uuid DEFAULT NULL,
  _context jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a record;
BEGIN
  IF _email IS NULL OR _email = '' THEN
    RETURN;
  END IF;

  FOR a IN
    SELECT id FROM public.marketing_automations
     WHERE status = 'active'
       AND trigger_type = _trigger_type
  LOOP
    INSERT INTO public.marketing_automation_enrollments
      (automation_id, lead_id, recipient_email, recipient_name, context, next_run_at)
    VALUES
      (a.id, _lead_id, lower(_email), _name, COALESCE(_context, '{}'::jsonb), now())
    ON CONFLICT (automation_id, recipient_email) DO NOTHING;
  END LOOP;
END;
$$;

-- Trigger: leads.insert -> enroll lead_created
CREATE OR REPLACE FUNCTION public.trg_enroll_on_lead_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enroll_in_automations(
    'lead_created',
    NEW.email,
    NEW.full_name,
    NEW.id,
    jsonb_build_object('program_type', NEW.program_type, 'program_name', NEW.program_name)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_automation_enroll ON public.leads;
CREATE TRIGGER leads_automation_enroll
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trg_enroll_on_lead_created();

-- Trigger: camp_registrations.insert -> enroll registration_created
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

-- Trigger: program_registrations.insert -> enroll registration_created
CREATE OR REPLACE FUNCTION public.trg_enroll_on_program_registration()
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
    NEW.contact_email,
    (NEW.form_data->>'email'),
    (NEW.form_data->>'parent_email')
  );
  _name := COALESCE(
    NEW.contact_name,
    (NEW.form_data->>'fullName'),
    (NEW.form_data->>'parent_name'),
    (NEW.form_data->>'name')
  );

  IF _email IS NOT NULL AND _email <> '' THEN
    PERFORM public.enroll_in_automations(
      'registration_created',
      _email,
      _name,
      NULL,
      jsonb_build_object('program_type', NEW.program_type, 'registration_id', NEW.id, 'source', 'program')
    );
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.program_registrations') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS program_registrations_automation_enroll ON public.program_registrations';
    EXECUTE 'CREATE TRIGGER program_registrations_automation_enroll
      AFTER INSERT ON public.program_registrations
      FOR EACH ROW EXECUTE FUNCTION public.trg_enroll_on_program_registration()';
  END IF;
END $$;

-- Trigger: camp_attendance.insert -> enroll attendance_marked
CREATE OR REPLACE FUNCTION public.trg_enroll_on_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _name text;
BEGIN
  SELECT parent_email, parent_name
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

-- ----- 7. Lead activity auto-population -------------------------------
-- Log stage_change on leads.pipeline_stage update
CREATE OR REPLACE FUNCTION public.trg_log_lead_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, title, description, metadata)
    VALUES (NEW.id, 'stage_change',
      'Stage changed: ' || COALESCE(OLD.pipeline_stage,'?') || ' → ' || COALESCE(NEW.pipeline_stage,'?'),
      NULL,
      jsonb_build_object('from', OLD.pipeline_stage, 'to', NEW.pipeline_stage));
    NEW.last_activity_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_log_stage_change ON public.leads;
CREATE TRIGGER leads_log_stage_change
  BEFORE UPDATE OF pipeline_stage ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_lead_stage_change();

-- Log email events from email_send_log into matching lead activity timelines
CREATE OR REPLACE FUNCTION public.trg_log_email_event_to_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lead_id uuid;
  _activity_type text;
  _title text;
BEGIN
  IF NEW.recipient_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only log meaningful, distinct states.
  IF NEW.status NOT IN ('sent','bounced','complained') THEN
    RETURN NEW;
  END IF;

  SELECT id INTO _lead_id
    FROM public.leads
   WHERE lower(email) = lower(NEW.recipient_email)
   ORDER BY created_at DESC
   LIMIT 1;

  IF _lead_id IS NULL THEN
    RETURN NEW;
  END IF;

  _activity_type := CASE NEW.status
    WHEN 'sent' THEN 'email_sent'
    WHEN 'bounced' THEN 'email_bounced'
    WHEN 'complained' THEN 'email_unsubscribed'
    ELSE 'email_sent'
  END;

  _title := COALESCE(NEW.template_name, 'Email') || ': ' || NEW.status;

  INSERT INTO public.lead_activities (lead_id, activity_type, title, metadata)
  VALUES (_lead_id, _activity_type, _title,
    jsonb_build_object('message_id', NEW.message_id, 'template', NEW.template_name));

  UPDATE public.leads SET last_activity_at = now() WHERE id = _lead_id;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='email_send_log') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS email_send_log_to_lead_activity ON public.email_send_log';
    EXECUTE 'CREATE TRIGGER email_send_log_to_lead_activity
              AFTER INSERT ON public.email_send_log
              FOR EACH ROW EXECUTE FUNCTION public.trg_log_email_event_to_lead()';
  END IF;
END $$;

-- ----- 8. Cron dispatcher for the automation worker -------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.dispatch_marketing_automations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text;
  _key text;
BEGIN
  SELECT decrypted_secret INTO _url
    FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO _key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  IF _url IS NULL OR _key IS NULL THEN
    RAISE NOTICE 'project_url or service_role_key vault secret missing; skipping dispatch.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := _url || '/functions/v1/process-marketing-automations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _key,
      'X-Internal-Secret', _key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule every 5 minutes (drop the previous one first to avoid duplicates).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dispatch-marketing-automations') THEN
    PERFORM cron.unschedule('dispatch-marketing-automations');
  END IF;
  PERFORM cron.schedule(
    'dispatch-marketing-automations',
    '*/5 * * * *',
    'SELECT public.dispatch_marketing_automations();'
  );
END $$;
