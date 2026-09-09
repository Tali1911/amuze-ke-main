-- Keep accounts_action_items in sync when a registration is marked paid,
-- and reconcile existing drifted rows.
--
-- Background: "Total Outstanding" (Accounts Dashboard, Pending Collections,
-- AR Aging / outstanding-by-activity reports) is computed from
-- accounts_action_items (status = 'pending', amount_due - amount_paid).
-- Several code paths only flipped camp_registrations.payment_status without
-- touching action items, leaving paid registrations still counted as
-- outstanding. This trigger is the server-side backstop for all paths.

------------------------------------------------------------------------------
-- 1. Trigger: auto-complete open action items when a registration is paid
------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_action_items_on_registration_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Paid trumps everything: no open collection rows may remain
  IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
    UPDATE public.accounts_action_items
    SET status = 'completed',
        amount_paid = amount_due,
        completed_at = COALESCE(completed_at, NOW())
    WHERE registration_id = NEW.id
      AND status IN ('pending', 'in_progress');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_action_items_on_registration_paid ON public.camp_registrations;
CREATE TRIGGER trigger_sync_action_items_on_registration_paid
AFTER UPDATE OF payment_status ON public.camp_registrations
FOR EACH ROW
EXECUTE FUNCTION public.sync_action_items_on_registration_paid();

------------------------------------------------------------------------------
-- 2. One-time reconciliation of existing drift
------------------------------------------------------------------------------

-- 2a. Registrations already fully paid -> complete their open action items
UPDATE public.accounts_action_items aai
SET status = 'completed',
    amount_paid = aai.amount_due,
    completed_at = COALESCE(aai.completed_at, NOW())
FROM public.camp_registrations cr
WHERE cr.id = aai.registration_id
  AND cr.payment_status = 'paid'
  AND aai.status IN ('pending', 'in_progress');

-- 2b. Partially-paid registrations -> pro-rate amount_paid across each
-- registration's open items from the actual completed payments on record
-- (mirrors the client-side isCompletedPayment rules: completed/paid/blank
-- status, excluding camp_registration_attempt rows).
WITH paid_totals AS (
  SELECT p.registration_id, COALESCE(SUM(p.amount), 0) AS total_paid
  FROM public.payments p
  WHERE p.registration_id IS NOT NULL
    AND (p.status IN ('completed', 'paid') OR p.status IS NULL OR p.status = '')
    AND COALESCE(p.source, '') <> 'camp_registration_attempt'
  GROUP BY p.registration_id
),
open_items AS (
  SELECT aai.id,
         pt.total_paid,
         SUM(aai.amount_due) OVER (PARTITION BY aai.registration_id) AS reg_due_total
  FROM public.accounts_action_items aai
  JOIN paid_totals pt ON pt.registration_id = aai.registration_id
  JOIN public.camp_registrations cr
    ON cr.id = aai.registration_id
   AND cr.payment_status = 'partial'
  WHERE aai.status IN ('pending', 'in_progress')
)
UPDATE public.accounts_action_items aai
SET amount_paid = LEAST(
      aai.amount_due,
      ROUND((oi.total_paid * aai.amount_due / NULLIF(oi.reg_due_total, 0))::numeric, 2)
    )
FROM open_items oi
WHERE aai.id = oi.id
  AND oi.reg_due_total > 0;
