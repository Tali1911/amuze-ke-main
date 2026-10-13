-- Pending collections showed stale/incorrect parent names because
-- accounts_action_items stores a snapshot of parent_name/email/phone taken at
-- creation time. Backfill from the linked registration and keep it in sync.

UPDATE public.accounts_action_items aai
SET parent_name = cr.parent_name,
    email = COALESCE(NULLIF(TRIM(cr.email), ''), aai.email),
    phone = COALESCE(NULLIF(TRIM(cr.phone), ''), aai.phone)
FROM public.camp_registrations cr
WHERE aai.registration_id = cr.id
  AND aai.registration_type = 'camp'
  AND (
    COALESCE(TRIM(aai.parent_name), '') <> COALESCE(TRIM(cr.parent_name), '')
    OR COALESCE(TRIM(aai.email), '') <> COALESCE(TRIM(cr.email), '')
    OR COALESCE(TRIM(aai.phone), '') <> COALESCE(TRIM(cr.phone), '')
  );

-- Keep action items aligned whenever registration contact details change
CREATE OR REPLACE FUNCTION public.sync_action_item_parent_details()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.accounts_action_items
  SET parent_name = NEW.parent_name,
      email = COALESCE(NULLIF(TRIM(NEW.email), ''), email),
      phone = COALESCE(NULLIF(TRIM(NEW.phone), ''), phone),
      updated_at = now()
  WHERE registration_id = NEW.id
    AND registration_type = 'camp';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_action_item_parent_details ON public.camp_registrations;

CREATE TRIGGER trigger_sync_action_item_parent_details
AFTER UPDATE OF parent_name, email, phone ON public.camp_registrations
FOR EACH ROW
EXECUTE FUNCTION public.sync_action_item_parent_details();
