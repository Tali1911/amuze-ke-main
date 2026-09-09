-- Add the new "Camp" navigation entry (a marketing overview page distinct
-- from the existing "Camps" dropdown). Safe to run repeatedly.
INSERT INTO public.navigation_settings (nav_key, label, is_visible, display_order)
VALUES ('camp', 'Camp', true, 5)
ON CONFLICT (nav_key) DO NOTHING;
