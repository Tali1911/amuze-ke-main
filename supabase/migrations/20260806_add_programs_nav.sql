-- Add the "Programs" navigation entry pointing at the new CMS-driven
-- /programs overview page. Safe to run repeatedly.
INSERT INTO public.navigation_settings (nav_key, label, is_visible, display_order)
VALUES ('programs', 'Programs', true, 6)
ON CONFLICT (nav_key) DO NOTHING;
