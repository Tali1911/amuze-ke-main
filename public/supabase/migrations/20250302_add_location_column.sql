-- Add location column for multi-location support
ALTER TABLE camp_registrations
  ADD COLUMN IF NOT EXISTS location text DEFAULT 'Kurura Gate F';
