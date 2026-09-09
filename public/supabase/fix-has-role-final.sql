-- FINAL FIX for has_role function
-- This will completely rebuild the function with correct logic

-- Step 1: Drop the existing function (CASCADE will drop dependent policies)
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;

-- Step 2: Create the corrected function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- Step 3: Grant execute permission
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;

-- Step 4: Test the function
SELECT public.has_role('db8ee881-76a9-4455-83cb-219285b0e360'::uuid, 'marketing'::app_role) as test_result;

-- Step 5: Recreate all RLS policies

-- user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Marketing can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins and Marketing can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  );

-- leads policies
DROP POLICY IF EXISTS "Marketing can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Marketing can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Marketing can update leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;

CREATE POLICY "Marketing can view all leads" ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing can insert leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing can update leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Users can view their own leads" ON public.leads
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());

-- content_items policies
DROP POLICY IF EXISTS "Marketing can view all content" ON public.content_items;
DROP POLICY IF EXISTS "Marketing can insert content" ON public.content_items;
DROP POLICY IF EXISTS "Marketing can update content" ON public.content_items;
DROP POLICY IF EXISTS "Marketing can delete content" ON public.content_items;
DROP POLICY IF EXISTS "Public can view published content" ON public.content_items;

CREATE POLICY "Marketing can view all content" ON public.content_items
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing can insert content" ON public.content_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing can update content" ON public.content_items
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing can delete content" ON public.content_items
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Public can view published content" ON public.content_items
  FOR SELECT TO anon
  USING (status = 'published');

-- campaigns policies
DROP POLICY IF EXISTS "Marketing can view all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Marketing can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Marketing can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Marketing can delete campaigns" ON public.campaigns;

CREATE POLICY "Marketing can view all campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing can insert campaigns" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing can update campaigns" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing can delete campaigns" ON public.campaigns
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'marketing')
  );

-- Final test
SELECT 
  'Test Result' as check_name,
  public.has_role('db8ee881-76a9-4455-83cb-219285b0e360'::uuid, 'marketing'::app_role) as should_be_true;
