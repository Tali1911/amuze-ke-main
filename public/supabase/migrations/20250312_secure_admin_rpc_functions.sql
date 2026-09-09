-- Security fix: Add role validation to admin RPC functions
-- This prevents any authenticated user from accessing admin-only data

-- Drop ALL existing overloads of these functions safely
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_user_email',
        'get_all_users_for_admin',
        'approve_user_with_role',
        'reject_user',
        'change_user_role'
      )
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- Recreate get_user_email with admin role check
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CRITICAL: Validate caller is admin or CEO
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo')) THEN
    RAISE EXCEPTION 'Only admins can access user emails';
  END IF;
  
  RETURN (SELECT email::text FROM auth.users WHERE id = _user_id);
END;
$$;

-- Recreate get_all_users_for_admin with admin role check
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
  -- CRITICAL: Validate caller is admin or CEO
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo')) THEN
    RAISE EXCEPTION 'Only admins can view all users';
  END IF;
  
  RETURN QUERY
  SELECT 
    au.id as user_id,
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
  ORDER BY au.created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
-- (The function itself checks for admin role)
GRANT EXECUTE ON FUNCTION public.get_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin TO authenticated;

-- Also secure the user management RPC functions
-- These should also check for admin role before executing

-- Secure approve_user_with_role function
CREATE OR REPLACE FUNCTION public.approve_user_with_role(
  _user_id UUID,
  _role TEXT,
  _approved_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CRITICAL: Validate caller is admin or CEO
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo')) THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;
  
  -- Update profile approval status
  UPDATE public.profiles
  SET 
    approval_status = 'approved',
    approved_at = NOW(),
    approved_by = _approved_by
  WHERE id = _user_id;
  
  -- Insert role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Secure reject_user function
CREATE OR REPLACE FUNCTION public.reject_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CRITICAL: Validate caller is admin or CEO
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo')) THEN
    RAISE EXCEPTION 'Only admins can reject users';
  END IF;
  
  -- Update profile to rejected
  UPDATE public.profiles
  SET approval_status = 'rejected'
  WHERE id = _user_id;
  
  RETURN TRUE;
END;
$$;

-- Secure change_user_role function
CREATE OR REPLACE FUNCTION public.change_user_role(
  _user_id UUID,
  _old_role TEXT,
  _new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CRITICAL: Validate caller is admin or CEO
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo')) THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  -- Prevent users from changing their own role to a higher privilege
  IF _user_id = auth.uid() AND _new_role IN ('admin', 'ceo') THEN
    RAISE EXCEPTION 'Cannot self-elevate privileges';
  END IF;
  
  -- Delete old role
  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role = _old_role::app_role;
  
  -- Insert new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _new_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_user_with_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_role TO authenticated;
