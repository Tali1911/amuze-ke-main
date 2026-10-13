-- Tab access delegation: admins choose which portal tabs a department (role) or a specific staff member sees.
CREATE TABLE IF NOT EXISTS public.staff_tab_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('role', 'user')),
  scope_id text NOT NULL,
  allowed_tabs text[] NOT NULL DEFAULT '{}',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, scope_id)
);

ALTER TABLE public.staff_tab_access ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.staff_tab_access FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_tab_access TO authenticated;
GRANT ALL ON public.staff_tab_access TO service_role;

DROP POLICY IF EXISTS "staff_read_tab_access" ON public.staff_tab_access;
CREATE POLICY "staff_read_tab_access" ON public.staff_tab_access
  FOR SELECT TO authenticated
  USING (public.is_approved_staff(auth.uid()));

DROP POLICY IF EXISTS "admin_manage_tab_access" ON public.staff_tab_access;
CREATE POLICY "admin_manage_tab_access" ON public.staff_tab_access
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
