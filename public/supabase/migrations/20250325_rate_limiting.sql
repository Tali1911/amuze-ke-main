-- Rate Limiting Table for Form Submissions
-- This table tracks submission attempts per visitor/form type for rate limiting

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  form_type TEXT NOT NULL,
  ip_address TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits (visitor_id, form_type, submitted_at DESC);

-- Create index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
ON public.rate_limits (submitted_at);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for edge function)
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Create cleanup function to remove old records (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE submitted_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Comment for documentation
COMMENT ON TABLE public.rate_limits IS 'Tracks form submission attempts for rate limiting. Records older than 1 hour should be periodically cleaned up.';
COMMENT ON COLUMN public.rate_limits.visitor_id IS 'Unique visitor identifier from client localStorage';
COMMENT ON COLUMN public.rate_limits.form_type IS 'Type of form being submitted (e.g., holiday-camp, parties)';
COMMENT ON COLUMN public.rate_limits.ip_address IS 'Client IP address for additional tracking';
COMMENT ON COLUMN public.rate_limits.submitted_at IS 'Timestamp of submission attempt';
