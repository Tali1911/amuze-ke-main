-- Add unique constraint for content_items to enable upsert functionality
-- This ensures each content type can only have one entry per slug

DO $$ 
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'content_items_slug_content_type_key'
  ) THEN
    -- Add unique constraint on slug + content_type combination
    ALTER TABLE content_items 
    ADD CONSTRAINT content_items_slug_content_type_key 
    UNIQUE (slug, content_type);
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_content_items_slug_type 
ON content_items(slug, content_type);
