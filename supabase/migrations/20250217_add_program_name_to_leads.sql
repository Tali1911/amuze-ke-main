-- Add program_name column to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS program_name text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_program_name ON public.leads(program_name);
