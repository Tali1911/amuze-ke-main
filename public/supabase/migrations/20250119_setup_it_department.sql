-- IT Department Setup Migration
-- This migration sets up a trigger to automatically assign admin role to IT admin email

-- Create a function to auto-assign admin role to specific email
CREATE OR REPLACE FUNCTION public.assign_it_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user is the IT admin
  IF NEW.email = 'it.admin@amuseforest.com' THEN
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Update profile metadata
    UPDATE public.profiles
    SET 
      full_name = 'IT Admin',
      department = 'IT Department'
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign admin role on user creation
DROP TRIGGER IF EXISTS on_it_admin_user_created ON auth.users;
CREATE TRIGGER on_it_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_it_admin_role();
