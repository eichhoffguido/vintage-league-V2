-- Migration: VINA-223 — Grant SELECT to authenticated role for /shop and /community
--
-- Context:
--   VINA-217 granted SELECT on user_jerseys, forum_categories, forum_posts, and
--   forum_comments to the *anon* role so unauthenticated visitors can browse.
--   However, the *authenticated* role was never explicitly granted SELECT on these
--   tables either.
--
--   In Supabase/PostgreSQL the GRANT and the RLS policy are independent:
--     - RLS policies already exist for authenticated reads (e.g. "Users can view
--       own jerseys or available-for-trade" on user_jerseys FOR SELECT TO authenticated).
--     - Without a matching GRANT, the role gets "permission denied" before RLS is
--       evaluated, so logged-in users see an empty /shop and a broken /community.
--
-- Fix:
--   Add GRANT SELECT on the four affected tables to the authenticated role.
--   Existing RLS policies remain unchanged and continue to filter rows correctly.

-- /shop — jersey listings marketplace (logged-in users can browse + view own jerseys)
GRANT SELECT ON public.user_jerseys TO authenticated;

-- /community — forum browsing (logged-in users can read all categories, posts, comments)
GRANT SELECT ON public.forum_categories TO authenticated;
GRANT SELECT ON public.forum_posts TO authenticated;
GRANT SELECT ON public.forum_comments TO authenticated;
