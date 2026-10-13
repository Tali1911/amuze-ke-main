-- Gallery Items table for storing image metadata with categories
-- This complements the storage bucket by adding searchable metadata

-- Create gallery categories enum
CREATE TYPE public.gallery_category AS ENUM (
  'all',
  'camps',
  'wildlife',
  'team_building',
  'parties',
  'school_adventures',
  'nature',
  'activities'
);

-- Create gallery items table
CREATE TABLE public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  category public.gallery_category NOT NULL DEFAULT 'all',
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster category filtering
CREATE INDEX idx_gallery_items_category ON public.gallery_items(category);
CREATE INDEX idx_gallery_items_created_at ON public.gallery_items(created_at DESC);
CREATE INDEX idx_gallery_items_featured ON public.gallery_items(is_featured) WHERE is_featured = true;

-- Enable RLS
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access (gallery is public)
CREATE POLICY "Anyone can view gallery items"
  ON public.gallery_items
  FOR SELECT
  USING (true);

-- Allow authenticated users with marketing role to manage
CREATE POLICY "Marketing can insert gallery items"
  ON public.gallery_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'marketing', 'ceo')
    )
  );

CREATE POLICY "Marketing can update gallery items"
  ON public.gallery_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'marketing', 'ceo')
    )
  );

CREATE POLICY "Marketing can delete gallery items"
  ON public.gallery_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'marketing', 'ceo')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_gallery_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gallery_items_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gallery_items_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.gallery_items IS 'Stores gallery image metadata with categories for filtering. Images are stored in marketing-assets bucket.';
