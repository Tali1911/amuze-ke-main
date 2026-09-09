-- Fix calendar_events RLS policies - Version 2
-- Handles existing policies by dropping ALL policies first, then creating new ones

-- Drop ALL existing policies on calendar_events table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'calendar_events' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.calendar_events';
    END LOOP;
END $$;

-- Create new policies that allow marketing, admin, and CEO users to manage all events
CREATE POLICY "Marketing/Admin/CEO users can insert events"
  ON public.calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Marketing/Admin/CEO users can update all events"
  ON public.calendar_events
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "Marketing/Admin/CEO users can delete all events"
  ON public.calendar_events
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- Keep the public read access policy
CREATE POLICY "Public users can view events"
  ON public.calendar_events
  FOR SELECT
  TO public
  USING (true);

-- Add helpful comment
COMMENT ON TABLE public.calendar_events IS 'Calendar events table with RLS policies allowing marketing/admin/CEO users to manage all events';
