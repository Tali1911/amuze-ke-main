-- Add 'program_form' to the allowed content types
-- This enables storing program form configurations in the CMS

-- Drop existing constraint
ALTER TABLE public.content_items 
DROP CONSTRAINT IF EXISTS content_items_content_type_check;

-- Add new constraint with 'program_form' included
ALTER TABLE public.content_items 
ADD CONSTRAINT content_items_content_type_check 
CHECK (content_type IN (
  'page', 'post', 'announcement', 'campaign', 
  'hero_slide', 'program', 'site_settings', 
  'testimonial', 'team_member', 'about_section', 'service_item',
  'camp_page', 'camp_form', 'program_form'
));
