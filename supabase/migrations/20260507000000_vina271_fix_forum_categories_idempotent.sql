-- Migration: VINA-271 — Idempotent repair of forum_categories table, RLS, and grants
--
-- Context:
--   Previous migrations (20260403075437, 20260504120000, 20260505000000,
--   20260505150000, 20260505160000) set up forum_categories. This migration
--   consolidates all of them into a single idempotent script that is safe to
--   run in Supabase SQL Editor even if some steps were already applied.
--
--   Root cause of VINA-269 (Community dropdown empty): one or more of the
--   preceding migrations may not have been applied to the live project
--   (napzgxpxkoiujjqwtzvz). This script repairs the state without risk of
--   data loss or duplication.
--
-- Safe to run:
--   - CREATE TABLE IF NOT EXISTS — skipped if table already exists
--   - ALTER TABLE … ADD CONSTRAINT IF NOT EXISTS — skipped if already exists
--   - CREATE POLICY IF NOT EXISTS — skipped if policy already exists
--   - INSERT … ON CONFLICT (name) DO NOTHING — no duplicates
--   - GRANT … — idempotent by PostgreSQL semantics

-- ============================================================
-- 1. Create table (idempotent)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id          UUID                     NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT                     NOT NULL,
  description TEXT,
  icon        TEXT,
  sort_order  INT                      NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Enable RLS (idempotent — no-op if already enabled)
-- ============================================================
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Create public-read RLS policy (skip if exists)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'forum_categories'
      AND policyname = 'Public can view categories'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Public can view categories"
      ON public.forum_categories FOR SELECT
      USING (true)
    $policy$;
  END IF;
END;
$$;

-- ============================================================
-- 4. Unique constraint on name (required for ON CONFLICT below)
-- ============================================================
ALTER TABLE public.forum_categories
  ADD CONSTRAINT IF NOT EXISTS forum_categories_name_unique UNIQUE (name);

-- ============================================================
-- 5. Seed default categories (idempotent)
-- ============================================================
INSERT INTO public.forum_categories (name, description, icon, sort_order)
VALUES
  ('Restaurierung',    'Tipps und Anleitungen zur Restaurierung von Vintage Trikots', 'Wrench',      1),
  ('Pflege & Lagerung','Wie man Sammlerstücke richtig pflegt und lagert',              'Shield',      2),
  ('Echtheitsprüfung', 'Wie erkennt man Originale und Fälschungen?',                  'Search',      3),
  ('Marktplatz-Talk',  'Diskussionen über Preise, Trends und den Markt',              'TrendingUp',  4),
  ('Showroom',         'Zeigt eure besten Stücke und Sammlungen',                     'Trophy',      5),
  ('Legit-Check',      'Echtheit prüfen lassen und Fälschungen erkennen',             'ShieldCheck', 6)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 6. Grants for anon and authenticated roles
-- ============================================================
GRANT SELECT ON public.forum_categories TO anon;
GRANT SELECT ON public.forum_categories TO authenticated;

-- ============================================================
-- Verification queries (run these after applying to confirm):
-- ============================================================
-- SELECT count(*) FROM public.forum_categories;
--   → expect 6
--
-- SELECT * FROM pg_policies WHERE tablename = 'forum_categories';
--   → expect row with policyname = 'Public can view categories'
--
-- SELECT grantee, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE table_name = 'forum_categories'
--     AND grantee IN ('anon', 'authenticated');
--   → expect rows for both anon and authenticated with SELECT
