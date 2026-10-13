-- Marketing System Setup Migration
-- Run this in your Supabase SQL Editor (Database > SQL Editor)

-- Step 1: Create enum type for roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'ceo', 'marketing', 'hr', 'accounts', 'coach', 'governance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Step 3: Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  department text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 4: Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  program_type text NOT NULL,
  program_name text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  source text DEFAULT 'website',
  notes text,
  form_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  assigned_to uuid REFERENCES auth.users(id)
);

-- Step 5: Create content_items table
CREATE TABLE IF NOT EXISTS public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  content_type text DEFAULT 'page' CHECK (content_type IN ('page', 'post', 'announcement', 'campaign')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id uuid REFERENCES auth.users(id),
  published_at timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 6: Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  campaign_type text CHECK (campaign_type IN ('email', 'social', 'sms', 'general')),
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'paused', 'completed')),
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  metrics jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 7: Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Step 8: Create helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Step 9: Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_leads ON public.leads;
CREATE TRIGGER set_updated_at_leads
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_content ON public.content_items;
CREATE TRIGGER set_updated_at_content
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_campaigns ON public.campaigns;
CREATE TRIGGER set_updated_at_campaigns
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Step 10: Create RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Marketing can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Marketing can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "Published content is viewable by all" ON public.content_items;
DROP POLICY IF EXISTS "Marketing can manage content" ON public.content_items;
DROP POLICY IF EXISTS "Marketing can view all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Marketing can manage campaigns" ON public.campaigns;

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

-- Leads policies
CREATE POLICY "Marketing can view all leads"
  ON public.leads FOR SELECT
  USING (
    public.has_role(auth.uid(), 'marketing') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'ceo')
  );

CREATE POLICY "Marketing can manage leads"
  ON public.leads FOR ALL
  USING (
    public.has_role(auth.uid(), 'marketing') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'ceo')
  );

CREATE POLICY "Anyone can create leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- Content policies
CREATE POLICY "Published content is viewable by all"
  ON public.content_items FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "Marketing can manage content"
  ON public.content_items FOR ALL
  USING (
    public.has_role(auth.uid(), 'marketing') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'ceo')
  );

-- Campaigns policies
CREATE POLICY "Marketing can view all campaigns"
  ON public.campaigns FOR SELECT
  USING (
    public.has_role(auth.uid(), 'marketing') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'ceo')
  );

CREATE POLICY "Marketing can manage campaigns"
  ON public.campaigns FOR ALL
  USING (
    public.has_role(auth.uid(), 'marketing') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'ceo')
  );
