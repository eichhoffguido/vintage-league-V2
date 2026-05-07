-- Migration: VINA-298 — Add onboarding_completed field to profiles
--
-- Context:
--   The frontend (App.tsx, Onboarding.tsx) reads profiles.onboarding_completed
--   to decide whether to redirect new users to /onboarding or returning users
--   to /collection. This field does not exist in the DB yet, causing:
--     1. Every login triggers onboarding redirect (column is NULL → treated as false)
--     2. Onboarding.completeOnboarding() update fails silently (column missing)
--
-- Design decisions:
--   • ADD COLUMN IF NOT EXISTS — idempotent, safe to re-run
--   • DEFAULT FALSE — new users start with onboarding incomplete (correctly
--     routed to /onboarding on first login)
--   • Seeding: profiles created BEFORE this migration → TRUE, because these
--     are real users already on the platform who must not be forced through
--     onboarding again. The timestamp guard makes the seed step idempotent:
--     on re-runs, only pre-migration rows are targeted, never new signups.
--   • DO $$ block for the seed — avoids PostgreSQL's lack of
--     ADD CONSTRAINT IF NOT EXISTS and allows a RAISE NOTICE.
--
-- Safe to run multiple times:
--   • ADD COLUMN IF NOT EXISTS: no-op if column already exists.
--   • DO $$ seed: timestamp guard prevents touching post-migration users.

-- ── 1. Add the column (idempotent) ───────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- ── 2. Seed pre-existing users as having completed onboarding ─────────────────
-- Users whose profile existed before this migration was created are treated as
-- having completed onboarding. The created_at guard makes this idempotent:
-- re-running the migration will find zero matching rows (post-migration signups
-- have created_at after the cutoff and their onboarding_completed reflects
-- actual application state, not the default).
DO $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.profiles
  SET    onboarding_completed = true
  WHERE  onboarding_completed = false
    AND  created_at < '2026-05-07 02:00:00+00'::timestamptz;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RAISE NOTICE 'vina298: seeded onboarding_completed=true for % pre-existing profile(s)', v_updated;
END;
$$;
