-- Fix duplicate activity detail slugs and enforce uniqueness
-- This fixes the PGRST116 error where multiple rows are returned for the same slug

-- Step 1: Delete duplicate activity details, keeping only the most recently updated one
DELETE FROM content_items
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY slug ORDER BY updated_at DESC NULLS LAST, created_at DESC) as rn
    FROM content_items
    WHERE content_type = 'activity_detail'
  ) t
  WHERE rn > 1
);

-- Step 2: Create a unique index on slug for activity_detail content type
-- This prevents future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_detail_unique_slug 
ON content_items (slug) 
WHERE content_type = 'activity_detail';

-- Step 3: Add comment for documentation
COMMENT ON INDEX idx_activity_detail_unique_slug IS 
'Ensures each activity detail has a unique slug to prevent PGRST116 errors';
