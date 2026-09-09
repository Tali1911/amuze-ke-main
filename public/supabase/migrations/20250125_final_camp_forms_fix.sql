-- Final fix for camp forms - clean slate approach
-- This migration deletes all existing camp_form content and inserts all 6 forms with correct configurations

-- Step 1: Clean slate - remove all existing camp forms
DELETE FROM content_items WHERE content_type = 'camp_form';

-- Step 2: Insert all 6 camp forms with complete configurations

-- 1. Day Camps Form
INSERT INTO content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'Day Camps Form Config',
  'day-camps-form',
  'camp_form',
  'published',
  jsonb_build_object(
    'description', 'Registration form for Day Camps programs'
  ),
  jsonb_build_object(
    'formConfig', jsonb_build_object(
      'pricing', jsonb_build_object(
        'perSession', 2500,
        'currency', 'KES'
      ),
      'fields', jsonb_build_object(
        'parentName', jsonb_build_object('label', 'Parent/Guardian Name', 'required', true),
        'email', jsonb_build_object('label', 'Email Address', 'required', true),
        'phone', jsonb_build_object('label', 'Phone Number', 'required', true),
        'childName', jsonb_build_object('label', 'Child''s Name', 'required', true),
        'dateOfBirth', jsonb_build_object('label', 'Date of Birth', 'required', true),
        'ageRange', jsonb_build_object('label', 'Age Range', 'required', true),
        'sessions', jsonb_build_object('label', 'Select Sessions', 'required', true),
        'numberOfDays', jsonb_build_object('label', 'Number of Days', 'required', true),
        'totalPrice', jsonb_build_object('label', 'Total Amount', 'required', true),
        'specialNeeds', jsonb_build_object('label', 'Special Needs/Requirements', 'required', false),
        'emergencyContact', jsonb_build_object('label', 'Emergency Contact', 'required', true),
        'emergencyPhone', jsonb_build_object('label', 'Emergency Phone', 'required', true)
      ),
      'buttons', jsonb_build_object(
        'submit', 'Complete Registration',
        'addChild', 'Add Another Child'
      ),
      'messages', jsonb_build_object(
        'success', 'Registration submitted successfully! We will contact you shortly.',
        'error', 'There was an error submitting your registration. Please try again.'
      ),
      'specialNeedsSection', jsonb_build_object(
        'enabled', true,
        'title', 'Special Needs & Requirements',
        'description', 'Please let us know if your child has any special needs, allergies, or requirements we should be aware of.'
      ),
      'ageGroups', jsonb_build_array(
        jsonb_build_object('range', '3-5 years', 'description', 'Little Forest (Ages 3-5)'),
        jsonb_build_object('range', '6-8 years', 'description', 'Junior Explorers (Ages 6-8)'),
        jsonb_build_object('range', '9-12 years', 'description', 'Adventure Seekers (Ages 9-12)')
      )
    )
  )
)
ON CONFLICT (slug) DO UPDATE SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  updated_at = now();

-- 2. Holiday Camp Form
INSERT INTO content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'Holiday Camp Form Config',
  'holiday-form',
  'camp_form',
  'published',
  jsonb_build_object(
    'description', 'Registration form for Holiday Camps'
  ),
  jsonb_build_object(
    'formConfig', jsonb_build_object(
      'pricing', jsonb_build_object(
        'perDay', 2500,
        'currency', 'KES'
      ),
      'fields', jsonb_build_object(
        'parentName', jsonb_build_object('label', 'Parent/Guardian Name', 'required', true),
        'email', jsonb_build_object('label', 'Email Address', 'required', true),
        'phone', jsonb_build_object('label', 'Phone Number', 'required', true),
        'childName', jsonb_build_object('label', 'Child''s Name', 'required', true),
        'dateOfBirth', jsonb_build_object('label', 'Date of Birth', 'required', true),
        'ageRange', jsonb_build_object('label', 'Age Range', 'required', true),
        'sessions', jsonb_build_object('label', 'Select Days', 'required', true),
        'numberOfDays', jsonb_build_object('label', 'Number of Days', 'required', true),
        'totalPrice', jsonb_build_object('label', 'Total Amount', 'required', true),
        'specialNeeds', jsonb_build_object('label', 'Special Needs/Requirements', 'required', false),
        'emergencyContact', jsonb_build_object('label', 'Emergency Contact', 'required', true),
        'emergencyPhone', jsonb_build_object('label', 'Emergency Phone', 'required', true)
      ),
      'buttons', jsonb_build_object(
        'submit', 'Complete Registration',
        'addChild', 'Add Another Child'
      ),
      'messages', jsonb_build_object(
        'success', 'Registration submitted successfully! We will contact you shortly.',
        'error', 'There was an error submitting your registration. Please try again.'
      ),
      'specialNeedsSection', jsonb_build_object(
        'enabled', true,
        'title', 'Special Needs & Requirements',
        'description', 'Please let us know if your child has any special needs, allergies, or requirements we should be aware of.'
      )
    )
  )
)
ON CONFLICT (slug) DO UPDATE SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  updated_at = now();

