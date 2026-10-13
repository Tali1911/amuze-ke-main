-- Add profile fields for all users
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Create coach_availability table
CREATE TABLE IF NOT EXISTS public.coach_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unavailable_date DATE NOT NULL,
  remark TEXT NOT NULL,
  notified_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (coach_id, unavailable_date)
);

ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;

-- Coaches can view their own availability
CREATE POLICY "Coaches can view own availability"
  ON public.coach_availability FOR SELECT
  TO authenticated
  USING (coach_id = auth.uid());

-- Coaches can insert their own availability
CREATE POLICY "Coaches can insert own availability"
  ON public.coach_availability FOR INSERT
  TO authenticated
  WITH CHECK (coach_id = auth.uid());

-- Coaches can update their own availability
CREATE POLICY "Coaches can update own availability"
  ON public.coach_availability FOR UPDATE
  TO authenticated
  USING (coach_id = auth.uid());

-- Coaches can delete their own availability
CREATE POLICY "Coaches can delete own availability"
  ON public.coach_availability FOR DELETE
  TO authenticated
  USING (coach_id = auth.uid());

-- Admins and CEO can view all availability
CREATE POLICY "Admins can view all availability"
  ON public.coach_availability FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
