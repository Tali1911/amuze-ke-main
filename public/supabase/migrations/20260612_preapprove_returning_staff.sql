-- Pre-authorize returning staff by email so that when they (re-)sign up
-- (typically via Google after being deleted for forgotten password), the
-- handle_new_user trigger auto-approves them and assigns the prior role,
-- bypassing the pending-approval queue.

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS public.preapproved_staff (
  email        citext PRIMARY KEY,
  role         app_role NOT NULL,
  full_name    text,
  department   text,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.preapproved_staff TO authenticated;
GRANT ALL ON public.preapproved_staff TO service_role;

ALTER TABLE public.preapproved_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage preapproved staff" ON public.preapproved_staff;
CREATE POLICY "Admins manage preapproved staff"
ON public.preapproved_staff
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

-- Updated trigger: honour preapproved_staff entries on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type  TEXT;
  v_preapproved   public.preapproved_staff%ROWTYPE;
BEGIN
  v_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'staff');

  -- Look up pre-authorization by email (case-insensitive via citext)
  SELECT * INTO v_preapproved
  FROM public.preapproved_staff
  WHERE email = NEW.email::citext
  LIMIT 1;

  IF v_preapproved.email IS NOT NULL THEN
    -- Pre-authorized returning staff: force staff + approved
    v_account_type := 'staff';
  END IF;

  INSERT INTO public.profiles (id, full_name, department, account_type, approval_status)
  VALUES (
    NEW.id,
    COALESCE(
      v_preapproved.full_name,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'User'
    ),
    CASE
      WHEN v_preapproved.email IS NOT NULL THEN COALESCE(v_preapproved.department, 'General')
      WHEN v_account_type = 'client' THEN NULL
      ELSE COALESCE(NEW.raw_user_meta_data->>'department', 'General')
    END,
    v_account_type,
    CASE
      WHEN v_preapproved.email IS NOT NULL THEN 'approved'
      WHEN v_account_type = 'client' THEN 'not_required'
      ELSE 'pending'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    department = COALESCE(EXCLUDED.department, public.profiles.department),
    account_type = COALESCE(public.profiles.account_type, EXCLUDED.account_type),
    approval_status = CASE
      WHEN v_preapproved.email IS NOT NULL THEN 'approved'
      ELSE public.profiles.approval_status
    END,
    updated_at = now();

  IF v_preapproved.email IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_preapproved.role)
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.profiles
    SET approved_at = now(), updated_at = now()
    WHERE id = NEW.id;

    -- Consume the pre-authorization (one-shot)
    DELETE FROM public.preapproved_staff WHERE email = v_preapproved.email;
  END IF;

  -- Legacy IT admin auto-approval
  IF NEW.email = 'it.admin@amuseforest.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.profiles
    SET full_name = 'IT Admin',
        department = 'IT Department',
        account_type = 'staff',
        approval_status = 'approved',
        updated_at = now()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
