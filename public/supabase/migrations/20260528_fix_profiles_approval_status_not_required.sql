-- Fix: client signups fail with "Database error saving new user"
-- Cause: handle_new_user() inserts approval_status = 'not_required' for client
-- accounts (added in 20260430_separate_clients_from_staff.sql), but the CHECK
-- constraint on profiles.approval_status only allows
-- ('pending','approved','rejected'). The insert from the trigger therefore
-- raises a check_violation, which Supabase surfaces to the client as
-- "Database error saving new user".
--
-- Fix: widen the CHECK constraint to allow 'not_required'.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_approval_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'not_required'));
