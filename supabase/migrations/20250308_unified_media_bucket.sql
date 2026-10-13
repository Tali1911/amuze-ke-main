-- Create unified page-media storage bucket for photos and videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'page-media',
  'page-media',
  true,
  104857600, -- 100MB max for videos
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies for the page-media bucket
CREATE POLICY "Anyone can view page-media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'page-media');

CREATE POLICY "Authenticated users can upload page-media files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'page-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update page-media files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'page-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete page-media files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'page-media' 
  AND auth.role() = 'authenticated'
);
