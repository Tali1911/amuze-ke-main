-- Fix calendar_events RLS policies to allow all marketing/admin/CEO users to update any event
-- This resolves the "Failed to update event" issue

-- Drop the overly restrictive policies
DROP POLICY IF EXISTS "Marketing users can update their own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Marketing users can delete their own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Marketing users can insert events" ON public.calendar_events;

-- Create broader policies that allow marketing, admin, and CEO users to manage all events
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

-- Add helpful comment
COMMENT ON TABLE public.calendar_events IS 'Calendar events table with RLS policies allowing marketing/admin/CEO users to manage all events';
