-- Grant missing permissions for forum_comments table
-- Applied manually by Guido on 2026-05-15 to fix: permission denied for table forum_comments
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_comments TO authenticated;
GRANT SELECT ON public.forum_comments TO anon;
