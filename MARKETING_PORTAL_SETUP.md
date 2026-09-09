# Marketing Portal Setup Guide

## Step 1: Create Database Tables

Go to your Supabase project SQL Editor and run the following SQL:

```sql
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'ceo', 'marketing', 'hr', 'accounts', 'coach', 'governance');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
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

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  department text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create leads table for CRM
CREATE TABLE public.leads (
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

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create content_items table for CMS
CREATE TABLE public.content_items (
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

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Create campaigns table
CREATE TABLE public.campaigns (
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

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

-- RLS Policies for leads
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

-- Allow public insert for lead capture from forms
CREATE POLICY "Anyone can create leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- RLS Policies for content_items
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

-- RLS Policies for campaigns
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

-- Trigger to handle new user profile creation
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_updated_at_leads
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_updated_at_content
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_updated_at_campaigns
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
```

## Step 2: Create Test Marketing User

1. In your Supabase project, go to **Authentication** > **Users**
2. Click "Add User"
3. Create a user with these credentials:
   - **Email**: `marketing@amusekenya.co.ke`
   - **Password**: `Marketing2025!`
   - Confirm the password
   - Optionally disable "Send user an email confirmation"

## Step 3: Assign Marketing Role

After creating the user, go to the SQL Editor and run:

```sql
-- Get the user ID and assign marketing role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'marketing'::app_role 
FROM auth.users 
WHERE email = 'marketing@amusekenya.co.ke';
```

## Step 4: Login Credentials

Use these credentials to access the marketing portal:

- **Email**: `marketing@amusekenya.co.ke`
- **Password**: `Marketing2025!`

## Features

### CRM (Customer Relationship Management)
- View all leads captured from website forms
- Track lead status (New, Contacted, Qualified, Converted, Lost)
- Add notes to leads
- View complete form data for each lead
- Filter and search leads

### CMS (Content Management System)
- Create and manage website content
- Support for pages, posts, announcements, and campaigns
- Draft and publish workflow
- Content versioning

### Automated Lead Capture
All form submissions from the website are automatically captured as leads in the CRM, including:
- Homeschooling Program registrations
- School Experience requests
- Kenyan Experiences bookings
- Team Building inquiries
- Day Camps registrations
- Contact form submissions

## Next Steps

After setup, you can:
1. Login to the marketing portal at `/login`
2. Navigate using the sidebar to access different features
3. Check the Leads tab to see captured form submissions
4. Use the Content tab to manage website content
5. Access Analytics to view performance metrics
