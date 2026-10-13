-- Email Marketing Campaign / Blast Infrastructure
-- Extends campaigns + email_deliveries tables to power Marketing Portal "Email Blast".
-- Run in the Supabase SQL editor.

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS body_html text,
  ADD COLUMN IF NOT EXISTS from_name text,
  ADD COLUMN IF NOT EXISTS segment_id uuid REFERENCES public.email_segments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sent_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone;

ALTER TABLE public.email_deliveries
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_email_deliveries_campaign_id
  ON public.email_deliveries(campaign_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'campaigns'
      AND policyname = 'Marketing can manage campaigns'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Marketing can manage campaigns"
        ON public.campaigns FOR ALL
        USING (
          public.has_role(auth.uid(), 'marketing') OR
          public.has_role(auth.uid(), 'admin') OR
          public.has_role(auth.uid(), 'ceo')
        )
    $p$;
  END IF;
END $$;

-- Public unsubscribe tokens for marketing emails
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  token text PRIMARY KEY,
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  used_at timestamp with time zone
);
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_unsubscribe_tokens' AND policyname='Anyone can read tokens') THEN
    EXECUTE $p$CREATE POLICY "Anyone can read tokens" ON public.email_unsubscribe_tokens FOR SELECT USING (true)$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_unsubscribe_tokens' AND policyname='Anyone can update tokens') THEN
    EXECUTE $p$CREATE POLICY "Anyone can update tokens" ON public.email_unsubscribe_tokens FOR UPDATE USING (true)$p$;
  END IF;
END $$;
