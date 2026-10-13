-- Assign admin role to existing IT admin user
-- Run this after the auth system setup migration

-- First, let's find all users in auth.users to identify the correct IT admin
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find the IT admin user ID from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'it.admin@amuseforest.com'
  LIMIT 1;

  -- If user exists, assign admin role
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to user: %', v_user_id;
  ELSE
    RAISE NOTICE 'IT admin user not found in auth.users table';
    RAISE NOTICE 'Please check existing users:';
  END IF;
END $$;

-- Verify the role assignment and show all users
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.department,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at;
