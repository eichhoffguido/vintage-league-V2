-- Migration: VINA-342 — Explicit GRANT + RLS fix for jersey_favorites
--
-- Root cause:
--   The jersey_favorites table was created in 20260504170000 with RLS enabled
--   and a policy, and VINA-226 (20260505170000) added GRANT SELECT, INSERT, DELETE.
--   However, production DB is still returning HTTP 403 ("permission denied for table
--   jersey_favorites"), indicating the grants and/or RLS policy were not applied
--   correctly in the production environment.
--
-- Fix:
--   Re-apply the grants and RLS policy idempotently to ensure production is in
--   the correct state regardless of prior migration history.
--
-- Safety:
--   - GRANT is idempotent in PostgreSQL — a duplicate GRANT is silently ignored.
--   - ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent.
--   - The DO block checks pg_policies before attempting to CREATE POLICY to avoid
--     duplicate-policy errors on databases where the policy already exists.

-- Step 1: Grant minimum required permissions to authenticated role
-- (idempotent — safe to run even if already granted)
GRANT SELECT, INSERT, DELETE ON public.jersey_favorites TO authenticated;

-- Step 2: Ensure RLS is enabled on the table
-- (idempotent — no-op if already enabled)
ALTER TABLE public.jersey_favorites ENABLE ROW LEVEL SECURITY;

-- Step 3: Create the RLS policy if it does not already exist
-- Checks both lowercase variant (from original migration) and mixed-case variant
DO $$
BEGIN
  -- Create the policy only if no equivalent policy already exists for this table
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'jersey_favorites'
      AND policyname IN ('users can manage own favorites', 'Users can manage own favorites')
  ) THEN
    CREATE POLICY "Users can manage own favorites"
      ON public.jersey_favorites
      FOR ALL
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Verification queries (run after applying to confirm coverage):
--
-- SELECT grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND table_name = 'jersey_favorites'
-- ORDER BY grantee, privilege_type;
--
-- Expected rows:
--   authenticated | DELETE
--   authenticated | INSERT
--   authenticated | SELECT
--
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'jersey_favorites';
--
-- Expected row:
--   "users can manage own favorites" | ALL | (auth.uid() = user_id) | (auth.uid() = user_id)
