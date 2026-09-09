-- User Approval System Migration
-- Adds approval status tracking for new user registrations

-- Add approval status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);

-- Update RLS policies to allow admins to view all profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'ceo')
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'ceo')
);

-- Function to approve user and assign role
CREATE OR REPLACE FUNCTION public.approve_user_with_role(
  _user_id UUID,
  _role app_role,
  _approved_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile approval status
  UPDATE public.profiles
  SET 
    approval_status = 'approved',
    approved_by = _approved_by,
    approved_at = NOW()
  WHERE id = _user_id;
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Function to reject user
CREATE OR REPLACE FUNCTION public.reject_user(
  _user_id UUID,
  _rejection_reason TEXT,
  _rejected_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    approval_status = 'rejected',
    rejection_reason = _rejection_reason,
    approved_by = _rejected_by,
    approved_at = NOW()
  WHERE id = _user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_user_with_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user TO authenticated;
