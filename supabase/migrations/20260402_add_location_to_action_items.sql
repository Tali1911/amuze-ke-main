-- Add location column to accounts_action_items for multi-location support
ALTER TABLE public.accounts_action_items
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Update existing action items with location from their registration
UPDATE public.accounts_action_items aai
SET location = cr.location
FROM public.camp_registrations cr
WHERE aai.registration_id = cr.id
  AND aai.location IS NULL;

-- Update the trigger to include location
CREATE OR REPLACE FUNCTION public.create_accounts_action_item_on_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reg RECORD;
  child_count INT;
  per_child_amount NUMERIC;
  per_child_paid NUMERIC;
BEGIN
  -- Load registration context
  SELECT
    id,
    parent_name,
    email,
    phone,
    camp_type,
    total_amount,
    payment_status,
    children,
    location
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

  -- Count children to calculate per-child amount
  BEGIN
    child_count := jsonb_array_length(reg.children::jsonb);
  EXCEPTION WHEN OTHERS THEN
    child_count := 1;
  END;
  IF child_count < 1 THEN
    child_count := 1;
  END IF;

  per_child_amount := ROUND(COALESCE(reg.total_amount, 0) / child_count, 2);

  -- Distribute any partial payment evenly across children
  per_child_paid := 0;
  IF reg.payment_status = 'partial' THEN
    SELECT COALESCE(SUM(amount), 0) / child_count INTO per_child_paid
    FROM public.payments
    WHERE registration_id = NEW.registration_id;
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
    location,
    status
  ) VALUES (
    NEW.registration_id,
    'camp',
    NEW.child_name,
    reg.parent_name,
    reg.email,
    reg.phone,
    'invoice_needed',
    per_child_amount,
    ROUND(per_child_paid, 2),
    reg.camp_type,
    COALESCE(reg.location, 'Kurura Gate F'),
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
