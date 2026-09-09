-- Fix camp forms to match the expected structure
-- This migration updates all camp forms with the correct configuration structure

-- Delete all existing camp forms to start fresh
DELETE FROM content_items WHERE content_type = 'camp_form';

-- Base configuration structure that matches the TypeScript interface
-- pricing: { halfDayRate, fullDayRate, currency }
-- fields: { parentName, childName, dateOfBirth, ageRange, numberOfDays, sessionType, specialNeeds, emergencyContact, email, phone }
-- buttons: { registerOnly, registerAndPay, addChild, removeChild }
-- messages: { registrationSuccess, registrationError, chooseOption, paymentComingSoon }
-- specialNeedsSection: { title, description }

-- 1. Easter Camp Form
INSERT INTO content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'Easter Camp Form Config',
  'easter-form',
  'camp_form',
  'published',
  jsonb_build_object('description', 'Registration form for Easter Camp'),
  jsonb_build_object(
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
  )
);

-- 2. Summer Camp Form
INSERT INTO content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'Summer Camp Form Config',
  'summer-form',
  'camp_form',
  'published',
  jsonb_build_object('description', 'Registration form for Summer Camp'),
  jsonb_build_object(
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
  )
);

-- 3. End Year Camp Form
INSERT INTO content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'End Year Camp Form Config',
  'end-year-form',
  'camp_form',
  'published',
  jsonb_build_object('description', 'Registration form for End Year Camp'),
  jsonb_build_object(
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
  )
);

-- 4. Mid-Term Camp Form
INSERT INTO content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'Mid-Term Camp Form Config',
  'mid-term-form',
  'camp_form',
  'published',
  jsonb_build_object('description', 'Registration form for Mid-Term Camp'),
  jsonb_build_object(
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
  )
);

-- 5. Holiday Camp Form
INSERT INTO content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'Holiday Camp Form Config',
  'holiday-form',
  'camp_form',
  'published',
  jsonb_build_object('description', 'Registration form for Holiday Camps'),
  jsonb_build_object(
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
        'numberOfDays', jsonb_build_object('label', 'Number of Days', 'placeholder', 'Enter number of days (1-60)', 'helpText', 'Enter how many days you want to register for'),
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
  )
);

-- 6. Day Camps Form (with ageGroups)
INSERT INTO content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'Day Camps Form Config',
  'day-camps-form',
  'camp_form',
  'published',
  jsonb_build_object('description', 'Registration form for Day Camps programs'),
  jsonb_build_object(
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
  )
);
