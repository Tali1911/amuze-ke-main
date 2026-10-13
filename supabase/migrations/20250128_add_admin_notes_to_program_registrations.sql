-- Add admin_notes column to all program registration tables

-- Add admin_notes to kenyan_experiences_registrations
ALTER TABLE kenyan_experiences_registrations 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add admin_notes to homeschooling_registrations
ALTER TABLE homeschooling_registrations 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add admin_notes to school_experience_registrations
ALTER TABLE school_experience_registrations 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add admin_notes to team_building_registrations
ALTER TABLE team_building_registrations 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add admin_notes to parties_registrations
ALTER TABLE parties_registrations 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;
