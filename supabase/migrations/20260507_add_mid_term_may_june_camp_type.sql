-- Add 'mid-term-may-june' (and ensure other current camp types) to the
-- camp_registrations.camp_type CHECK constraint.
-- Submitting the May/June Mid-Term form was failing with:
--   new row for relation "camp_registrations" violates check constraint
--   "camp_registrations_camp_type_check"

ALTER TABLE public.camp_registrations
  DROP CONSTRAINT IF EXISTS camp_registrations_camp_type_check;

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
    'mid-term-may-june',
    'day-camps',
    'little-forest'
  ));

NOTIFY pgrst, 'reload schema';
