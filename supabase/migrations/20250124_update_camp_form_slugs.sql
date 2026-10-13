-- Update existing camp form slugs to match what the code expects
-- This changes the slugs from *-camp-form to *-form format

-- Update Easter form slug
UPDATE content_items 
SET slug = 'easter-form' 
WHERE slug = 'easter-camp-form' AND content_type = 'camp_form';

-- Update Summer form slug
UPDATE content_items 
SET slug = 'summer-form' 
WHERE slug = 'summer-camp-form' AND content_type = 'camp_form';

-- Update End Year form slug
UPDATE content_items 
SET slug = 'end-year-form' 
WHERE slug = 'end-year-camp-form' AND content_type = 'camp_form';

-- Update Mid-Term form slug
UPDATE content_items 
SET slug = 'mid-term-form' 
WHERE slug = 'mid-term-camp-form' AND content_type = 'camp_form';
