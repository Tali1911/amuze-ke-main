-- Allow 'homeschooling' registrations in camp_registrations.
-- Submitting the Homeschool Programme form was failing with:
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
    'little-forest',
    'homeschooling'
  ));

NOTIFY pgrst, 'reload schema';
