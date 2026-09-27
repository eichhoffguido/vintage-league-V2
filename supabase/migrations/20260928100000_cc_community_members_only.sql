-- CC community members-only (Guido, 27.09.2026): guests must not read community content.
-- Before: forum_posts / forum_comments / forum_post_likes were readable by everyone
-- (policies "Public can view …", role public, USING true) — even if the page redirects,
-- the API would still hand out posts to the anon key.
-- After:  only authenticated users can read them. Guests get a teaser page with the post count
--         from community_post_count() (a number, no content).
-- forum_categories stays public (category names only).

DROP POLICY IF EXISTS "Public can view posts" ON public.forum_posts;
CREATE POLICY "Members can view posts" ON public.forum_posts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public can view comments" ON public.forum_comments;
CREATE POLICY "Members can view comments" ON public.forum_comments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "forum_post_likes_public_read" ON public.forum_post_likes;
CREATE POLICY "forum_post_likes_member_read" ON public.forum_post_likes
  FOR SELECT TO authenticated USING (true);

-- Belt and braces: no table privilege for anon either.
REVOKE SELECT ON public.forum_posts, public.forum_comments, public.forum_post_likes FROM anon;

-- Teaser number for guests
CREATE OR REPLACE FUNCTION public.community_post_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM forum_posts WHERE deleted_at IS NULL;
$$;
COMMENT ON FUNCTION public.community_post_count() IS
  'CC community members-only: number of posts for the guest teaser (no content).';
REVOKE ALL ON FUNCTION public.community_post_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.community_post_count() TO anon, authenticated, service_role;

-- Rollback:
-- DROP POLICY "Members can view posts" ON public.forum_posts;
-- CREATE POLICY "Public can view posts" ON public.forum_posts FOR SELECT USING (true);
-- DROP POLICY "Members can view comments" ON public.forum_comments;
-- CREATE POLICY "Public can view comments" ON public.forum_comments FOR SELECT USING (true);
-- DROP POLICY "forum_post_likes_member_read" ON public.forum_post_likes;
-- CREATE POLICY "forum_post_likes_public_read" ON public.forum_post_likes FOR SELECT USING (true);
-- GRANT SELECT ON public.forum_posts, public.forum_comments, public.forum_post_likes TO anon;
-- DROP FUNCTION public.community_post_count();
