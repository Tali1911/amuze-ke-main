-- Campaign scheduling + send-window throttling
-- Adds the ability to compose a blast now and dispatch it later, with an
-- optional "send only between hour X and hour Y EAT" window.
--
-- Dispatch is driven by a pg_cron job that hits the
-- process-scheduled-campaigns edge function every 5 minutes.

-- ---------- 1. Schema ----------

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
  ADD COLUMN IF NOT EXISTS send_window_start_hour smallint
    CHECK (send_window_start_hour IS NULL OR (send_window_start_hour BETWEEN 0 AND 23)),
  ADD COLUMN IF NOT EXISTS send_window_end_hour smallint
    CHECK (send_window_end_hour IS NULL OR (send_window_end_hour BETWEEN 0 AND 23)),
  ADD COLUMN IF NOT EXISTS recipients_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS scheduled_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS dispatch_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispatch_error text;

-- Allow the new 'scheduled' status. The original check constraint is unnamed
-- (auto-generated), so we find and drop whichever constraint currently
-- restricts campaigns.status, then re-add a permissive one.
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.campaigns'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%IN%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.campaigns DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('planning', 'scheduled', 'active', 'paused', 'completed', 'cancelled', 'failed'));

CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_for
  ON public.campaigns (scheduled_for)
  WHERE status = 'scheduled';

-- ---------- 2. Cron + pg_net wiring ----------

-- Both extensions ship with Supabase; CREATE EXTENSION IF NOT EXISTS is a no-op
-- when already installed.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Vault is used to keep the service-role key out of the migration SQL.
-- The key is read at runtime via vault.decrypted_secrets.
-- We expect a secret named 'service_role_key' to exist. Setup script:
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
-- If it isn't present yet, the cron job below will simply no-op until it is.

CREATE OR REPLACE FUNCTION public.dispatch_scheduled_campaigns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
  v_url text := 'https://rfmyrqzrwamygvyibdbs.supabase.co/functions/v1/process-scheduled-campaigns';
BEGIN
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  IF v_key IS NULL THEN
    RAISE NOTICE 'service_role_key vault secret missing; skipping campaign dispatch';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key,
      'X-Internal-Secret', v_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
END;
$$;

-- (Re)create the cron job (every 5 minutes).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dispatch-scheduled-campaigns') THEN
    PERFORM cron.unschedule('dispatch-scheduled-campaigns');
  END IF;
  PERFORM cron.schedule(
    'dispatch-scheduled-campaigns',
    '*/5 * * * *',
    $cron$SELECT public.dispatch_scheduled_campaigns();$cron$
  );
END $$;
