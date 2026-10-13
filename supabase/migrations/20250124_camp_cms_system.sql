-- Extend content_items table to support camp pages and forms
-- This migration adds camp_page and camp_form content types

-- First, check if the constraint exists and drop it if it does
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'content_items_content_type_check'
  ) THEN
    ALTER TABLE content_items DROP CONSTRAINT content_items_content_type_check;
  END IF;
END $$;

-- Add the new constraint with camp_page and camp_form types
ALTER TABLE content_items 
ADD CONSTRAINT content_items_content_type_check 
CHECK (content_type IN (
  'hero_slide', 
  'program', 
  'announcement', 
  'site_settings', 
  'testimonial', 
  'team_member', 
  'about_section', 
  'service_item',
  'camp_page',
  'camp_form'
));

-- Create index for faster camp content queries
CREATE INDEX IF NOT EXISTS idx_content_items_camp_type 
ON content_items(content_type, slug) 
WHERE content_type IN ('camp_page', 'camp_form');

-- Insert default camp page configurations
INSERT INTO content_items (title, slug, content_type, status, content, metadata) VALUES
-- Easter Camp Page
('Easter Camp Page', 'easter-camp-page', 'camp_page', 'published', 'Experience an egg-citing Easter adventure!', jsonb_build_object(
  'campType', 'easter',
  'pageConfig', jsonb_build_object(
    'title', 'Easter Camp',
    'description', 'Experience an egg-citing Easter adventure filled with nature exploration, creative activities, and outdoor fun! Our Easter Camp combines traditional holiday festivities with hands-on environmental education.',
    'heroImage', '/src/assets/camping.jpg',
    'duration', '5 Days',
    'ageGroup', '4-12 years',
    'location', 'Amuse Nature Experience Center',
    'time', '8:00 AM - 5:00 PM',
    'highlights', jsonb_build_array(
      'Easter egg hunts in nature',
      'Wildlife exploration and bird watching',
      'Creative arts and crafts',
      'Outdoor games and team challenges',
      'Nature scavenger hunts',
      'Storytelling under the trees'
    )
  )
)),

-- Summer Camp Page
('Summer Camp Page', 'summer-camp-page', 'camp_page', 'published', 'Dive into an unforgettable summer adventure!', jsonb_build_object(
  'campType', 'summer',
  'pageConfig', jsonb_build_object(
    'title', 'Summer Camp',
    'description', 'Dive into an unforgettable summer adventure! Our Summer Camp offers the perfect blend of outdoor exploration, creative learning, and endless fun in a safe, nurturing environment.',
    'heroImage', '/src/assets/camping.jpg',
    'duration', '4-8 Weeks',
    'ageGroup', '4-12 years',
    'location', 'Amuse Nature Experience Center',
    'time', '8:00 AM - 5:00 PM',
    'highlights', jsonb_build_array(
      'Swimming and water activities',
      'Nature trails and camping skills',
      'Sports and team building',
      'Arts, crafts, and music',
      'Science experiments and discovery',
      'Field trips and adventure outings'
    )
  )
)),

-- End Year Camp Page
('End Year Camp Page', 'end-year-camp-page', 'camp_page', 'published', 'Celebrate the year with adventure!', jsonb_build_object(
  'campType', 'end-year',
  'pageConfig', jsonb_build_object(
    'title', 'End Year Camp',
    'description', 'Celebrate the end of the year with an unforgettable outdoor adventure! Our End Year Camp is the perfect way to close out the year with fun, learning, and new friendships.',
    'heroImage', '/src/assets/camping.jpg',
    'duration', '5 Days',
    'ageGroup', '4-12 years',
    'location', 'Amuse Nature Experience Center',
    'time', '8:00 AM - 5:00 PM',
    'highlights', jsonb_build_array(
      'Year-end celebration activities',
      'Outdoor adventures and exploration',
      'Team building and group games',
      'Creative workshops',
      'Nature discovery walks',
      'Campfire stories and songs'
    )
  )
)),

