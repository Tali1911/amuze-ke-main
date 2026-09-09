-- Fix unique constraints to allow same slug with different content_type
-- Remove old single-column constraint, keep composite constraint

-- Drop the old single-column unique constraint on slug
ALTER TABLE content_items 
DROP CONSTRAINT IF EXISTS content_items_slug_key;

-- Ensure the composite unique constraint exists (slug + content_type)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'content_items_slug_content_type_key'
  ) THEN
    ALTER TABLE content_items 
    ADD CONSTRAINT content_items_slug_content_type_key 
    UNIQUE (slug, content_type);
  END IF;
END $$;

-- Ensure index exists for performance
CREATE INDEX IF NOT EXISTS idx_content_items_slug_type 
ON content_items(slug, content_type);
