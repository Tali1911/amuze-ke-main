-- Helper function to get user emails for admin dashboard
-- This allows admins to view user emails without exposing auth.users table directly

CREATE OR REPLACE FUNCTION public.get_user_email(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = _user_id;
$$;

-- Function to get all users with their profiles and roles for admin dashboard
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
GRANT EXECUTE ON FUNCTION public.get_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin TO authenticated;
