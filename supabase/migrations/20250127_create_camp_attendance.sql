-- Create camp attendance table
CREATE TABLE IF NOT EXISTS public.camp_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.camp_registrations(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_camp_attendance_registration ON public.camp_attendance(registration_id);
CREATE INDEX IF NOT EXISTS idx_camp_attendance_date ON public.camp_attendance(attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_camp_attendance_child ON public.camp_attendance(child_name);

-- Enable RLS
ALTER TABLE public.camp_attendance ENABLE ROW LEVEL SECURITY;

-- Function to get today's attendance for a camp
CREATE OR REPLACE FUNCTION public.get_todays_attendance(p_camp_type TEXT DEFAULT NULL)
RETURNS TABLE (
  registration_id UUID,
  registration_number TEXT,
  parent_name TEXT,
  child_name TEXT,
  payment_status TEXT,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.registration_number,
    cr.parent_name,
    ca.child_name,
    cr.payment_status,
    ca.check_in_time,
    ca.check_out_time
  FROM public.camp_attendance ca
  JOIN public.camp_registrations cr ON ca.registration_id = cr.id
  WHERE ca.attendance_date = CURRENT_DATE
    AND (p_camp_type IS NULL OR cr.camp_type = p_camp_type)
  ORDER BY ca.check_in_time DESC;
END;
$$;
