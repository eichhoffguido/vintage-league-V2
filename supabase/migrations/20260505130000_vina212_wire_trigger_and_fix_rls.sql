-- Migration: VINA-212 — wire on_auth_user_created trigger and fix profiles RLS
--
-- Context:
--   20260505120000_fix_oauth_profile_trigger_and_rls.sql replaced the
--   handle_new_user() function body to handle Google OAuth metadata, but it
--   did NOT include trigger registration. If the initial migration was never
--   applied to production the trigger would be missing entirely, so new
--   Google OAuth sign-ups would never auto-create a profile row.
--
-- This migration is fully idempotent:
--   • DROP IF EXISTS + CREATE TRIGGER ensures the trigger points at the
--     current function regardless of prior state.
--   • DROP POLICY IF EXISTS + CREATE POLICY ensures the UPDATE RLS includes
--     an explicit WITH CHECK clause (required for upsert from Onboarding).

-- ── 1. Re-wire the OAuth profile trigger ──────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. Strengthen profiles UPDATE policy with explicit WITH CHECK ─────────────
-- Without WITH CHECK, a Supabase upsert (INSERT … ON CONFLICT DO UPDATE) can
-- fail the RLS check on the UPDATE branch even when USING passes.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
