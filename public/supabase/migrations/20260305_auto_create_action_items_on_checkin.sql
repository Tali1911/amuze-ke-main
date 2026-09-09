-- Guarantee unpaid check-ins always create pending collection items
-- This removes reliance on client-side flow timing/state.

CREATE OR REPLACE FUNCTION public.create_accounts_action_item_on_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reg RECORD;
BEGIN
  -- Load registration context
  SELECT
    id,
    parent_name,
    email,
    phone,
    camp_type,
    total_amount,
    payment_status
  INTO reg
  FROM public.camp_registrations
  WHERE id = NEW.registration_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Only unpaid/partial registrations should create pending collections
  IF reg.payment_status = 'paid' THEN
    RETURN NEW;
  END IF;

  -- Prevent duplicate pending items for same registration + child
  IF EXISTS (
    SELECT 1
    FROM public.accounts_action_items aai
    WHERE aai.registration_id = NEW.registration_id
      AND aai.child_name = NEW.child_name
      AND aai.status = 'pending'
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.accounts_action_items (
    registration_id,
    registration_type,
    child_name,
    parent_name,
    email,
    phone,
    action_type,
    amount_due,
    amount_paid,
    camp_type,
    status
  ) VALUES (
    NEW.registration_id,
    'camp',
    NEW.child_name,
    reg.parent_name,
    reg.email,
    reg.phone,
    'invoice_needed',
    COALESCE(reg.total_amount, 0),
    0,
    reg.camp_type,
    'pending'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_accounts_action_item_on_checkin ON public.camp_attendance;

CREATE TRIGGER trigger_create_accounts_action_item_on_checkin
AFTER INSERT ON public.camp_attendance
FOR EACH ROW
EXECUTE FUNCTION public.create_accounts_action_item_on_checkin();
