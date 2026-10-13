-- Extend content_items table to support new content types
-- Run this migration in Supabase SQL Editor

-- Drop existing constraint
ALTER TABLE public.content_items 
DROP CONSTRAINT IF EXISTS content_items_content_type_check;

-- Add new constraint with extended types
ALTER TABLE public.content_items 
ADD CONSTRAINT content_items_content_type_check 
CHECK (content_type IN (
  'page', 'post', 'announcement', 'campaign', 
  'hero_slide', 'program', 'site_settings', 
  'testimonial', 'team_member', 'about_section', 'service_item'
));

-- Verify the change
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.content_items'::regclass 
AND conname = 'content_items_content_type_check';
