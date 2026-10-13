-- Rename "School Adventure" to "School Adventures" across all content_items

-- Update program_form entries
UPDATE public.content_items
SET 
  title = REPLACE(title, 'School Adventure', 'School Adventures'),
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{formConfig,programInfo,title}',
    '"School Adventures"'
  ),
  updated_at = NOW()
WHERE content_type = 'program_form'
AND (
  title ILIKE '%School Adventure%'
  OR metadata->>'formConfig' ILIKE '%School Adventure%'
);

-- Update program entries
UPDATE public.content_items
SET 
  title = REPLACE(title, 'School Adventure', 'School Adventures'),
  updated_at = NOW()
WHERE content_type = 'program'
AND title ILIKE '%School Adventure%'
AND title NOT LIKE '%School Adventures%';

-- Update service_item entries
UPDATE public.content_items
SET 
  title = REPLACE(title, 'School Adventure', 'School Adventures'),
  updated_at = NOW()
WHERE content_type = 'service_item'
AND title ILIKE '%School Adventure%'
AND title NOT LIKE '%School Adventures%';

-- Update any metadata titles
UPDATE public.content_items
SET 
  metadata = jsonb_set(
    metadata,
    '{title}',
    '"School Adventures"'
  ),
  updated_at = NOW()
WHERE metadata->>'title' ILIKE '%School Adventure%'
AND metadata->>'title' NOT LIKE '%School Adventures%';

-- Update navigation_settings if any
UPDATE public.navigation_settings
SET 
  value = REPLACE(value::text, 'School Adventure', 'School Adventures')::jsonb,
  updated_at = NOW()
WHERE value::text ILIKE '%School Adventure%'
AND value::text NOT LIKE '%School Adventures%';
