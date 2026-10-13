-- Reusable Email Templates for Marketing Campaigns
-- Lets staff save and reuse email layouts (subject + body + from_name) when composing blasts.

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text DEFAULT 'general',
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  from_name text DEFAULT 'Amuse Kenya',
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_category
  ON public.email_templates (category) WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_email_templates_updated_at
  ON public.email_templates (updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_templates'
      AND policyname = 'Marketing can manage email templates'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Marketing can manage email templates"
        ON public.email_templates FOR ALL
        TO authenticated
        USING (
          public.has_role(auth.uid(), 'marketing') OR
          public.has_role(auth.uid(), 'admin') OR
          public.has_role(auth.uid(), 'ceo')
        )
        WITH CHECK (
          public.has_role(auth.uid(), 'marketing') OR
          public.has_role(auth.uid(), 'admin') OR
          public.has_role(auth.uid(), 'ceo')
        )
    $p$;
  END IF;
END $$;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_email_templates_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_email_templates_updated_at();

-- Seed a few starter templates (idempotent by name)
INSERT INTO public.email_templates (name, description, category, subject, body_html, from_name)
SELECT * FROM (VALUES
  (
    'Camp Launch Announcement',
    'Standard layout for announcing a new camp registration window.',
    'announcement',
    'Registration is open: {{Camp Name}}',
    '<h2>Registration is now open!</h2><p>Hi there,</p><p>We''re thrilled to announce that <strong>{{Camp Name}}</strong> is now open for registration. Spots fill up fast — secure yours today.</p><p><a href="https://amusekenya.co.ke">View dates &amp; book</a></p><p>See you in the bush,<br/>The Amuse Team</p>',
    'Amuse Kenya'
  ),
  (
    'Last Call Reminder',
    'Short urgency reminder for closing registration windows.',
    'reminder',
    'Last call: {{Camp Name}} closes soon',
    '<h2>Only a few spots left</h2><p>Hi there,</p><p>This is a quick reminder that registration for <strong>{{Camp Name}}</strong> closes soon. Don''t miss out.</p><p><a href="https://amusekenya.co.ke">Reserve your spot</a></p><p>Warmly,<br/>The Amuse Team</p>',
    'Amuse Kenya'
  ),
  (
    'Newsletter — Monthly Update',
    'General newsletter shell with intro, updates and call to action.',
    'newsletter',
    'Amuse Kenya — what''s new this month',
    '<h2>Hello from the bush!</h2><p>Here''s a quick roundup of what''s been happening at Amuse Kenya.</p><h3>What''s new</h3><ul><li>Update one</li><li>Update two</li><li>Update three</li></ul><h3>Upcoming</h3><p>Tell readers what to look forward to.</p><p><a href="https://amusekenya.co.ke">Explore our programs</a></p>',
    'Amuse Kenya'
  )
) AS t(name, description, category, subject, body_html, from_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates et WHERE et.name = t.name
);