-- Day Camps Page
('Day Camps Page', 'day-camps-page', 'camp_page', 'published', 'Daily nature adventures for curious minds!', jsonb_build_object(
  'campType', 'day-camps',
  'pageConfig', jsonb_build_object(
    'title', 'Day Camps',
    'description', 'Join us for exciting daily adventures in nature! Our Day Camps offer flexible scheduling with engaging activities that connect children with the natural world through play, exploration, and hands-on learning.',
    'heroImage', '/src/assets/daily-activities.jpg',
    'duration', 'Flexible (1-60 days)',
    'ageGroup', '4-12 years',
    'location', 'Multiple Locations',
    'time', 'Half Day (8AM-12PM) or Full Day (8AM-5PM)',
    'highlights', jsonb_build_array(
      'Flexible scheduling options',
      'Age-appropriate activities',
      'Nature exploration and learning',
      'Indoor and outdoor play',
      'Creative arts and crafts',
      'Healthy snacks and meals'
    )
  )
)),

-- Mid-term camps (Feb/March, May/June, October)
('Mid-Term Camp Page - Feb/March', 'mid-term-feb-march-page', 'camp_page', 'published', 'Mid-term adventure awaits!', jsonb_build_object(
  'campType', 'mid-term-feb-march',
  'pageConfig', jsonb_build_object(
    'title', 'Mid-Term Camp - Feb/March',
    'description', 'Make the most of your mid-term break with outdoor adventures and nature exploration!',
    'heroImage', '/src/assets/camping.jpg',
    'duration', '5 Days',
    'ageGroup', '4-12 years',
    'location', 'Amuse Nature Experience Center',
    'time', '8:00 AM - 5:00 PM',
    'highlights', jsonb_build_array(
      'Outdoor exploration',
      'Team building activities',
      'Creative workshops',
      'Nature walks',
      'Group games',
      'Environmental education'
    )
  )
)),

('Mid-Term Camp Page - May/June', 'mid-term-may-june-page', 'camp_page', 'published', 'Mid-term adventure awaits!', jsonb_build_object(
  'campType', 'mid-term-may-june',
  'pageConfig', jsonb_build_object(
    'title', 'Mid-Term Camp - May/June',
    'description', 'Make the most of your mid-term break with outdoor adventures and nature exploration!',
    'heroImage', '/src/assets/camping.jpg',
    'duration', '5 Days',
    'ageGroup', '4-12 years',
    'location', 'Amuse Nature Experience Center',
    'time', '8:00 AM - 5:00 PM',
    'highlights', jsonb_build_array(
      'Outdoor exploration',
      'Team building activities',
      'Creative workshops',
      'Nature walks',
      'Group games',
      'Environmental education'
    )
  )
)),

('Mid-Term Camp Page - October', 'mid-term-october-page', 'camp_page', 'published', 'Mid-term adventure awaits!', jsonb_build_object(
  'campType', 'mid-term-october',
  'pageConfig', jsonb_build_object(
    'title', 'Mid-Term Camp - October',
    'description', 'Make the most of your mid-term break with outdoor adventures and nature exploration!',
    'heroImage', '/src/assets/camping.jpg',
    'duration', '5 Days',
    'ageGroup', '4-12 years',
    'location', 'Amuse Nature Experience Center',
    'time', '8:00 AM - 5:00 PM',
    'highlights', jsonb_build_array(
      'Outdoor exploration',
      'Team building activities',
      'Creative workshops',
      'Nature walks',
      'Group games',
      'Environmental education'
    )
  )
))
ON CONFLICT (slug) DO NOTHING;

