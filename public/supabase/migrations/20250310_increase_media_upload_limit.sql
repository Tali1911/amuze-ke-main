-- Increase file size limit to 250MB for page-media bucket
UPDATE storage.buckets 
SET file_size_limit = 262144000  -- 250MB in bytes
WHERE id = 'page-media';
