-- Add activity_detail content type for hero slide detail pages
-- This allows marketers to create rich detail pages for each hero slide activity

-- First, check if the constraint exists and drop it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'content_items_content_type_check'
  ) THEN
    ALTER TABLE content_items DROP CONSTRAINT content_items_content_type_check;
  END IF;
END $$;

-- Add the new constraint with 'activity_detail' included
ALTER TABLE content_items 
ADD CONSTRAINT content_items_content_type_check 
CHECK (content_type IN (
  'page', 
  'post', 
  'announcement', 
  'campaign',
  'hero_slide',
  'program',
  'testimonial',
  'team_member',
  'about_section',
  'service_item',
  'site_settings',
  'camp_page',
  'camp_form',
  'little_forest',
  'program_form',
  'activity_detail'
));

-- Add comment to document the new content type usage
COMMENT ON TABLE content_items IS 'Stores all CMS content including pages, posts, hero slides, and activity detail pages. Use content_type to distinguish between different content types.';

-- Activity details will use:
-- - title: Activity name
-- - slug: URL-friendly identifier
-- - content: Rich text content (main description)
-- - content_type: 'activity_detail'
-- - status: 'draft' or 'published'
-- - metadata: JSON containing:
--   - featured_image: URL to main image
--   - gallery_images: Array of image URLs
--   - linked_hero_slide_id: Reference to hero slide
--   - meta_title: SEO title
--   - meta_description: SEO description