-- Insert default camp form configurations
INSERT INTO content_items (title, slug, content_type, status, content, metadata) VALUES
-- Easter Camp Form Config
('Easter Camp Form Config', 'easter-form', 'camp_form', 'published', 'Easter camp registration form configuration', jsonb_build_object(
  'formConfig', jsonb_build_object(
    'pricing', jsonb_build_object(
      'halfDayRate', 1500,
      'fullDayRate', 2500,
      'currency', 'KES'
    ),
    'fields', jsonb_build_object(
      'parentName', jsonb_build_object('label', 'Parent/Guardian Name', 'placeholder', 'Enter your full name', 'required', true),
      'childName', jsonb_build_object('label', 'Child''s Full Name', 'placeholder', 'Enter child''s full name', 'required', true),
      'dateOfBirth', jsonb_build_object('label', 'Date of Birth', 'placeholder', 'Select date', 'required', true),
      'ageRange', jsonb_build_object('label', 'Age Range', 'placeholder', 'Select age range', 'required', true),
      'numberOfDays', jsonb_build_object('label', 'Number of Days', 'placeholder', 'Enter number of days', 'helpText', 'Enter how many days you want to register for'),
      'sessionType', jsonb_build_object('label', 'Session Type', 'halfDayLabel', 'Half Day (8AM-12PM)', 'fullDayLabel', 'Full Day (8AM-5PM)'),
      'specialNeeds', jsonb_build_object('label', 'Special Needs/Medical Information', 'placeholder', 'Please describe any special needs, allergies, or medical conditions'),
      'emergencyContact', jsonb_build_object('label', 'Emergency Contact Name', 'placeholder', 'Enter emergency contact name', 'required', true),
      'email', jsonb_build_object('label', 'Email Address', 'placeholder', 'your.email@example.com', 'required', true),
      'phone', jsonb_build_object('label', 'Phone Number', 'placeholder', '+254 XXX XXX XXX', 'required', true)
    ),
    'buttons', jsonb_build_object(
      'registerOnly', 'Register Only',
      'registerAndPay', 'Register & Pay Now',
      'addChild', 'Add Another Child',
      'removeChild', 'Remove'
    ),
    'messages', jsonb_build_object(
      'registrationSuccess', 'Registration submitted successfully! We''ll contact you shortly.',
      'registrationError', 'Failed to submit registration. Please try again.',
      'chooseOption', 'Choose your registration option:',
      'paymentComingSoon', 'Payment integration coming soon. Both options will complete your registration.'
    ),
    'specialNeedsSection', jsonb_build_object(
      'title', 'Special Needs & Medical Information',
      'description', 'Please provide any information about allergies, medical conditions, or special accommodations needed.'
    )
  )
)),

-- Summer Camp Form Config
('Summer Camp Form Config', 'summer-form', 'camp_form', 'published', 'Summer camp registration form configuration', jsonb_build_object(
  'formConfig', jsonb_build_object(
    'pricing', jsonb_build_object(
      'halfDayRate', 1500,
      'fullDayRate', 2500,
      'currency', 'KES'
    ),
    'fields', jsonb_build_object(
      'parentName', jsonb_build_object('label', 'Parent/Guardian Name', 'placeholder', 'Enter your full name', 'required', true),
      'childName', jsonb_build_object('label', 'Child''s Full Name', 'placeholder', 'Enter child''s full name', 'required', true),
      'dateOfBirth', jsonb_build_object('label', 'Date of Birth', 'placeholder', 'Select date', 'required', true),
      'ageRange', jsonb_build_object('label', 'Age Range', 'placeholder', 'Select age range', 'required', true),
      'numberOfDays', jsonb_build_object('label', 'Number of Days', 'placeholder', 'Enter number of days', 'helpText', 'Enter how many days you want to register for'),
      'sessionType', jsonb_build_object('label', 'Session Type', 'halfDayLabel', 'Half Day (8AM-12PM)', 'fullDayLabel', 'Full Day (8AM-5PM)'),
      'specialNeeds', jsonb_build_object('label', 'Special Needs/Medical Information', 'placeholder', 'Please describe any special needs, allergies, or medical conditions'),
      'emergencyContact', jsonb_build_object('label', 'Emergency Contact Name', 'placeholder', 'Enter emergency contact name', 'required', true),
      'email', jsonb_build_object('label', 'Email Address', 'placeholder', 'your.email@example.com', 'required', true),
      'phone', jsonb_build_object('label', 'Phone Number', 'placeholder', '+254 XXX XXX XXX', 'required', true)
    ),
    'buttons', jsonb_build_object(
      'registerOnly', 'Register Only',
      'registerAndPay', 'Register & Pay Now',
      'addChild', 'Add Another Child',
      'removeChild', 'Remove'
    ),
    'messages', jsonb_build_object(
      'registrationSuccess', 'Registration submitted successfully! We''ll contact you shortly.',
      'registrationError', 'Failed to submit registration. Please try again.',
      'chooseOption', 'Choose your registration option:',
      'paymentComingSoon', 'Payment integration coming soon. Both options will complete your registration.'
    ),
    'specialNeedsSection', jsonb_build_object(
      'title', 'Special Needs & Medical Information',
      'description', 'Please provide any information about allergies, medical conditions, or special accommodations needed.'
    )
  )
)),

