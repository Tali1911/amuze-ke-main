-- Complete fix for leads table RLS - ensures both GRANT and policy are correct
-- Error: "new row violates row-level security policy for table \"leads\""

-- Step 1: Grant basic table privileges to anon role (RLS policies work ON TOP of these)
GRANT SELECT, INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

-- Step 2: Grant usage on sequences (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 3: Drop ALL existing policies on leads (clean slate)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'leads' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 4: Create clean RLS policies

-- INSERT policy: Anyone can create leads (public registration forms)
CREATE POLICY "leads_insert_public"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- SELECT policy: Marketing, Admin, CEO can view all leads
CREATE POLICY "leads_select_staff"
ON public.leads
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
);

-- UPDATE policy: Marketing, Admin, CEO can update leads
CREATE POLICY "leads_update_staff"
ON public.leads
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
)
WITH CHECK (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
);

-- DELETE policy: Marketing, Admin, CEO can delete leads  
CREATE POLICY "leads_delete_staff"
ON public.leads
FOR DELETE
TO authenticated
USING (
    public.has_role(auth.uid(), 'marketing'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'ceo'::app_role)
);

-- Verify
DO $$
BEGIN
    RAISE NOTICE 'Leads RLS policies created successfully with proper GRANTs';
END $$;
