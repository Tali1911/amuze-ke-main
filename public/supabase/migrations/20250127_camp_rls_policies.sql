-- RLS Policies for camp_registrations

-- Public users can insert their own registrations
DROP POLICY IF EXISTS "Public can create registrations" ON public.camp_registrations;
CREATE POLICY "Public can create registrations"
ON public.camp_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Public users can view their own registrations by QR code (for scan page)
DROP POLICY IF EXISTS "Public can view by QR code" ON public.camp_registrations;
CREATE POLICY "Public can view by QR code"
ON public.camp_registrations
FOR SELECT
TO anon, authenticated
USING (true);

-- Admins, CEO, and Marketing can view all registrations
DROP POLICY IF EXISTS "Staff can view all registrations" ON public.camp_registrations;
CREATE POLICY "Staff can view all registrations"
ON public.camp_registrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'ceo', 'marketing', 'coach')
  )
);

-- Admins, CEO, and Marketing can update registrations
DROP POLICY IF EXISTS "Staff can update registrations" ON public.camp_registrations;
CREATE POLICY "Staff can update registrations"
ON public.camp_registrations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'ceo', 'marketing', 'coach')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'ceo', 'marketing', 'coach')
  )
);

-- RLS Policies for camp_attendance

-- Only staff can view attendance
DROP POLICY IF EXISTS "Staff can view attendance" ON public.camp_attendance;
CREATE POLICY "Staff can view attendance"
ON public.camp_attendance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'ceo', 'marketing', 'coach')
  )
);

-- Only staff can mark attendance
DROP POLICY IF EXISTS "Staff can mark attendance" ON public.camp_attendance;
CREATE POLICY "Staff can mark attendance"
ON public.camp_attendance
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'ceo', 'marketing', 'coach')
  )
);

-- Only staff can update attendance
DROP POLICY IF EXISTS "Staff can update attendance" ON public.camp_attendance;
CREATE POLICY "Staff can update attendance"
ON public.camp_attendance
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'ceo', 'marketing', 'coach')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'ceo', 'marketing', 'coach')
  )
);
