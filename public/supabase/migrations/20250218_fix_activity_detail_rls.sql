-- Fix RLS policies for activity_detail content type creation
-- This ensures marketing users can properly create and view activity details

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Published content is viewable by all" ON public.content_items;
DROP POLICY IF EXISTS "Marketing can manage content" ON public.content_items;
DROP POLICY IF EXISTS "Marketing can insert content" ON public.content_items;
DROP POLICY IF EXISTS "Marketing can update content" ON public.content_items;
DROP POLICY IF EXISTS "Marketing can delete content" ON public.content_items;

-- Allow authenticated users to view published content or their own drafts
CREATE POLICY "Published content is viewable by all"
  ON public.content_items FOR SELECT
  USING (
    status = 'published' 
    OR auth.uid() = author_id
    OR public.has_role(auth.uid(), 'marketing')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'ceo')
  );

-- Allow marketing, admin, and CEO to INSERT content
CREATE POLICY "Marketing can insert content"
  ON public.content_items FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'marketing') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'ceo')
  );

-- Allow marketing, admin, and CEO to UPDATE their content
CREATE POLICY "Marketing can update content"
  ON public.content_items FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'marketing') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'ceo')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'marketing') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'ceo')
  );

-- Allow marketing, admin, and CEO to DELETE content
CREATE POLICY "Marketing can delete content"
  ON public.content_items FOR DELETE
  USING (
    public.has_role(auth.uid(), 'marketing') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'ceo')
  );

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_items TO authenticated;
