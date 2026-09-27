-- CC-C4 — Community verwalten (Guido executes in the SQL editor)
--
-- 1. Categories: admins can create/edit/sort/hide them (new column is_active).
--    Deleting a category no longer deletes its posts: FK forum_posts.category_id → ON DELETE RESTRICT
--    (was CASCADE). A category with posts can only be hidden.
-- 2. Pinning: only admins may set forum_posts.pinned. Closes a gap: until now every author could pin
--    their own post (UPDATE own posts covered all columns). Enforced by trigger, also on INSERT.
-- 3. Moderation: admins may update/delete any post and delete any comment.
-- Project convention: explicit GRANTs.

-- 1. Categories -------------------------------------------------------------------------------------
ALTER TABLE public.forum_categories ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE POLICY "Admins insert categories" ON public.forum_categories
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update categories" ON public.forum_categories
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete categories" ON public.forum_categories
  FOR DELETE TO authenticated USING (public.is_admin());
GRANT INSERT, UPDATE, DELETE ON public.forum_categories TO authenticated;
GRANT ALL ON public.forum_categories TO service_role;

ALTER TABLE public.forum_posts DROP CONSTRAINT forum_posts_category_id_fkey,
  ADD CONSTRAINT forum_posts_category_id_fkey FOREIGN KEY (category_id)
    REFERENCES public.forum_categories(id) ON DELETE RESTRICT;

-- 2. Pinning only by admins -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.forum_posts_guard_pinned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.pinned := false;
  ELSIF NEW.pinned IS DISTINCT FROM OLD.pinned THEN
    RAISE EXCEPTION 'Nur Admins können Beiträge anpinnen.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.forum_posts_guard_pinned() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS forum_posts_guard_pinned ON public.forum_posts;
CREATE TRIGGER forum_posts_guard_pinned
  BEFORE INSERT OR UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.forum_posts_guard_pinned();

-- 3. Moderation -------------------------------------------------------------------------------------
CREATE POLICY "Admins update any post" ON public.forum_posts
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete any post" ON public.forum_posts
  FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins delete any comment" ON public.forum_comments
  FOR DELETE TO authenticated USING (public.is_admin());

-- Rollback (manual):
-- DROP POLICY "Admins delete any comment" ON public.forum_comments;
-- DROP POLICY "Admins delete any post" ON public.forum_posts;
-- DROP POLICY "Admins update any post" ON public.forum_posts;
-- DROP TRIGGER forum_posts_guard_pinned ON public.forum_posts; DROP FUNCTION public.forum_posts_guard_pinned();
-- ALTER TABLE public.forum_posts DROP CONSTRAINT forum_posts_category_id_fkey,
--   ADD CONSTRAINT forum_posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.forum_categories(id) ON DELETE CASCADE;
-- DROP POLICY "Admins insert categories" ON public.forum_categories; (… update/delete likewise)
-- ALTER TABLE public.forum_categories DROP COLUMN is_active;