-- End Year Camp Form Config
('End Year Camp Form Config', 'end-year-form', 'camp_form', 'published', 'End year camp registration form configuration', jsonb_build_object(
  'formConfig', jsonb_build_object(
    'pricing', jsonb_build_object(
      'halfDayRate', 1500,
      'fullDayRate', 2500,
      'currency', 'KES'
    ),
    'fields', jsonb_build_object(
      'parentName', jsonb_build_object('label', 'Parent/Guardian Name', 'placeholder', 'Enter your full name', 'required', true),
      'childName', jsonb_build_object('label', 'Child''s Full Name', 'placeholder', 'Enter child''s full name', 'required', true),
      'dateOfBirth', jsonb_build_object('label', 'Date of Birth', 'placeholder', 'Select date', 'required', true),
      'ageRange', jsonb_build_object('label', 'Age Range', 'placeholder', 'Select age range', 'required', true),
      'numberOfDays', jsonb_build_object('label', 'Number of Days', 'placeholder', 'Enter number of days', 'helpText', 'Enter how many days you want to register for'),
      'sessionType', jsonb_build_object('label', 'Session Type', 'halfDayLabel', 'Half Day (8AM-12PM)', 'fullDayLabel', 'Full Day (8AM-5PM)'),
      'specialNeeds', jsonb_build_object('label', 'Special Needs/Medical Information', 'placeholder', 'Please describe any special needs, allergies, or medical conditions'),
      'emergencyContact', jsonb_build_object('label', 'Emergency Contact Name', 'placeholder', 'Enter emergency contact name', 'required', true),
      'email', jsonb_build_object('label', 'Email Address', 'placeholder', 'your.email@example.com', 'required', true),
      'phone', jsonb_build_object('label', 'Phone Number', 'placeholder', '+254 XXX XXX XXX', 'required', true)
    ),
    'buttons', jsonb_build_object(
      'registerOnly', 'Register Only',
      'registerAndPay', 'Register & Pay Now',
      'addChild', 'Add Another Child',
      'removeChild', 'Remove'
    ),
    'messages', jsonb_build_object(
      'registrationSuccess', 'Registration submitted successfully! We''ll contact you shortly.',
      'registrationError', 'Failed to submit registration. Please try again.',
      'chooseOption', 'Choose your registration option:',
      'paymentComingSoon', 'Payment integration coming soon. Both options will complete your registration.'
    ),
    'specialNeedsSection', jsonb_build_object(
      'title', 'Special Needs & Medical Information',
      'description', 'Please provide any information about allergies, medical conditions, or special accommodations needed.'
    )
  )
)),

-- Mid-Term Camp Form Config
('Mid-Term Camp Form Config', 'mid-term-form', 'camp_form', 'published', 'Mid-term camp registration form configuration', jsonb_build_object(
  'formConfig', jsonb_build_object(
    'pricing', jsonb_build_object(
      'halfDayRate', 1500,
      'fullDayRate', 2500,
      'currency', 'KES'
    ),
    'fields', jsonb_build_object(
      'parentName', jsonb_build_object('label', 'Parent/Guardian Name', 'placeholder', 'Enter your full name', 'required', true),
      'childName', jsonb_build_object('label', 'Child''s Full Name', 'placeholder', 'Enter child''s full name', 'required', true),
      'dateOfBirth', jsonb_build_object('label', 'Date of Birth', 'placeholder', 'Select date', 'required', true),
      'ageRange', jsonb_build_object('label', 'Age Range', 'placeholder', 'Select age range', 'required', true),
      'numberOfDays', jsonb_build_object('label', 'Number of Days', 'placeholder', 'Enter number of days', 'helpText', 'Enter how many days you want to register for'),
      'sessionType', jsonb_build_object('label', 'Session Type', 'halfDayLabel', 'Half Day (8AM-12PM)', 'fullDayLabel', 'Full Day (8AM-5PM)'),
      'specialNeeds', jsonb_build_object('label', 'Special Needs/Medical Information', 'placeholder', 'Please describe any special needs, allergies, or medical conditions'),
      'emergencyContact', jsonb_build_object('label', 'Emergency Contact Name', 'placeholder', 'Enter emergency contact name', 'required', true),
      'email', jsonb_build_object('label', 'Email Address', 'placeholder', 'your.email@example.com', 'required', true),
      'phone', jsonb_build_object('label', 'Phone Number', 'placeholder', '+254 XXX XXX XXX', 'required', true)
    ),
    'buttons', jsonb_build_object(
      'registerOnly', 'Register Only',
      'registerAndPay', 'Register & Pay Now',
      'addChild', 'Add Another Child',
      'removeChild', 'Remove'
    ),
    'messages', jsonb_build_object(
      'registrationSuccess', 'Registration submitted successfully! We''ll contact you shortly.',
      'registrationError', 'Failed to submit registration. Please try again.',
      'chooseOption', 'Choose your registration option:',
      'paymentComingSoon', 'Payment integration coming soon. Both options will complete your registration.'
    ),
    'specialNeedsSection', jsonb_build_object(
      'title', 'Special Needs & Medical Information',
      'description', 'Please provide any information about allergies, medical conditions, or special accommodations needed.'
    )
  )
)),

