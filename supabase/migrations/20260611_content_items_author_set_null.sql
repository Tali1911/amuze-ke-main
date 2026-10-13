-- Fix: deleting a user fails with
--   "update or delete on table 'users' violates foreign key constraint
--    'content_items_author_id_fkey' on table 'content_items'"
-- because content_items.author_id -> auth.users(id) had no ON DELETE action
-- (defaults to NO ACTION, blocking the delete).
--
-- Switch to ON DELETE SET NULL so the user can be removed while their
-- previously authored CMS content is preserved (author becomes unknown).

ALTER TABLE public.content_items
  DROP CONSTRAINT IF EXISTS content_items_author_id_fkey;

ALTER TABLE public.content_items
  ADD CONSTRAINT content_items_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;
