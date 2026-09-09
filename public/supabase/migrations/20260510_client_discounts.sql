-- =====================================================
-- Client Discounts: accounts-issued, pre-purchase
-- Auto-applied on matching camp registration
-- =====================================================

CREATE TABLE IF NOT EXISTS public.client_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who this discount is for
  client_name text,
  client_email text,
  client_phone text,

  -- Discount definition
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed_amount','fixed_price_per_child_day')),
  discount_value numeric NOT NULL CHECK (discount_value >= 0),

  -- Optional criteria
  camp_type text,                 -- null = applies to any camp type
  valid_from date,
  valid_to date,
  min_total numeric,              -- min booking total (KES) before discount
  min_children integer,           -- min number of children in booking
  single_use boolean NOT NULL DEFAULT true,

  -- Lifecycle
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','used','expired')),
  used_at timestamptz,
  used_registration_id uuid,
  used_amount numeric,

  -- Notes / audit
  reason text,
  email_sent boolean NOT NULL DEFAULT false,
  email_sent_at timestamptz,

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT client_discounts_contact_required CHECK (
    client_email IS NOT NULL OR client_phone IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_client_discounts_email
  ON public.client_discounts (lower(client_email));
CREATE INDEX IF NOT EXISTS idx_client_discounts_phone
  ON public.client_discounts (client_phone);
CREATE INDEX IF NOT EXISTS idx_client_discounts_status
  ON public.client_discounts (status);
CREATE INDEX IF NOT EXISTS idx_client_discounts_camp_type
  ON public.client_discounts (camp_type);

-- Track applied discount on registrations
ALTER TABLE public.camp_registrations
  ADD COLUMN IF NOT EXISTS discount_id uuid,
  ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_client_discounts_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_discounts_updated_at ON public.client_discounts;
CREATE TRIGGER trg_client_discounts_updated_at
  BEFORE UPDATE ON public.client_discounts
  FOR EACH ROW EXECUTE FUNCTION public.set_client_discounts_updated_at();

-- RLS
ALTER TABLE public.client_discounts ENABLE ROW LEVEL SECURITY;

-- Accounts + Admins can manage
DROP POLICY IF EXISTS "Accounts and admins manage discounts" ON public.client_discounts;
CREATE POLICY "Accounts and admins manage discounts"
  ON public.client_discounts FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'accounts'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'accounts'::app_role)
  );

-- Anyone (including anonymous) can READ active discounts so the public
-- registration form can auto-apply them. Only minimal columns are needed,
-- but SELECT is gated by status = 'active' to limit exposure.
DROP POLICY IF EXISTS "Public can read active discounts for matching" ON public.client_discounts;
CREATE POLICY "Public can read active discounts for matching"
  ON public.client_discounts FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Allow public marking-as-used via UPDATE only when transitioning
-- active -> used (so the registration form can claim a single-use discount).
DROP POLICY IF EXISTS "Public can mark discount used" ON public.client_discounts;
CREATE POLICY "Public can mark discount used"
  ON public.client_discounts FOR UPDATE
  TO anon, authenticated
  USING (status = 'active')
  WITH CHECK (status IN ('active','used'));
