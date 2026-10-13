-- Final fix for activity detail pages
-- This ensures slugs are properly unique and no conflicts exist

-- Step 1: Identify and log any slug conflicts between content types
DO $$ 
DECLARE
  conflict_record RECORD;
BEGIN
  FOR conflict_record IN 
    SELECT slug, array_agg(DISTINCT content_type) as types, COUNT(*) as count
    FROM content_items
    WHERE slug IN (
      SELECT slug FROM content_items WHERE content_type = 'activity_detail'
    )
    GROUP BY slug
    HAVING COUNT(DISTINCT content_type) > 1
  LOOP
    RAISE NOTICE 'Slug conflict found: % used by content types: %', conflict_record.slug, conflict_record.types;
  END LOOP;
END $$;

-- Step 2: For any activity_detail that shares a slug with another content type,
-- append '-activity' to make it unique
UPDATE content_items
SET slug = slug || '-activity'
WHERE content_type = 'activity_detail'
  AND slug IN (
    SELECT slug 
    FROM content_items 
    WHERE content_type != 'activity_detail'
  );

-- Step 3: Remove any remaining duplicate activity_detail entries
DELETE FROM content_items
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY slug, content_type ORDER BY updated_at DESC NULLS LAST, created_at DESC) as rn
    FROM content_items
    WHERE content_type = 'activity_detail'
  ) t
  WHERE rn > 1
);

-- Step 4: Drop the old partial unique index if it exists
DROP INDEX IF EXISTS idx_activity_detail_unique_slug;

-- Step 5: Create a proper unique constraint for activity_detail slugs
-- This allows other content types to use the same slug, but activity_detail slugs must be unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_detail_unique_slug 
ON content_items (slug) 
WHERE content_type = 'activity_detail' AND status != 'archived';

-- Step 6: Add helpful comment
COMMENT ON INDEX idx_activity_detail_unique_slug IS 
'Ensures each non-archived activity detail has a unique slug. Other content types can reuse slugs.';

-- Step 7: Log current activity_detail records for verification
DO $$ 
DECLARE
  activity_record RECORD;
BEGIN
  RAISE NOTICE '=== Current Activity Detail Pages ===';
  FOR activity_record IN 
    SELECT id, title, slug, status, created_at
    FROM content_items
    WHERE content_type = 'activity_detail'
    ORDER BY created_at DESC
  LOOP
    RAISE NOTICE 'Activity: % | Slug: % | Status: % | Created: %', 
      activity_record.title, activity_record.slug, activity_record.status, activity_record.created_at;
  END LOOP;
END $$;
