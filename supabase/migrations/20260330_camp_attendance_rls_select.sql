-- Allow all authenticated users to SELECT from camp_attendance
-- This is needed for the Accounts Portal Client Statements feature
CREATE POLICY IF NOT EXISTS "Authenticated users can read camp_attendance"
ON public.camp_attendance
FOR SELECT
TO authenticated
USING (true);
