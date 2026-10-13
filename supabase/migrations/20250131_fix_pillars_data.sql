-- Fix the 7 pillars data structure
-- This ensures the pillars are correctly stored and queryable

-- First, delete old pillar entries
DELETE FROM public.content_items 
WHERE content_type = 'about_section' 
AND metadata->>'section_type' IN ('purpose', 'mission', 'vision', 'values');

-- Insert the correct 7 pillars with consistent section_type = 'pillar'
INSERT INTO public.content_items (title, slug, content, content_type, status, metadata) VALUES
(
  'Kenyan-Based',
  'kenyan-based',
  'Rooted in Kenya''s culture and environment, Amuse Kenya designs programs that celebrate local heritage, community, and nature while supporting Kenyan families and schools.',
  'about_section',
  'published',
  '{"section_type": "pillar", "icon": "Globe", "order": 1}'::jsonb
),
(
  'Nature',
  'nature',
  'Our experiences are grounded in the natural world, encouraging children to explore, play, and learn outdoors while developing a lifelong connection with nature.',
  'about_section',
  'published',
  '{"section_type": "pillar", "icon": "Leaf", "order": 2}'::jsonb
),
(
  'Holistic Skills',
  'holistic-skills',
  'We nurture the whole child by promoting emotional, social, physical, and creative growth through hands-on, experiential learning.',
  'about_section',
  'published',
  '{"section_type": "pillar", "icon": "Users", "order": 3}'::jsonb
),
(
  'Fun',
  'fun',
  'Every activity is designed to be engaging, joyful, and full of discovery, ensuring children learn through play and genuine enjoyment.',
  'about_section',
  'published',
  '{"section_type": "pillar", "icon": "Smile", "order": 4}'::jsonb
),
(
  'Inclusivity',
  'inclusivity',
  'We create welcoming spaces where every child, regardless of background or ability, can participate, belong, and thrive.',
  'about_section',
  'published',
  '{"section_type": "pillar", "icon": "Heart", "order": 5}'::jsonb
),
(
  'Child Centered Approach',
  'child-centered-approach',
  'Our programs are guided by children''s curiosity and imagination, allowing them to lead exploration and learn at their own pace.',
  'about_section',
  'published',
  '{"section_type": "pillar", "icon": "Target", "order": 6}'::jsonb
),
(
  'Environmental Approach',
  'environmental-approach',
  'We inspire environmental stewardship by helping children understand, respect, and care for the planet through direct interaction with their surroundings.',
  'about_section',
  'published',
  '{"section_type": "pillar", "icon": "CheckCircle", "order": 7}'::jsonb
);

-- Verify the pillars
SELECT title, content, metadata->>'section_type' as section_type, metadata->>'order' as order
FROM public.content_items 
WHERE content_type = 'about_section' 
AND metadata->>'section_type' = 'pillar'
ORDER BY (metadata->>'order')::int;
