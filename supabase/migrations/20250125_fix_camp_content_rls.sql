-- Fix RLS policies for camp content management
-- Allow marketing users to manage camp pages and forms

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Marketing can manage content" ON content_items;
DROP POLICY IF EXISTS "Marketing can insert content" ON content_items;
DROP POLICY IF EXISTS "Marketing can update content" ON content_items;
DROP POLICY IF EXISTS "Marketing users can manage all content" ON content_items;

-- Create comprehensive policy for marketing users to manage all content
CREATE POLICY "Marketing users can manage all content"
ON content_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('marketing', 'admin', 'ceo')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('marketing', 'admin', 'ceo')
  )
);

-- Ensure public can read published content
DROP POLICY IF EXISTS "Public can read published content" ON content_items;
CREATE POLICY "Public can read published content"
ON content_items
FOR SELECT
USING (status = 'published');
