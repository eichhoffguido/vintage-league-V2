-- Migration: VINA-283 — Comprehensive RLS audit and grant repairs
--
-- Audit source: code review of all 28 prior migration files.
-- No live DB query was available; findings are derived from migration history alone.
--
-- Summary of missing grants identified:
--
-- | Table                      | Issue                                            |
-- |----------------------------|--------------------------------------------------|
-- | profiles                   | GRANT SELECT TO authenticated missing            |
-- | trade_requests             | GRANT SELECT TO authenticated missing            |
-- | trade_ratings              | GRANT SELECT TO anon missing                     |
-- | sales_history              | GRANT SELECT TO anon missing                     |
-- | jersey_sold_notifications  | GRANT SELECT TO authenticated missing            |
--
-- Confirmed already-covered tables (no action needed):
-- | user_jerseys      | anon SELECT ✓ (VINA-217/259/264) | auth SELECT ✓ (VINA-223) | write ✓ (VINA-226/227) |
-- | forum_categories  | anon SELECT ✓ (VINA-217/271)     | auth SELECT ✓ (VINA-223/271)                          |
-- | forum_posts       | anon SELECT ✓ (VINA-217)         | auth SELECT ✓ (VINA-223) | write ✓ (VINA-226)     |
-- | forum_comments    | anon SELECT ✓ (VINA-217)         | auth SELECT ✓ (VINA-223) | write ✓ (VINA-226)     |
-- | user_favorites    | auth SELECT ✓ (VINA-226) | INSERT/DELETE ✓                                        |
-- | jersey_favorites  | auth SELECT ✓ (VINA-226) | INSERT/DELETE ✓                                        |
-- | trade_confirmations | auth SELECT ✓ (VINA-226) | INSERT ✓                                             |
-- | transactions      | auth SELECT ✓ (VINA-242)                                                         |
--
-- Tables not present in migrations: forum_replies (does not exist)
--
-- Each GRANT is wrapped in a DO $$ block that checks table existence first.
-- This guards against partial migration states where a prior CREATE TABLE may
-- not have run (e.g. selective replay, rollback, or fresh schema with skipped
-- migrations). PostgreSQL GRANTs on existing tables are idempotent — a
-- duplicate GRANT is silently ignored (no error, no side effect).
--
-- DO NOT run supabase db push without Guido's explicit approval.

-- ════════════════════════════════════════════════════════════════════════════════
-- 1. profiles — GRANT SELECT TO authenticated
-- ════════════════════════════════════════════════════════════════════════════════
--
-- RLS policy "Authenticated users can view profiles" has existed since the initial
-- migration (20260402204358). However, no GRANT SELECT was ever issued to the
-- authenticated role:
--   • VINA-223 granted SELECT on user_jerseys/forum_* only
--   • VINA-226 granted INSERT/UPDATE on profiles — SELECT was omitted
--   • VINA-224 granted SELECT TO anon only
--
-- Without this grant, authenticated users hit "permission denied" on profiles
-- before RLS is even evaluated (e.g. profile pages, community posts showing author names).
--
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    GRANT SELECT ON public.profiles TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════════
-- 2. trade_requests — GRANT SELECT TO authenticated
-- ════════════════════════════════════════════════════════════════════════════════
--
-- RLS policy "Trade participants can view their trades" has existed since the
-- initial migration (auth.uid() check via is_jersey_owner — fixed in
-- 20260430180000). VINA-226 granted INSERT, UPDATE, DELETE but SELECT was
-- never included. Without this grant, authenticated users cannot load their
-- trade inbox at all.
--
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trade_requests'
  ) THEN
    GRANT SELECT ON public.trade_requests TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════════
-- 3. trade_ratings — GRANT SELECT TO anon
-- ════════════════════════════════════════════════════════════════════════════════
--
-- RLS policy "Public read trade_ratings" (USING (true), no TO clause) was added
-- in 20260504140000. VINA-226 issued GRANT SELECT to authenticated only.
-- Anon users viewing a seller's public profile cannot load their ratings without
-- this grant.
--
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trade_ratings'
  ) THEN
    GRANT SELECT ON public.trade_ratings TO anon;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════════
-- 4. sales_history — GRANT SELECT TO anon
-- ════════════════════════════════════════════════════════════════════════════════
--
-- RLS policy "Public read sales_history" (USING (true), no TO clause) was added
-- in 20260504150000. VINA-226 issued GRANT SELECT to authenticated only.
-- Unauthenticated visitors cannot view price history for jerseys without this grant.
--
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sales_history'
  ) THEN
    GRANT SELECT ON public.sales_history TO anon;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════════
-- 5. jersey_sold_notifications — GRANT SELECT TO authenticated
-- ════════════════════════════════════════════════════════════════════════════════
--
-- Table created in 20260506000000_vina244. RLS policy "Recipients can select own
-- notifications" (USING (auth.uid() = recipient_id)) exists. No GRANT SELECT was
-- ever issued. Authenticated users receive "permission denied" when fetching their
-- notifications.
--
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'jersey_sold_notifications'
  ) THEN
    GRANT SELECT ON public.jersey_sold_notifications TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════════
-- Verification queries (run after applying to confirm coverage)
-- ════════════════════════════════════════════════════════════════════════════════
--
-- SELECT table_name, grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public'
--   AND grantee IN ('anon', 'authenticated')
-- ORDER BY table_name, grantee, privilege_type;
--
-- Expected new rows after this migration:
--   profiles              | authenticated | SELECT
--   trade_requests        | authenticated | SELECT
--   trade_ratings         | anon          | SELECT
--   sales_history         | anon          | SELECT
--   jersey_sold_notifications | authenticated | SELECT
--
-- To verify RLS policies are in place for the newly-granted tables:
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'profiles', 'trade_requests', 'trade_ratings',
--     'sales_history', 'jersey_sold_notifications'
--   )
-- ORDER BY tablename, policyname;
