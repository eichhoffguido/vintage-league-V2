-- Migration: VINA-226 — Grant write privileges to authenticated role
--
-- Root cause (same pattern as VINA-217 / VINA-223):
--   In Supabase/PostgreSQL, GRANT (privilege) and RLS (row filter) are independent layers.
--   Postgres evaluates the GRANT first. If the role lacks the privilege, the query fails
--   with "permission denied" before RLS is even evaluated.
--
--   RLS policies for INSERT/UPDATE/DELETE on all public tables exist (created in the original
--   migrations), but no explicit GRANT INSERT/UPDATE/DELETE was ever issued to the
--   `authenticated` role. As a result, any authenticated user attempting to add, edit,
--   or delete a jersey (or post, comment, favorite, etc.) receives "permission denied".
--
-- Fix:
--   Grant the minimum required write privileges on each table to the `authenticated` role.
--   Existing RLS policies remain unchanged and continue to filter rows correctly.
--   The anon role is deliberately excluded from all write grants — public users must
--   sign in before they can write data.

-- ── user_jerseys — core of VINA-226 ──────────────────────────────────────────
-- Authenticated users: add, edit, and remove their own jerseys.
GRANT INSERT, UPDATE, DELETE ON public.user_jerseys TO authenticated;

-- ── profiles ─────────────────────────────────────────────────────────────────
-- Authenticated users: create their profile row on first sign-in (via handle_new_user
-- trigger, which runs as SECURITY DEFINER, so no GRANT needed for the trigger itself),
-- and update their own profile (display_name, bio, avatar_url, etc.).
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

-- ── trade_requests ───────────────────────────────────────────────────────────
-- Authenticated users: create, respond to (accept/decline), and cancel trade requests.
GRANT INSERT, UPDATE, DELETE ON public.trade_requests TO authenticated;

-- ── trade_confirmations ──────────────────────────────────────────────────────
-- Authenticated users: record that they confirm a completed trade.
GRANT SELECT, INSERT ON public.trade_confirmations TO authenticated;

-- ── trade_ratings ────────────────────────────────────────────────────────────
-- Authenticated users: submit a rating after a completed trade.
GRANT SELECT, INSERT ON public.trade_ratings TO authenticated;

-- ── sales_history ────────────────────────────────────────────────────────────
-- Authenticated users: view and record direct sales.
GRANT SELECT, INSERT ON public.sales_history TO authenticated;

-- ── user_favorites ───────────────────────────────────────────────────────────
-- Authenticated users: add and remove items from their watchlist.
GRANT SELECT, INSERT, DELETE ON public.user_favorites TO authenticated;

-- ── jersey_favorites ─────────────────────────────────────────────────────────
-- Authenticated users: add and remove jersey-level favorites.
GRANT SELECT, INSERT, DELETE ON public.jersey_favorites TO authenticated;

-- ── forum_posts ──────────────────────────────────────────────────────────────
-- Authenticated users: create, edit, and delete their own forum posts.
-- (SELECT was already granted in VINA-223; repeated here for completeness/idempotency.)
GRANT INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;

-- ── forum_comments ───────────────────────────────────────────────────────────
-- Authenticated users: create, edit, and delete their own comments.
-- (SELECT was already granted in VINA-223; repeated here for completeness/idempotency.)
GRANT INSERT, UPDATE, DELETE ON public.forum_comments TO authenticated;
