-- Migration: VINA-264 — Phase 2A: Fix anon RLS + add is_featured + seed test jersey data
--
-- Context:
--   QA confirmed (/shop and homepage collection show 0 jerseys for anon visitors).
--   Root causes:
--     1. The anon role has no SELECT policy on public.user_jerseys — only the
--        `authenticated` role has a policy. Any GRANT SELECT that exists is moot
--        without a matching RLS policy.
--     2. is_featured column does not yet exist in production DB (VINA-259 migration
--        was committed but never pushed via db push).
--     3. The DB has only 1 jersey row and it has available_for_trade = false, so
--        it is invisible even with correct RLS in place.
--
-- This migration:
--   A. Adds is_featured boolean column (idempotent).
--   B. Grants anon SELECT on user_jerseys and profiles (idempotent).
--   C. Adds an anon SELECT RLS policy on user_jerseys (idempotent via DO block).
--   D. Grants anon SELECT on profiles so seller info can be fetched (idempotent).
--   E. Seeds 3 realistic test jerseys with available_for_trade = true and
--      is_featured = true so the homepage collection and shop are immediately
--      populated.
--
-- DO NOT run supabase db push without Guido's explicit approval.

-- ─── A. Add is_featured column ───────────────────────────────────────────────

ALTER TABLE public.user_jerseys
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── B. Grant anon SELECT on user_jerseys + profiles ─────────────────────────

GRANT SELECT ON public.user_jerseys TO anon;
GRANT SELECT ON public.profiles TO anon;

-- ─── C. Add anon SELECT RLS policy on user_jerseys (idempotent) ──────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_jerseys'
      AND policyname = 'Public can view available jerseys'
  ) THEN
    CREATE POLICY "Public can view available jerseys"
      ON public.user_jerseys FOR SELECT TO anon
      USING (available_for_trade = true AND deleted_at IS NULL);
  END IF;
END$$;

-- ─── D. Add anon SELECT RLS policy on profiles (idempotent) ──────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Public can view profiles'
  ) THEN
    CREATE POLICY "Public can view profiles"
      ON public.profiles FOR SELECT TO anon
      USING (deleted_at IS NULL);
  END IF;
END$$;

-- ─── E. Seed test jerseys ─────────────────────────────────────────────────────
-- Uses the existing user_id from the one pre-existing jersey row.
-- All rows: available_for_trade = true, is_featured = true, verified so they
-- appear immediately in the shop and homepage featured collection.

INSERT INTO public.user_jerseys
  (user_id, name, team, league, year, condition, size,
   price_cents, available_for_trade, is_featured,
   verification_status, deleted_at)
VALUES
  (
    '3791d127-e496-4c42-b919-4a5910864213',
    'FC Bayern München 1990/91',
    'FC Bayern München',
    'Bundesliga',
    '1990/91',
    5, 'L',
    12900, true, true,
    'verified', NULL
  ),
  (
    '3791d127-e496-4c42-b919-4a5910864213',
    'Borussia Dortmund 1995/96',
    'Borussia Dortmund',
    'Bundesliga',
    '1995/96',
    4, 'M',
    8900, true, true,
    'verified', NULL
  ),
  (
    '3791d127-e496-4c42-b919-4a5910864213',
    'AC Milan 1988/89',
    'AC Milan',
    'Serie A',
    '1988/89',
    5, 'XL',
    15900, true, true,
    'verified', NULL
  );
