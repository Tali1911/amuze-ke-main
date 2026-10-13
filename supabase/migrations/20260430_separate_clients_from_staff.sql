-- Separate client signups from staff in the admin user management queue,
-- and (re)create the reject_user RPC which is missing from the live schema.

-- 1) Add account_type to profiles ('staff' = portal user, 'client' = public website user)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT
  NOT NULL DEFAULT 'staff'
  CHECK (account_type IN ('staff', 'client'));

CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);

-- 2) Update handle_new_user trigger so clients are flagged and never enter the staff approval queue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type TEXT;
BEGIN
  -- Determine account type from signup metadata. Public website signup passes 'client'.
  v_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'staff');

  INSERT INTO public.profiles (id, full_name, department, account_type, approval_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    CASE WHEN v_account_type = 'client'
         THEN NULL
         ELSE COALESCE(NEW.raw_user_meta_data->>'department', 'General')
    END,
    v_account_type,
    CASE WHEN v_account_type = 'client' THEN 'not_required' ELSE 'pending' END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    department = COALESCE(EXCLUDED.department, public.profiles.department),
    account_type = COALESCE(public.profiles.account_type, EXCLUDED.account_type),
    updated_at = now();

  -- IT admin auto-approval (legacy)
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

-- 3) Backfill: any profile whose user has a client_profiles row is a client.
UPDATE public.profiles p
SET account_type = 'client',
    approval_status = CASE WHEN p.approval_status = 'pending' THEN 'not_required' ELSE p.approval_status END
WHERE EXISTS (SELECT 1 FROM public.client_profiles cp WHERE cp.id = p.id)
  AND p.account_type <> 'client';

-- 4) Filter the admin user list so only staff appear
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  department TEXT,
  approval_status TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo')) THEN
    RAISE EXCEPTION 'Only admins can view all users';
  END IF;

  RETURN QUERY
  SELECT
    au.id AS user_id,
    au.email::text,
    p.full_name,
    p.department,
    p.approval_status,
    ur.role::text,
    au.created_at,
    p.approved_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id
  WHERE COALESCE(p.account_type, 'staff') = 'staff'
  ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin TO authenticated;

-- 5) (Re)create reject_user — missing from the live schema cache (PGRST202)
DROP FUNCTION IF EXISTS public.reject_user(uuid, text, uuid);
CREATE OR REPLACE FUNCTION public.reject_user(
  _user_id UUID,
  _rejection_reason TEXT,
  _rejected_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo')) THEN
    RAISE EXCEPTION 'Only admins can reject users';
  END IF;

  UPDATE public.profiles
  SET
    approval_status = 'rejected',
    rejection_reason = _rejection_reason,
    approved_by = _rejected_by,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_user(uuid, text, uuid) TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
