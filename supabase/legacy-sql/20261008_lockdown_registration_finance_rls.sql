-- RUN IN THE SUPABASE SQL EDITOR.
-- Lock down registration + finance records.
-- Public: may INSERT bookings only (no read-back).
-- Parents (signed in): may READ their own camp registrations/payments, matched by verified email.
-- Approved staff (approved profile + any staff role): full access.

-- 1. Helper: approved staff check (security definer avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_approved_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles r ON r.user_id = p.id
    WHERE p.id = _user_id AND p.approval_status = 'approved'
  )
$$;
REVOKE ALL ON FUNCTION public.is_approved_staff(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_approved_staff(uuid) TO authenticated, service_role;

-- 2. Close self-assign role hole
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;

-- 3. Users cannot self-approve: only admins may change approval_status
CREATE OR REPLACE FUNCTION public.protect_profile_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.approval_status := OLD.approval_status;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_protect_profile_approval ON public.profiles;
CREATE TRIGGER trg_protect_profile_approval
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_approval();

-- 4. Registration tables: public insert, staff full, parents read own (camp)
DO $$
DECLARE t text; pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'camp_registrations','homeschooling_registrations','kenyan_experiences_registrations',
    'school_experience_registrations','team_building_registrations','parties_registrations'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT INSERT ON public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('CREATE POLICY "public_insert" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "staff_all" ON public.%I FOR ALL TO authenticated USING (public.is_approved_staff(auth.uid())) WITH CHECK (public.is_approved_staff(auth.uid()))', t);
  END LOOP;
END $$;

CREATE POLICY "parent_read_own" ON public.camp_registrations
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- 5. Finance tables: staff only (payments also readable by owning parent)
DO $$
DECLARE t text; pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'payments','invoices','bills','vendors','bill_payments','accounts_action_items',
    'receipt_uploads','till_reconciliations','till_transactions','expenses','budgets','quotations'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('CREATE POLICY "staff_all" ON public.%I FOR ALL TO authenticated USING (public.is_approved_staff(auth.uid())) WITH CHECK (public.is_approved_staff(auth.uid()))', t);
  END LOOP;
END $$;

CREATE POLICY "parent_read_own_payments" ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.camp_registrations cr
    WHERE cr.id::text = payments.registration_id::text
      AND lower(cr.email) = lower(auth.jwt() ->> 'email')
  ));
