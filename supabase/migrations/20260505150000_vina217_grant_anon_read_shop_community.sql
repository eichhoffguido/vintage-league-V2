-- Migration: VINA-217 — Grant SELECT to anon role for /shop and /community
--
-- Context:
--   RLS policies already exist for unauthenticated (anon) read access on
--   user_jerseys, forum_categories, forum_posts, and forum_comments. However,
--   in Supabase/PostgreSQL, RLS policies alone are not sufficient — the role
--   also needs an explicit GRANT to access the table at all.
--
--   Without GRANT SELECT, the anon role receives "permission denied" before
--   RLS is even evaluated, causing /shop and /community to appear empty for
--   unauthenticated visitors.
--
-- Fix:
--   Add GRANT SELECT on the four affected tables to the anon role.
--   RLS policies remain unchanged and continue to filter rows appropriately.

-- /shop — jersey listings marketplace
GRANT SELECT ON public.user_jerseys TO anon;

-- /community — forum browsing
GRANT SELECT ON public.forum_categories TO anon;
GRANT SELECT ON public.forum_posts TO anon;
GRANT SELECT ON public.forum_comments TO anon;
