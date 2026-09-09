-- Add 'experience_page' to the content_items content_type constraint

-- Drop existing constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'content_items_content_type_check'
  ) THEN
    ALTER TABLE content_items DROP CONSTRAINT content_items_content_type_check;
  END IF;
END $$;

-- Add constraint with 'experience_page' included
ALTER TABLE content_items 
ADD CONSTRAINT content_items_content_type_check 
CHECK (content_type IN (
  'page', 'post', 'announcement', 'campaign', 'hero_slide',
  'program', 'testimonial', 'team_member', 'about_section',
  'service_item', 'site_settings', 'camp_page', 'camp_form',
  'little_forest', 'program_form', 'activity_detail', 'experience_page'
));
