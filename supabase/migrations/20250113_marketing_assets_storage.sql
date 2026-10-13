-- Create marketing-assets storage bucket for image uploads
-- Run this migration in Supabase SQL Editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-assets', 'marketing-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- IMPORTANT: Storage Bucket Policies Setup Required
-- ============================================================================
-- After running this migration, you need to configure the bucket policies
-- in the Supabase Dashboard:
--
-- 1. Go to Storage > marketing-assets bucket > Policies tab
-- 2. Create the following policies:
--
-- Policy 1: "Public can view marketing assets"
--    - Operation: SELECT
--    - Target roles: public
--    - Policy definition: bucket_id = 'marketing-assets'
--
-- Policy 2: "Authenticated users can upload"
--    - Operation: INSERT
--    - Target roles: authenticated
--    - Policy definition: bucket_id = 'marketing-assets'
--
-- Policy 3: "Authenticated users can update"
--    - Operation: UPDATE
--    - Target roles: authenticated
--    - Policy definition: bucket_id = 'marketing-assets'
--
-- Policy 4: "Authenticated users can delete"
--    - Operation: DELETE
--    - Target roles: authenticated
--    - Policy definition: bucket_id = 'marketing-assets'
--
-- Note: You can make these policies more restrictive using has_role() checks
-- if needed, but for now allowing all authenticated users is sufficient.
-- ============================================================================
