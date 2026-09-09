-- COMPLETE AUTH SYSTEM FIX
-- This migration completely resets and properly configures the authentication system
-- Run this to fix all authentication issues

-- Step 1: Clean up existing objects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_it_admin_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.assign_it_admin_role();

-- Drop all policies that depend on has_role function
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Marketing can view leads" ON public.leads;
DROP POLICY IF EXISTS "Marketing can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Marketing can update leads" ON public.leads;
DROP POLICY IF EXISTS "Marketing can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Marketing can manage content" ON public.content_items;
DROP POLICY IF EXISTS "Marketing can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Marketing can manage campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Marketing users can update navigation settings" ON public.navigation_settings;
DROP POLICY IF EXISTS "Marketing users can insert navigation settings" ON public.navigation_settings;
DROP POLICY IF EXISTS "Marketing users can manage FAQs" ON public.faq_items;

-- Now we can safely drop the has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;

-- Step 2: Recreate tables (they may already exist, that's fine)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  department text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Step 3: Configure RLS properly
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles - Allow system and users
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for user_roles - Allow system and users
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 4: Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 5: Create trigger function with proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Create profile for new user (RLS allows this via SECURITY DEFINER)
  INSERT INTO public.profiles (id, full_name, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'General')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    department = COALESCE(EXCLUDED.department, profiles.department),
    updated_at = now();
  
  -- Auto-assign admin role to IT admin email
  IF NEW.email = 'it.admin@amuseforest.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    UPDATE public.profiles
    SET 
      full_name = 'IT Admin',
      department = 'IT Department',
      updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 6: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Fix any existing IT admin user
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find existing IT admin
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'it.admin@amuseforest.com'
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Ensure profile exists
    INSERT INTO public.profiles (id, full_name, department)
    VALUES (v_user_id, 'IT Admin', 'IT Department')
    ON CONFLICT (id) DO UPDATE
    SET 
      full_name = 'IT Admin',
      department = 'IT Department',
      updated_at = now();
    
    -- Ensure admin role exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Fixed existing IT admin user: %', v_user_id;
  ELSE
    RAISE NOTICE 'No existing IT admin user found';
  END IF;
END $$;

-- Verification query
SELECT 
  u.id,
  u.email,
  u.encrypted_password IS NOT NULL as has_password,
  p.full_name,
  p.department,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'it.admin@amuseforest.com';