-- 3. Easter Camp Form
INSERT INTO content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'Easter Camp Form Config',
  'easter-form',
  'camp_form',
  'published',
  jsonb_build_object(
    'description', 'Registration form for Easter Camp'
  ),
  jsonb_build_object(
    'formConfig', jsonb_build_object(
      'pricing', jsonb_build_object(
        'perDay', 2500,
        'currency', 'KES'
      ),
      'fields', jsonb_build_object(
        'parentName', jsonb_build_object('label', 'Parent/Guardian Name', 'required', true),
        'email', jsonb_build_object('label', 'Email Address', 'required', true),
        'phone', jsonb_build_object('label', 'Phone Number', 'required', true),
        'childName', jsonb_build_object('label', 'Child''s Name', 'required', true),
        'dateOfBirth', jsonb_build_object('label', 'Date of Birth', 'required', true),
        'ageRange', jsonb_build_object('label', 'Age Range', 'required', true),
        'sessions', jsonb_build_object('label', 'Select Days', 'required', true),
        'numberOfDays', jsonb_build_object('label', 'Number of Days', 'required', true),
        'totalPrice', jsonb_build_object('label', 'Total Amount', 'required', true),
        'specialNeeds', jsonb_build_object('label', 'Special Needs/Requirements', 'required', false),
        'emergencyContact', jsonb_build_object('label', 'Emergency Contact', 'required', true),
        'emergencyPhone', jsonb_build_object('label', 'Emergency Phone', 'required', true)
      ),
      'buttons', jsonb_build_object(
        'submit', 'Complete Registration',
        'addChild', 'Add Another Child'
      ),
      'messages', jsonb_build_object(
        'success', 'Registration submitted successfully! We will contact you shortly.',
        'error', 'There was an error submitting your registration. Please try again.'
      ),
      'specialNeedsSection', jsonb_build_object(
        'enabled', true,
        'title', 'Special Needs & Requirements',
        'description', 'Please let us know if your child has any special needs, allergies, or requirements we should be aware of.'
      )
    )
  )
)
ON CONFLICT (slug) DO UPDATE SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  updated_at = now();

-- 4. Summer Camp Form
INSERT INTO content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'Summer Camp Form Config',
  'summer-form',
  'camp_form',
  'published',
  jsonb_build_object(
    'description', 'Registration form for Summer Camp'
  ),
  jsonb_build_object(
    'formConfig', jsonb_build_object(
      'pricing', jsonb_build_object(
        'perDay', 2500,
        'currency', 'KES'
      ),
      'fields', jsonb_build_object(
        'parentName', jsonb_build_object('label', 'Parent/Guardian Name', 'required', true),
        'email', jsonb_build_object('label', 'Email Address', 'required', true),
        'phone', jsonb_build_object('label', 'Phone Number', 'required', true),
        'childName', jsonb_build_object('label', 'Child''s Name', 'required', true),
        'dateOfBirth', jsonb_build_object('label', 'Date of Birth', 'required', true),
        'ageRange', jsonb_build_object('label', 'Age Range', 'required', true),
        'sessions', jsonb_build_object('label', 'Select Days', 'required', true),
        'numberOfDays', jsonb_build_object('label', 'Number of Days', 'required', true),
        'totalPrice', jsonb_build_object('label', 'Total Amount', 'required', true),
        'specialNeeds', jsonb_build_object('label', 'Special Needs/Requirements', 'required', false),
        'emergencyContact', jsonb_build_object('label', 'Emergency Contact', 'required', true),
        'emergencyPhone', jsonb_build_object('label', 'Emergency Phone', 'required', true)
      ),
      'buttons', jsonb_build_object(
        'submit', 'Complete Registration',
        'addChild', 'Add Another Child'
      ),
      'messages', jsonb_build_object(
        'success', 'Registration submitted successfully! We will contact you shortly.',
        'error', 'There was an error submitting your registration. Please try again.'
      ),
      'specialNeedsSection', jsonb_build_object(
        'enabled', true,
        'title', 'Special Needs & Requirements',
        'description', 'Please let us know if your child has any special needs, allergies, or requirements we should be aware of.'
      )
    )
  )
)
ON CONFLICT (slug) DO UPDATE SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  updated_at = now();

