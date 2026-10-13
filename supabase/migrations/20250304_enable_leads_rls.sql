-- Enable RLS on leads table (policies already exist but RLS was not enabled)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
