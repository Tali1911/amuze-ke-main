-- Persist participation/parent-guardian consent on client profiles so signed-in
-- clients don't have to re-read and re-tick the form on every registration.
ALTER TABLE public.client_profiles
  ADD COLUMN IF NOT EXISTS participation_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS participation_consent_date TIMESTAMPTZ;

COMMENT ON COLUMN public.client_profiles.participation_consent_given IS
  'TRUE once the client has read and accepted the Parent/Guardian Permission (or adult Participation) form. Used to auto-check the consent box on subsequent registrations.';
COMMENT ON COLUMN public.client_profiles.participation_consent_date IS
  'Timestamp of the most recent participation consent acceptance.';
