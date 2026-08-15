CREATE TABLE IF NOT EXISTS public.forum_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post_id
  ON public.forum_post_likes(post_id);

ALTER TABLE public.forum_post_likes ENABLE ROW LEVEL SECURITY;

-- Öffentlich zählbar/lesbar (Forum ist public read)
CREATE POLICY forum_post_likes_public_read ON public.forum_post_likes
  FOR SELECT USING (true);

-- Eingeloggte dürfen NUR eigene Likes anlegen/entfernen
CREATE POLICY forum_post_likes_insert_own ON public.forum_post_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY forum_post_likes_delete_own ON public.forum_post_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT SELECT ON public.forum_post_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.forum_post_likes TO authenticated;
