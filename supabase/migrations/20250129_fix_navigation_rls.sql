-- Fix navigation_settings RLS policies
-- The issue: policies were checking for uppercase 'MARKETING' but roles are stored as lowercase 'marketing'

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view navigation settings" ON public.navigation_settings;
DROP POLICY IF EXISTS "Marketing users can update navigation settings" ON public.navigation_settings;
DROP POLICY IF EXISTS "Marketing users can insert navigation settings" ON public.navigation_settings;

-- Recreate policies with correct lowercase role names
CREATE POLICY "Anyone can view navigation settings"
ON public.navigation_settings
FOR SELECT
TO public
USING (true);

CREATE POLICY "Marketing users can update navigation settings"
ON public.navigation_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('marketing', 'admin', 'ceo')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('marketing', 'admin', 'ceo')
  )
);

CREATE POLICY "Marketing users can insert navigation settings"
ON public.navigation_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('marketing', 'admin', 'ceo')
  )
);
