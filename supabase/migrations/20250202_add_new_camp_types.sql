-- Add new camp types to camp_registrations check constraint

-- Step 1: Drop the existing constraint
ALTER TABLE public.camp_registrations 
DROP CONSTRAINT IF EXISTS camp_registrations_camp_type_check;

-- Step 2: Update any existing records with old naming to new naming
-- This ensures no records violate the new constraint
UPDATE public.camp_registrations 
SET camp_type = 'mid-term-october' 
WHERE camp_type = 'mid-term-1';

UPDATE public.camp_registrations 
SET camp_type = 'mid-term-feb-march' 
WHERE camp_type = 'mid-term-2';

-- Step 3: Add new constraint with all camp types (old and new)
ALTER TABLE public.camp_registrations
ADD CONSTRAINT camp_registrations_camp_type_check 
CHECK (camp_type IN (
  'easter',
  'summer', 
  'end-year',
  'mid-term-1',
  'mid-term-2', 
  'mid-term-3',
  'mid-term-october',
  'mid-term-feb-march',
  'day-camps',
  'little-forest'
));
