-- =====================================================
-- Discount Audit Log: track every preview/apply/reject
-- for compliance on the Accounts portal.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.discount_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id uuid REFERENCES public.client_discounts(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('previewed','applied','rejected','revoked','created','email_sent')),
  client_email text,
  client_phone text,
  camp_type text,
  total_before numeric,
  total_after numeric,
  discount_amount numeric,
  reason text,
  registration_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_audit_discount ON public.discount_audit_log(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_audit_created  ON public.discount_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discount_audit_event    ON public.discount_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_discount_audit_email    ON public.discount_audit_log(lower(client_email));

ALTER TABLE public.discount_audit_log ENABLE ROW LEVEL SECURITY;

-- Accounts + Admins can read the trail
DROP POLICY IF EXISTS "Accounts and admins read discount audit" ON public.discount_audit_log;
CREATE POLICY "Accounts and admins read discount audit"
  ON public.discount_audit_log FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'accounts'::app_role)
  );

-- Anyone (including anon public registration form) can append events.
-- Append-only: no UPDATE/DELETE policy is granted.
DROP POLICY IF EXISTS "Anyone can append discount audit events" ON public.discount_audit_log;
CREATE POLICY "Anyone can append discount audit events"
  ON public.discount_audit_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
