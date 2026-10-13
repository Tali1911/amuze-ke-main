-- Add missing holiday-camp-form configuration
-- This adds the holiday camp form config that was missing from the initial migration

INSERT INTO content_items (title, slug, content_type, status, content, metadata) VALUES
('Holiday Camp Form Config', 'holiday-camp-form', 'camp_form', 'published', 'Holiday camp registration form configuration', jsonb_build_object(
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
))
ON CONFLICT (slug) DO NOTHING;
