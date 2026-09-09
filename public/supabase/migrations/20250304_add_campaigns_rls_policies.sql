-- Add RLS policies to campaigns table (RLS is enabled but no policies exist)

-- Staff (admin/marketing) can fully manage campaigns
CREATE POLICY "campaigns_select_staff" ON public.campaigns
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role) OR
    public.has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE POLICY "campaigns_insert_staff" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role)
  );

CREATE POLICY "campaigns_update_staff" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role)
  );

CREATE POLICY "campaigns_delete_staff" ON public.campaigns
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'marketing'::app_role)
  );
