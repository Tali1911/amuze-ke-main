-- Add role management functions for admins

-- Function to change user role (removes old role and assigns new one)
CREATE OR REPLACE FUNCTION public.change_user_role(
  _user_id UUID,
  _new_role app_role,
  _changed_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove all existing roles for the user
  DELETE FROM public.user_roles
  WHERE user_id = _user_id;
  
  -- Assign the new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _new_role);
  
  -- Update the profile to reflect the role change
  UPDATE public.profiles
  SET updated_at = NOW()
  WHERE id = _user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.change_user_role TO authenticated;
