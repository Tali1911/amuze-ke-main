-- Refresh the PostgREST schema cache to pick up the new program_name column
-- This is needed after adding columns to tables
NOTIFY pgrst, 'reload schema';

-- Verify the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'program_name'
  ) THEN
    RAISE NOTICE 'program_name column exists in leads table';
  ELSE
    RAISE EXCEPTION 'program_name column does NOT exist in leads table';
  END IF;
END $$;

-- Check if there are any existing leads
DO $$
DECLARE
  lead_count integer;
BEGIN
  SELECT COUNT(*) INTO lead_count FROM public.leads;
  RAISE NOTICE 'Total leads in database: %', lead_count;
END $$;
