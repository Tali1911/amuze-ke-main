-- Persist the Parent/Guardian Permission (Participation) form acceptance on each
-- camp registration so admins can audit it from the All registrations tab.
ALTER TABLE public.camp_registrations
  ADD COLUMN IF NOT EXISTS participation_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS participation_consent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.camp_registrations.participation_consent_given IS
  'TRUE when the parent/guardian read and accepted the Participation / Permission form for this registration.';
COMMENT ON COLUMN public.camp_registrations.participation_consent_at IS
  'Timestamp of the participation/permission form acceptance.';

-- Backfill: public (online) form registrations could not be submitted without
-- accepting the permission form, so mark them accepted as of their registration date.
-- Ground/walk-in registrations are left as "not recorded" (no acceptance captured).
UPDATE public.camp_registrations
SET participation_consent_given = TRUE,
    participation_consent_at = COALESCE(participation_consent_at, created_at)
WHERE registration_type IN ('online_only', 'online_paid')
  AND participation_consent_given IS DISTINCT FROM TRUE;
