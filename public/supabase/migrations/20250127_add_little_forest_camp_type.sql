-- Add 'little-forest' to camp_type enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'little-forest' 
    AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'camp_type'
    )
  ) THEN
    ALTER TYPE camp_type ADD VALUE 'little-forest';
  END IF;
END $$;

-- Update camp_attendance RLS policies to include little-forest
-- Policy already uses camp_type so no changes needed to policies

-- Add comment for documentation
COMMENT ON TYPE camp_type IS 'Camp types: easter, summer, end-year, day-camps, mid-term-feb-march, mid-term-may-june, mid-term-october, little-forest';
