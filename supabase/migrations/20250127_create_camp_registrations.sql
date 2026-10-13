-- Create camp registrations table
CREATE TABLE IF NOT EXISTS public.camp_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT UNIQUE NOT NULL,
  camp_type TEXT NOT NULL CHECK (camp_type IN ('easter', 'summer', 'end-year', 'mid-term-1', 'mid-term-2', 'mid-term-3', 'day-camps')),
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  emergency_contact TEXT,
  children JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial')),
  payment_method TEXT DEFAULT 'pending' CHECK (payment_method IN ('pending', 'card', 'mpesa', 'cash_ground')),
  payment_reference TEXT,
  registration_type TEXT NOT NULL DEFAULT 'online_only' CHECK (registration_type IN ('online_only', 'online_paid', 'ground_registration')),
  qr_code_data TEXT UNIQUE NOT NULL,
  consent_given BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_notes TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_camp_registrations_qr_code ON public.camp_registrations(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_camp_registrations_email ON public.camp_registrations(email);
CREATE INDEX IF NOT EXISTS idx_camp_registrations_camp_type ON public.camp_registrations(camp_type);
CREATE INDEX IF NOT EXISTS idx_camp_registrations_payment_status ON public.camp_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_camp_registrations_created_at ON public.camp_registrations(created_at DESC);

-- Enable RLS
ALTER TABLE public.camp_registrations ENABLE ROW LEVEL SECURITY;

-- Function to generate unique registration number
CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get the count of registrations for this year
  SELECT COUNT(*) INTO counter
  FROM public.camp_registrations
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Generate number in format REG-YYYY-XXXXXX
  new_number := 'REG-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((counter + 1)::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$;

-- Trigger to auto-generate registration number
CREATE OR REPLACE FUNCTION public.set_registration_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.registration_number IS NULL OR NEW.registration_number = '' THEN
    NEW.registration_number := public.generate_registration_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_registration_number ON public.camp_registrations;
CREATE TRIGGER trigger_set_registration_number
BEFORE INSERT ON public.camp_registrations
FOR EACH ROW
EXECUTE FUNCTION public.set_registration_number();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_camp_registration_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_camp_registration_timestamp ON public.camp_registrations;
CREATE TRIGGER trigger_update_camp_registration_timestamp
BEFORE UPDATE ON public.camp_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_camp_registration_timestamp();
