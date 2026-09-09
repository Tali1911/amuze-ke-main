-- Receipts + Till Reconciliation

-- ============ Storage bucket for expense receipts ============
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-receipts',
  'expense-receipts',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  public = EXCLUDED.public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view expense-receipts') THEN
    CREATE POLICY "Anyone can view expense-receipts" ON storage.objects
      FOR SELECT USING (bucket_id = 'expense-receipts');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated upload expense-receipts') THEN
    CREATE POLICY "Authenticated upload expense-receipts" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'expense-receipts' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated update expense-receipts') THEN
    CREATE POLICY "Authenticated update expense-receipts" ON storage.objects
      FOR UPDATE USING (bucket_id = 'expense-receipts' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated delete expense-receipts') THEN
    CREATE POLICY "Authenticated delete expense-receipts" ON storage.objects
      FOR DELETE USING (bucket_id = 'expense-receipts' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- ============ receipt_uploads (inbox) ============
CREATE TABLE IF NOT EXISTS public.receipt_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  vendor_hint TEXT,
  amount_hint NUMERIC(12,2),
  receipt_date DATE,
  notes TEXT,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched','matched','archived')),
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  matched_by UUID,
  matched_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_status ON public.receipt_uploads(status);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_expense ON public.receipt_uploads(expense_id);

ALTER TABLE public.receipt_uploads ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='receipt_uploads' AND policyname='auth all receipt_uploads') THEN
    CREATE POLICY "auth all receipt_uploads" ON public.receipt_uploads
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============ till_statements (declared per day per stream) ============
CREATE TABLE IF NOT EXISTS public.till_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_date DATE NOT NULL,
  stream TEXT NOT NULL CHECK (stream IN ('mpesa','cash')),
  declared_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  reference TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (statement_date, stream)
);
CREATE INDEX IF NOT EXISTS idx_till_statements_date ON public.till_statements(statement_date);

ALTER TABLE public.till_statements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='till_statements' AND policyname='auth all till_statements') THEN
    CREATE POLICY "auth all till_statements" ON public.till_statements
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS till_statements_set_updated_at ON public.till_statements;
CREATE TRIGGER till_statements_set_updated_at
  BEFORE UPDATE ON public.till_statements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ till_reconciliations (locked snapshots) ============
CREATE TABLE IF NOT EXISTS public.till_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL CHECK (period_type IN ('day','month','year')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  stream TEXT NOT NULL CHECK (stream IN ('mpesa','cash')),
  system_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  declared_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  variance NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'reconciled' CHECK (status IN ('open','reconciled','disputed')),
  notes TEXT,
  reconciled_by UUID,
  reconciled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_till_recons_period ON public.till_reconciliations(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_till_recons_stream ON public.till_reconciliations(stream);

ALTER TABLE public.till_reconciliations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='till_reconciliations' AND policyname='auth all till_reconciliations') THEN
    CREATE POLICY "auth all till_reconciliations" ON public.till_reconciliations
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