-- 5. End Year Camp Form
INSERT INTO content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'End Year Camp Form Config',
  'end-year-form',
  'camp_form',
  'published',
  jsonb_build_object(
    'description', 'Registration form for End Year Camp'
  ),
  jsonb_build_object(
    'formConfig', jsonb_build_object(
      'pricing', jsonb_build_object(
        'perDay', 2500,
        'currency', 'KES'
      ),
      'fields', jsonb_build_object(
        'parentName', jsonb_build_object('label', 'Parent/Guardian Name', 'required', true),
        'email', jsonb_build_object('label', 'Email Address', 'required', true),
        'phone', jsonb_build_object('label', 'Phone Number', 'required', true),
        'childName', jsonb_build_object('label', 'Child''s Name', 'required', true),
        'dateOfBirth', jsonb_build_object('label', 'Date of Birth', 'required', true),
        'ageRange', jsonb_build_object('label', 'Age Range', 'required', true),
        'sessions', jsonb_build_object('label', 'Select Days', 'required', true),
        'numberOfDays', jsonb_build_object('label', 'Number of Days', 'required', true),
        'totalPrice', jsonb_build_object('label', 'Total Amount', 'required', true),
        'specialNeeds', jsonb_build_object('label', 'Special Needs/Requirements', 'required', false),
        'emergencyContact', jsonb_build_object('label', 'Emergency Contact', 'required', true),
        'emergencyPhone', jsonb_build_object('label', 'Emergency Phone', 'required', true)
      ),
      'buttons', jsonb_build_object(
        'submit', 'Complete Registration',
        'addChild', 'Add Another Child'
      ),
      'messages', jsonb_build_object(
        'success', 'Registration submitted successfully! We will contact you shortly.',
        'error', 'There was an error submitting your registration. Please try again.'
      ),
      'specialNeedsSection', jsonb_build_object(
        'enabled', true,
        'title', 'Special Needs & Requirements',
        'description', 'Please let us know if your child has any special needs, allergies, or requirements we should be aware of.'
      )
    )
  )
)
ON CONFLICT (slug) DO UPDATE SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  updated_at = now();

-- 6. Mid-Term Camp Form
INSERT INTO content_items (title, slug, content_type, status, content, metadata)
VALUES (
  'Mid-Term Camp Form Config',
  'mid-term-form',
  'camp_form',
  'published',
  jsonb_build_object(
    'description', 'Registration form for Mid-Term Camp'
  ),
  jsonb_build_object(
    'formConfig', jsonb_build_object(
      'pricing', jsonb_build_object(
        'perDay', 2500,
        'currency', 'KES'
      ),
      'fields', jsonb_build_object(
        'parentName', jsonb_build_object('label', 'Parent/Guardian Name', 'required', true),
        'email', jsonb_build_object('label', 'Email Address', 'required', true),
        'phone', jsonb_build_object('label', 'Phone Number', 'required', true),
        'childName', jsonb_build_object('label', 'Child''s Name', 'required', true),
        'dateOfBirth', jsonb_build_object('label', 'Date of Birth', 'required', true),
        'ageRange', jsonb_build_object('label', 'Age Range', 'required', true),
        'sessions', jsonb_build_object('label', 'Select Days', 'required', true),
        'numberOfDays', jsonb_build_object('label', 'Number of Days', 'required', true),
        'totalPrice', jsonb_build_object('label', 'Total Amount', 'required', true),
        'specialNeeds', jsonb_build_object('label', 'Special Needs/Requirements', 'required', false),
        'emergencyContact', jsonb_build_object('label', 'Emergency Contact', 'required', true),
        'emergencyPhone', jsonb_build_object('label', 'Emergency Phone', 'required', true)
      ),
      'buttons', jsonb_build_object(
        'submit', 'Complete Registration',
        'addChild', 'Add Another Child'
      ),
      'messages', jsonb_build_object(
        'success', 'Registration submitted successfully! We will contact you shortly.',
        'error', 'There was an error submitting your registration. Please try again.'
      ),
      'specialNeedsSection', jsonb_build_object(
        'enabled', true,
        'title', 'Special Needs & Requirements',
        'description', 'Please let us know if your child has any special needs, allergies, or requirements we should be aware of.'
      )
    )
  )
)
ON CONFLICT (slug) DO UPDATE SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  updated_at = now();
