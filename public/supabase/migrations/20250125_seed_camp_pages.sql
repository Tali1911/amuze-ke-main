-- Seed initial camp page configurations
-- This ensures all camp pages have default data in the database

-- Easter Camp Page
INSERT INTO content_items (
  slug,
  title,
  content_type,
  status,
  content,
  metadata,
  published_at
) VALUES (
  'easter-page',
  'Easter Camp Page',
  'camp_page',
  'published',
  '{"title":"Easter Camp","description":"Experience an egg-citing Easter adventure filled with nature exploration, creative activities, and outdoor fun!","heroImage":"/src/assets/camping.jpg","duration":"5 Days","ageGroup":"4-12 years","location":"Amuse Nature Experience Center","time":"8:00 AM - 5:00 PM","highlights":["Easter egg hunts in nature","Wildlife exploration and bird watching","Creative arts and crafts","Outdoor games and team challenges","Nature scavenger hunts"]}',
  jsonb_build_object(
    'pageConfig', jsonb_build_object(
      'title', 'Easter Camp',
      'description', 'Experience an egg-citing Easter adventure filled with nature exploration, creative activities, and outdoor fun!',
      'heroImage', '/src/assets/camping.jpg',
      'duration', '5 Days',
      'ageGroup', '4-12 years',
      'location', 'Amuse Nature Experience Center',
      'time', '8:00 AM - 5:00 PM',
      'highlights', jsonb_build_array(
        'Easter egg hunts in nature',
        'Wildlife exploration and bird watching',
        'Creative arts and crafts',
        'Outdoor games and team challenges',
        'Nature scavenger hunts'
      )
    )
  ),
  NOW()
)
ON CONFLICT (slug, content_type) 
DO UPDATE SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Summer Camp Page
INSERT INTO content_items (
  slug,
  title,
  content_type,
  status,
  content,
  metadata,
  published_at
) VALUES (
  'summer-page',
  'Summer Camp Page',
  'camp_page',
  'published',
  '{"title":"Summer Camp","description":"Dive into an unforgettable summer filled with outdoor adventures, new friendships, and endless fun under the sun!","heroImage":"/src/assets/camping.jpg","duration":"6 Weeks","ageGroup":"5-14 years","location":"Amuse Nature Experience Center","time":"8:00 AM - 5:00 PM","highlights":["Swimming and water activities","Nature hikes and camping skills","Sports and team building","Arts, crafts, and creative projects","Wildlife encounters and conservation lessons"]}',
  jsonb_build_object(
    'pageConfig', jsonb_build_object(
      'title', 'Summer Camp',
      'description', 'Dive into an unforgettable summer filled with outdoor adventures, new friendships, and endless fun under the sun!',
      'heroImage', '/src/assets/camping.jpg',
      'duration', '6 Weeks',
      'ageGroup', '5-14 years',
      'location', 'Amuse Nature Experience Center',
      'time', '8:00 AM - 5:00 PM',
      'highlights', jsonb_build_array(
        'Swimming and water activities',
        'Nature hikes and camping skills',
        'Sports and team building',
        'Arts, crafts, and creative projects',
        'Wildlife encounters and conservation lessons'
      )
    )
  ),
  NOW()
)
ON CONFLICT (slug, content_type) 
DO UPDATE SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Mid-Term Camp Page
INSERT INTO content_items (
  slug,
  title,
  content_type,
  status,
  content,
  metadata,
  published_at
) VALUES (
  'mid-term-page',
  'Mid-Term Camp Page',
  'camp_page',
  'published',
  '{"title":"Mid-Term Break Camp","description":"Make the most of your school break with exciting outdoor activities, team games, and nature exploration!","heroImage":"/src/assets/camping.jpg","duration":"3-5 Days","ageGroup":"4-14 years","location":"Amuse Nature Experience Center","time":"8:00 AM - 5:00 PM","highlights":["Outdoor adventure activities","Team building games","Nature walks and exploration","Creative workshops","Sports and physical activities"]}',
  jsonb_build_object(
    'pageConfig', jsonb_build_object(
      'title', 'Mid-Term Break Camp',
      'description', 'Make the most of your school break with exciting outdoor activities, team games, and nature exploration!',
      'heroImage', '/src/assets/camping.jpg',
      'duration', '3-5 Days',
      'ageGroup', '4-14 years',
      'location', 'Amuse Nature Experience Center',
      'time', '8:00 AM - 5:00 PM',
      'highlights', jsonb_build_array(
        'Outdoor adventure activities',
        'Team building games',
        'Nature walks and exploration',
        'Creative workshops',
        'Sports and physical activities'
      )
    )
  ),
  NOW()
)
ON CONFLICT (slug, content_type) 
DO UPDATE SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  status = EXCLUDED.status,
  updated_at = NOW();

-- End Year Camp Page
INSERT INTO content_items (
  slug,
  title,
  content_type,
  status,
  content,
  metadata,
  published_at
) VALUES (
  'end-year-page',
  'End Year Camp Page',
  'camp_page',
  'published',
  '{"title":"End of Year Holiday Camp","description":"Celebrate the end of the school year with an action-packed camp full of adventure, fun, and memories to last a lifetime!","heroImage":"/src/assets/camping.jpg","duration":"4-6 Weeks","ageGroup":"4-14 years","location":"Amuse Nature Experience Center","time":"8:00 AM - 5:00 PM","highlights":["Extended outdoor adventures","Swimming and water sports","Camping and survival skills","Year-end celebration activities","Team challenges and competitions"]}',
  jsonb_build_object(
    'pageConfig', jsonb_build_object(
      'title', 'End of Year Holiday Camp',
      'description', 'Celebrate the end of the school year with an action-packed camp full of adventure, fun, and memories to last a lifetime!',
      'heroImage', '/src/assets/camping.jpg',
      'duration', '4-6 Weeks',
      'ageGroup', '4-14 years',
      'location', 'Amuse Nature Experience Center',
      'time', '8:00 AM - 5:00 PM',
      'highlights', jsonb_build_array(
        'Extended outdoor adventures',
        'Swimming and water sports',
        'Camping and survival skills',
        'Year-end celebration activities',
        'Team challenges and competitions'
      )
    )
  ),
  NOW()
)
ON CONFLICT (slug, content_type) 
DO UPDATE SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  status = EXCLUDED.status,
  updated_at = NOW();
