 -- Fix change_user_role function to match frontend call signature
 -- The frontend calls: change_user_role(_user_id, _new_role, _changed_by)
 
 -- First drop the existing function (if any)
 DROP FUNCTION IF EXISTS public.change_user_role(uuid, app_role, uuid);
 DROP FUNCTION IF EXISTS public.change_user_role(app_role, app_role, uuid);
 
 -- Create the function with correct signature
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
   -- Check if the caller has admin role
   IF NOT public.has_role(_changed_by, 'admin'::app_role) AND NOT public.has_role(_changed_by, 'ceo'::app_role) THEN
     RAISE EXCEPTION 'Only admins can change user roles';
   END IF;
 
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
 GRANT EXECUTE ON FUNCTION public.change_user_role(uuid, app_role, uuid) TO authenticated;