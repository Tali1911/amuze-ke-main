-- ===================================================================
-- MIGRATION: Add 'little-forest' to camp_type CHECK constraint
-- Run this in Supabase SQL Editor
-- ===================================================================

-- Step 1: Drop the existing CHECK constraint on camp_type
ALTER TABLE public.camp_registrations 
DROP CONSTRAINT IF EXISTS camp_registrations_camp_type_check;

-- Step 2: Add new CHECK constraint with 'little-forest' included
ALTER TABLE public.camp_registrations 
ADD CONSTRAINT camp_registrations_camp_type_check 
CHECK (camp_type IN (
  'easter', 
  'summer', 
  'end-year', 
  'mid-term-1', 
  'mid-term-2', 
  'mid-term-3', 
  'day-camps',
  'little-forest'
));

-- Step 3: Verify the constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.camp_registrations'::regclass
  AND conname = 'camp_registrations_camp_type_check';

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Successfully added little-forest to camp_type constraint';
END $$;
