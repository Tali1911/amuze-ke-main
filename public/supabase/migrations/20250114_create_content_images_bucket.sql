-- Create content-images bucket for team member photos, announcements, etc.
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- IMPORTANT: Storage Bucket Policies Setup Required
-- ============================================================================
-- After running this migration, configure policies in Supabase Dashboard:
--
-- 1. Go to Storage > content-images bucket > Policies tab
-- 2. Create the following policies:
--
-- Policy 1: "Public can view content images"
--    - Operation: SELECT
--    - Target roles: public
--    - Policy definition: bucket_id = 'content-images'
--
-- Policy 2: "Authenticated users can upload"
--    - Operation: INSERT
--    - Target roles: authenticated
--    - Policy definition: bucket_id = 'content-images'
--
-- Policy 3: "Authenticated users can update"
--    - Operation: UPDATE
--    - Target roles: authenticated
--    - Policy definition: bucket_id = 'content-images'
--
-- Policy 4: "Authenticated users can delete"
--    - Operation: DELETE
--    - Target roles: authenticated
--    - Policy definition: bucket_id = 'content-images'
-- ============================================================================