-- Day Camps Form Config
('Day Camps Form Config', 'day-camps-form', 'camp_form', 'published', 'Day camps registration form configuration', jsonb_build_object(
  'formConfig', jsonb_build_object(
    'pricing', jsonb_build_object(
      'halfDayRate', 1500,
      'fullDayRate', 2500,
      'currency', 'KES'
    ),
    'fields', jsonb_build_object(
      'parentName', jsonb_build_object('label', 'Parent/Guardian Name', 'placeholder', 'Enter your full name', 'required', true),
      'childName', jsonb_build_object('label', 'Child''s Full Name', 'placeholder', 'Enter child''s full name', 'required', true),
      'dateOfBirth', jsonb_build_object('label', 'Date of Birth', 'placeholder', 'Select date', 'required', true),
      'ageRange', jsonb_build_object('label', 'Age Range', 'placeholder', 'Select age range', 'required', true),
      'numberOfDays', jsonb_build_object('label', 'Number of Days', 'placeholder', 'Enter number of days (1-60)', 'helpText', 'Choose how many days you want to attend'),
      'sessionType', jsonb_build_object('label', 'Session Type', 'halfDayLabel', 'Half Day (8AM-12PM)', 'fullDayLabel', 'Full Day (8AM-5PM)'),
      'specialNeeds', jsonb_build_object('label', 'Special Needs/Medical Information', 'placeholder', 'Please describe any special needs, allergies, or medical conditions'),
      'emergencyContact', jsonb_build_object('label', 'Emergency Contact Name', 'placeholder', 'Enter emergency contact name', 'required', true),
      'email', jsonb_build_object('label', 'Email Address', 'placeholder', 'your.email@example.com', 'required', true),
      'phone', jsonb_build_object('label', 'Phone Number', 'placeholder', '+254 XXX XXX XXX', 'required', true)
    ),
    'buttons', jsonb_build_object(
      'registerOnly', 'Register Only',
      'registerAndPay', 'Register & Pay Now',
      'addChild', 'Add Another Child',
      'removeChild', 'Remove'
    ),
    'messages', jsonb_build_object(
      'registrationSuccess', 'Registration submitted successfully! We''ll contact you shortly.',
      'registrationError', 'Failed to submit registration. Please try again.',
      'chooseOption', 'Choose your registration option:',
      'paymentComingSoon', 'Payment integration coming soon. Both options will complete your registration.'
    ),
    'specialNeedsSection', jsonb_build_object(
      'title', 'Special Needs & Medical Information',
      'description', 'Please provide any information about allergies, medical conditions, or special accommodations needed.'
    ),
    'ageGroups', jsonb_build_array(
      jsonb_build_object(
        'age', '4-5 years',
        'locations', 'Amuse Farm, Lavington Green',
        'schedule', 'Half Day & Full Day options',
        'skills', 'Basic motor skills, social interaction, nature introduction',
        'color', 'bg-green-50'
      ),
      jsonb_build_object(
        'age', '6-8 years',
        'locations', 'Amuse Farm, Lavington Green, Ridgeways',
        'schedule', 'Half Day & Full Day options',
        'skills', 'Environmental awareness, team building, outdoor exploration',
        'color', 'bg-blue-50'
      ),
      jsonb_build_object(
        'age', '9-12 years',
        'locations', 'All locations',
        'schedule', 'Half Day & Full Day options',
        'skills', 'Advanced nature studies, leadership, conservation projects',
        'color', 'bg-purple-50'
      )
    )
  )
))
ON CONFLICT (slug) DO NOTHING;

COMMENT ON COLUMN content_items.metadata IS 'Stores camp page configuration (pageConfig) and form configuration (formConfig) as JSONB';
