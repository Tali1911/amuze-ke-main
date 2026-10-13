-- SECURITY FIX: Replace overly permissive RLS policies with role-based access control
-- This migration fixes the security issue where ANY authenticated user could access ALL registration data

-- ============================================================================
-- STEP 1: Drop all existing policies on registration tables
-- ============================================================================

DO $$
DECLARE
    tbl TEXT;
    pol RECORD;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'kenyan_experiences_registrations',
            'homeschooling_registrations',
            'school_experience_registrations',
            'team_building_registrations',
            'parties_registrations',
            'camp_registrations'
        ])
    LOOP
        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = tbl AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
            RAISE NOTICE 'Dropped policy % on %', pol.policyname, tbl;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Ensure RLS is enabled on all registration tables
-- ============================================================================

ALTER TABLE IF EXISTS public.kenyan_experiences_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.homeschooling_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.school_experience_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_building_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.parties_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.camp_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create secure RLS policies for kenyan_experiences_registrations
-- ============================================================================

-- Public INSERT: Anyone can submit registrations (public forms)
CREATE POLICY "public_insert_kenyan"
ON public.kenyan_experiences_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Staff SELECT: Only authorized roles can view registrations
CREATE POLICY "staff_select_kenyan"
ON public.kenyan_experiences_registrations
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
);

-- Staff UPDATE: Only authorized roles can update registrations
CREATE POLICY "staff_update_kenyan"
ON public.kenyan_experiences_registrations
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
);

-- Staff DELETE: Only admin/ceo can delete registrations
CREATE POLICY "staff_delete_kenyan"
ON public.kenyan_experiences_registrations
FOR DELETE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
);

-- ============================================================================
-- STEP 4: Create secure RLS policies for homeschooling_registrations
-- ============================================================================

CREATE POLICY "public_insert_homeschooling"
ON public.homeschooling_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "staff_select_homeschooling"
ON public.homeschooling_registrations
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "staff_update_homeschooling"
ON public.homeschooling_registrations
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "staff_delete_homeschooling"
ON public.homeschooling_registrations
FOR DELETE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
);

-- ============================================================================
-- STEP 5: Create secure RLS policies for school_experience_registrations
-- ============================================================================

CREATE POLICY "public_insert_school"
ON public.school_experience_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "staff_select_school"
ON public.school_experience_registrations
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "staff_update_school"
ON public.school_experience_registrations
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "staff_delete_school"
ON public.school_experience_registrations
FOR DELETE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
);

-- ============================================================================
-- STEP 6: Create secure RLS policies for team_building_registrations
-- ============================================================================

CREATE POLICY "public_insert_team_building"
ON public.team_building_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "staff_select_team_building"
ON public.team_building_registrations
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "staff_update_team_building"
ON public.team_building_registrations
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "staff_delete_team_building"
ON public.team_building_registrations
FOR DELETE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
);

-- ============================================================================
-- STEP 7: Create secure RLS policies for parties_registrations
-- ============================================================================

CREATE POLICY "public_insert_parties"
ON public.parties_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "staff_select_parties"
ON public.parties_registrations
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "staff_update_parties"
ON public.parties_registrations
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "staff_delete_parties"
ON public.parties_registrations
FOR DELETE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
);

-- ============================================================================
-- STEP 8: Create secure RLS policies for camp_registrations
-- ============================================================================

CREATE POLICY "public_insert_camp"
ON public.camp_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "staff_select_camp"
ON public.camp_registrations
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "staff_update_camp"
ON public.camp_registrations
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "staff_delete_camp"
ON public.camp_registrations
FOR DELETE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
        'kenyan_experiences_registrations',
        'homeschooling_registrations',
        'school_experience_registrations',
        'team_building_registrations',
        'parties_registrations',
        'camp_registrations'
    );
    
    RAISE NOTICE '✅ Security fix applied: % RLS policies created for registration tables', policy_count;
    RAISE NOTICE '✅ Public users can INSERT registrations (for forms)';
    RAISE NOTICE '✅ Only admin/ceo/marketing/coach roles can SELECT/UPDATE registrations';
    RAISE NOTICE '✅ Only admin/ceo roles can DELETE registrations';
END $$;
