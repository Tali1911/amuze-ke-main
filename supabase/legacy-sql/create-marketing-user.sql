-- Create marketing user directly in Supabase
-- Run this in the Supabase SQL Editor after running the migration

-- First, you need to create the user in the Supabase Auth dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Email: marketing@amusekenya.co.ke
-- 4. Password: Marketing2025!
-- 5. Check "Auto Confirm User"
-- 6. Click "Create user"

-- Then, copy the user ID from the users table and run this query:
-- Replace 'USER_ID_HERE' with the actual UUID from the created user

INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE'::uuid, 'marketing')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was assigned:
SELECT ur.*, au.email 
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE au.email = 'marketing@amusekenya.co.ke';
