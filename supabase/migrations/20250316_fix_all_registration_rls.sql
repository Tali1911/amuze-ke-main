-- Fix RLS policies for all registration tables to allow public form submissions
-- This migration ensures anonymous users can submit registrations

-- ============================================================================
-- STEP 1: Disable RLS temporarily and drop all existing policies
-- ============================================================================

DO $$
DECLARE
  tables text[] := ARRAY[
    'team_building_registrations',
    'parties_registrations', 
    'kenyan_experiences_registrations',
    'homeschooling_registrations',
    'school_experience_registrations',
    'camp_registrations'
  ];
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Check if table exists before operating on it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      -- Disable RLS temporarily
      EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
      
      -- Drop all existing policies
      FOR pol IN 
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
      END LOOP;
      
      RAISE NOTICE 'Cleaned up policies for %', t;
    ELSE
      RAISE NOTICE 'Table % does not exist, skipping', t;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Grant permissions to anon and authenticated roles
-- ============================================================================

DO $$
DECLARE
  tables text[] := ARRAY[
    'team_building_registrations',
    'parties_registrations', 
    'kenyan_experiences_registrations',
    'homeschooling_registrations',
    'school_experience_registrations',
    'camp_registrations'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      -- Grant INSERT to anon (for public form submissions)
      EXECUTE format('GRANT INSERT ON public.%I TO anon', t);
      -- Grant all operations to authenticated users
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
      RAISE NOTICE 'Granted permissions for %', t;
    END IF;
  END LOOP;
END $$;

-- Grant sequence usage for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- STEP 3: Re-enable RLS and create simple, permissive policies
-- ============================================================================

-- Team Building Registrations
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_building_registrations') THEN
    ALTER TABLE public.team_building_registrations ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "allow_public_insert_team_building" 
      ON public.team_building_registrations 
      FOR INSERT 
      TO anon, authenticated 
      WITH CHECK (true);
    
    CREATE POLICY "allow_auth_select_team_building" 
      ON public.team_building_registrations 
      FOR SELECT 
      TO authenticated 
      USING (true);
    
    CREATE POLICY "allow_auth_update_team_building" 
      ON public.team_building_registrations 
      FOR UPDATE 
      TO authenticated 
      USING (true) 
      WITH CHECK (true);
    
    CREATE POLICY "allow_auth_delete_team_building" 
      ON public.team_building_registrations 
      FOR DELETE 
      TO authenticated 
      USING (true);
  END IF;
END $$;

-- Parties Registrations
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parties_registrations') THEN
    ALTER TABLE public.parties_registrations ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "allow_public_insert_parties" 
      ON public.parties_registrations 
      FOR INSERT 
      TO anon, authenticated 
      WITH CHECK (true);
    
    CREATE POLICY "allow_auth_select_parties" 
      ON public.parties_registrations 
      FOR SELECT 
      TO authenticated 
      USING (true);
    
    CREATE POLICY "allow_auth_update_parties" 
      ON public.parties_registrations 
      FOR UPDATE 
      TO authenticated 
      USING (true) 
      WITH CHECK (true);
    
    CREATE POLICY "allow_auth_delete_parties" 
      ON public.parties_registrations 
      FOR DELETE 
      TO authenticated 
      USING (true);
  END IF;
END $$;

-- Kenyan Experiences Registrations
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kenyan_experiences_registrations') THEN
    ALTER TABLE public.kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "allow_public_insert_kenyan" 
      ON public.kenyan_experiences_registrations 
      FOR INSERT 
      TO anon, authenticated 
      WITH CHECK (true);
    
    CREATE POLICY "allow_auth_select_kenyan" 
      ON public.kenyan_experiences_registrations 
      FOR SELECT 
      TO authenticated 
      USING (true);
    
    CREATE POLICY "allow_auth_update_kenyan" 
      ON public.kenyan_experiences_registrations 
      FOR UPDATE 
      TO authenticated 
      USING (true) 
      WITH CHECK (true);
    
    CREATE POLICY "allow_auth_delete_kenyan" 
      ON public.kenyan_experiences_registrations 
      FOR DELETE 
      TO authenticated 
      USING (true);
  END IF;
END $$;

-- Homeschooling Registrations
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'homeschooling_registrations') THEN
    ALTER TABLE public.homeschooling_registrations ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "allow_public_insert_homeschooling" 
      ON public.homeschooling_registrations 
      FOR INSERT 
      TO anon, authenticated 
      WITH CHECK (true);
    
    CREATE POLICY "allow_auth_select_homeschooling" 
      ON public.homeschooling_registrations 
      FOR SELECT 
      TO authenticated 
      USING (true);
    
    CREATE POLICY "allow_auth_update_homeschooling" 
      ON public.homeschooling_registrations 
      FOR UPDATE 
      TO authenticated 
      USING (true) 
      WITH CHECK (true);
    
    CREATE POLICY "allow_auth_delete_homeschooling" 
      ON public.homeschooling_registrations 
      FOR DELETE 
      TO authenticated 
      USING (true);
  END IF;
END $$;

-- School Experience Registrations
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'school_experience_registrations') THEN
    ALTER TABLE public.school_experience_registrations ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "allow_public_insert_school" 
      ON public.school_experience_registrations 
      FOR INSERT 
      TO anon, authenticated 
      WITH CHECK (true);
    
    CREATE POLICY "allow_auth_select_school" 
      ON public.school_experience_registrations 
      FOR SELECT 
      TO authenticated 
      USING (true);
    
    CREATE POLICY "allow_auth_update_school" 
      ON public.school_experience_registrations 
      FOR UPDATE 
      TO authenticated 
      USING (true) 
      WITH CHECK (true);
    
    CREATE POLICY "allow_auth_delete_school" 
      ON public.school_experience_registrations 
      FOR DELETE 
      TO authenticated 
      USING (true);
  END IF;
END $$;

-- Camp Registrations
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'camp_registrations') THEN
    ALTER TABLE public.camp_registrations ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "allow_public_insert_camp" 
      ON public.camp_registrations 
      FOR INSERT 
      TO anon, authenticated 
      WITH CHECK (true);
    
    CREATE POLICY "allow_auth_select_camp" 
      ON public.camp_registrations 
      FOR SELECT 
      TO authenticated 
      USING (true);
    
    CREATE POLICY "allow_auth_update_camp" 
      ON public.camp_registrations 
      FOR UPDATE 
      TO authenticated 
      USING (true) 
      WITH CHECK (true);
    
    CREATE POLICY "allow_auth_delete_camp" 
      ON public.camp_registrations 
      FOR DELETE 
      TO authenticated 
      USING (true);
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename IN (
      'team_building_registrations',
      'parties_registrations',
      'kenyan_experiences_registrations',
      'homeschooling_registrations',
      'school_experience_registrations',
      'camp_registrations'
    );
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total policies created: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Permissions:';
  RAISE NOTICE '  ✓ Anonymous users can INSERT (submit forms)';
  RAISE NOTICE '  ✓ Authenticated users can SELECT, UPDATE, DELETE';
  RAISE NOTICE '';
  RAISE NOTICE 'Form submissions should now work!';
  RAISE NOTICE '========================================';
END $$;
