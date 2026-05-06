-- Migration: VINA-259 — BUG 1 + BUG 3 DB
--   BUG 1: Re-grant SELECT on user_jerseys to anon (idempotent, ensures coverage after any schema changes)
--   BUG 3: Add is_featured boolean column to user_jerseys
--
-- Context:
--   BUG 1: The shop page (/shop) was not visible to unauthenticated users because the anon
--   role lacked an explicit SELECT grant. VINA-217 added this grant, but re-issuing it here
--   is idempotent (Postgres silently ignores a duplicate GRANT) and ensures it is in effect
--   after any future schema resets or reprovisioning.
--
--   BUG 3: The frontend needs an is_featured flag on jerseys so that featured listings can be
--   displayed prominently on the shop page. The column defaults to FALSE so existing rows are
--   unaffected. The anon grant above covers this new column because it is a table-level SELECT
--   grant (not a column-level grant).
--
-- DO NOT run supabase db push without Guido's explicit approval.

-- BUG 1: Grant anon read access on user_jerseys (idempotent)
GRANT SELECT ON public.user_jerseys TO anon;

-- BUG 3 DB: Add is_featured boolean column (idempotent)
ALTER TABLE public.user_jerseys
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
