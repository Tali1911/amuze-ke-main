-- Seed Mid-Term May/June 2026 camp data so registrations save correctly.
-- Adds:
--   1. camp_form content_item (slug: mid-term-may-june-form) with pricing,
--      session options and dates.
--   2. Refreshes camp_page content_item (slug: mid-term-may-june-page) so the
--      page exposes sessionDates and locationDetails.
--   3. calendar_events row with the May/June dates and capacity.
-- Idempotent: safe to run multiple times.

-- ------------------------------------------------------------------
-- 1. camp_form content_item: mid-term-may-june-form
-- ------------------------------------------------------------------
INSERT INTO public.content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'Mid-Term May/June Camp Form Config',
  'mid-term-may-june-form',
  'camp_form',
  'published',
  'Mid-term May/June camp registration form configuration',
  jsonb_build_object(
    'formConfig', jsonb_build_object(
      'pricing', jsonb_build_object(
        'halfDayRate', 1500,
        'fullDayRate', 2500,
        'ngongDayRate', 2000,
        'currency', 'KES'
      ),
      'locations', jsonb_build_array('Kurura Gate F', 'Ngong Sanctuary'),
      'archeryRate', 1000,
      'sessionDates', jsonb_build_object(
        'startDate', '2026-05-25',
        'endDate',   '2026-05-29'
      ),
      'availableDates', jsonb_build_array(
        '2026-05-25','2026-05-26','2026-05-27','2026-05-28','2026-05-29'
      ),
      'capacity', 40,
      'fields', jsonb_build_object(
        'parentName',        jsonb_build_object('label','Parent/Guardian Name','placeholder','Enter your full name','required',true),
        'childName',         jsonb_build_object('label','Child''s Full Name','placeholder','Enter child''s full name','required',true),
        'dateOfBirth',       jsonb_build_object('label','Date of Birth','placeholder','Select date','required',true),
        'ageRange',          jsonb_build_object('label','Age Range','placeholder','Select age range','required',true),
        'numberOfDays',      jsonb_build_object('label','Number of Days','placeholder','Enter number of days','helpText','Enter how many days you want to register for'),
        'sessionType',       jsonb_build_object('label','Session Type','halfDayLabel','Half Day (9AM-1PM)','fullDayLabel','Full Day (9AM-3PM)'),
        'specialNeeds',      jsonb_build_object('label','Special Needs/Medical Information','placeholder','Please describe any special needs, allergies, or medical conditions'),
        'emergencyContact',  jsonb_build_object('label','Emergency Contact Name','placeholder','Enter emergency contact name','required',true),
        'email',             jsonb_build_object('label','Email Address','placeholder','your.email@example.com','required',true),
        'phone',             jsonb_build_object('label','Phone Number','placeholder','+254 XXX XXX XXX','required',true)
      ),
      'buttons', jsonb_build_object(
        'registerOnly','Register Only',
        'registerAndPay','Register & Pay Now',
        'addChild','Add Another Child',
        'removeChild','Remove'
      ),
      'messages', jsonb_build_object(
        'registrationSuccess','Registration submitted successfully! We''ll contact you shortly.',
        'registrationError','Failed to submit registration. Please try again.',
        'chooseOption','Choose your registration option:',
        'paymentComingSoon','Payment integration coming soon. Both options will complete your registration.'
      ),
      'specialNeedsSection', jsonb_build_object(
        'title','Special Needs & Medical Information',
        'description','Please provide any information about allergies, medical conditions, or special accommodations needed.'
      )
    )
  )
)
ON CONFLICT (slug, content_type) DO UPDATE SET
  status   = EXCLUDED.status,
  content  = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ------------------------------------------------------------------
-- 2. camp_page content_item: mid-term-may-june-page (refresh with dates)
-- ------------------------------------------------------------------
INSERT INTO public.content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'Mid-Term Camp Page - May/June',
  'mid-term-may-june-page',
  'camp_page',
  'published',
  'Mid-term adventure awaits!',
  jsonb_build_object(
    'campType', 'mid-term-may-june',
    'pageConfig', jsonb_build_object(
      'title','Mid-Term Camp - May/June',
      'description','Make the most of your mid-term break with outdoor adventures and nature exploration!',
      'heroImage','/src/assets/camping.jpg',
      'duration','5 Days',
      'ageGroup','4-12 years',
      'location','Amuse Nature Experience Center',
      'time','9:00 AM - 3:00 PM',
      'sessionDates', jsonb_build_object(
        'startDate','2026-05-25',
        'endDate','2026-05-29'
      ),
      'availableDates', jsonb_build_array(
        '2026-05-25','2026-05-26','2026-05-27','2026-05-28','2026-05-29'
      ),
      'highlights', jsonb_build_array(
        'Outdoor exploration','Team building activities','Creative workshops',
        'Nature walks','Group games','Environmental education'
      ),
      'locationDetails', jsonb_build_array(
        jsonb_build_object(
          'name','Karura Gate F',
          'duration','5 Days',
          'ageGroup','4-12 years',
          'time','9:00 AM - 3:00 PM',
          'highlights', jsonb_build_array(
            'Outdoor exploration','Team building activities','Creative workshops',
            'Nature walks','Group games','Environmental education'
          )
        ),
        jsonb_build_object(
          'name','Ngong Sanctuary',
          'duration','5 Days',
          'ageGroup','4-12 years',
          'time','9:00 AM - 1:00 PM',
          'highlights', jsonb_build_array(
            'Archery sessions','Nature trails','Wildlife observation','Outdoor games'
          )
        )
      )
    )
  )
)
ON CONFLICT (slug, content_type) DO UPDATE SET
  status   = EXCLUDED.status,
  content  = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ------------------------------------------------------------------
-- 3. calendar_events: Mid-Term May/June 2026
-- ------------------------------------------------------------------
INSERT INTO public.calendar_events (
  title, start_date, end_date, description, color, location,
  max_attendees, program_type, registration_url, event_type, event_dates
)
SELECT
  'Mid-Term Camp - May/June 2026',
  '2026-05-25 09:00:00+03'::timestamptz,
  '2026-05-29 15:00:00+03'::timestamptz,
  'Five-day mid-term break adventure camp at Karura Gate F and Ngong Sanctuary.',
  'bg-forest-500',
  'Karura Gate F / Ngong Sanctuary',
  40,
  'mid-term-may-june',
  '/camps/mid-term/may-june',
  'camp',
  jsonb_build_array(
    '2026-05-25','2026-05-26','2026-05-27','2026-05-28','2026-05-29'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM public.calendar_events
  WHERE program_type = 'mid-term-may-june'
    AND start_date = '2026-05-25 09:00:00+03'::timestamptz
);

NOTIFY pgrst, 'reload schema';
