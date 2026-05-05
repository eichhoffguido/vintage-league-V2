-- VINA-214: Fix database schema mismatches — critical production bugs
--
-- Fix 1: is_for_sale does not exist in production — removed from codebase.
--   sale_price_cents IS NOT NULL is used as the "for sale" indicator.
--   This migration ensures sale_price_cents exists.
--
-- Fix 2: handle_new_user trigger updated for Google OAuth compatibility.
--   Google provides 'full_name'/'name', not 'display_name'.
--
-- Fix 3: Ensure RLS UPDATE policy exists on profiles.

-- ── Fix 1: Ensure sale_price_cents column exists ──────────────────────────────
ALTER TABLE public.user_jerseys
  ADD COLUMN IF NOT EXISTS sale_price_cents integer NULL;

-- ── Fix 2: Replace handle_new_user() with Google OAuth-aware version ──────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    -- Google OAuth → 'full_name' or 'name'
    -- Email signup  → 'display_name' from signUp options.data
    -- Fallback      → local part of the email address
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'),    ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'),         ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1),  '')
    ),
    -- Capture Google profile picture if available
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;   -- idempotent; safe on retries
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user creation due to profile side-effects.
  -- The frontend (Onboarding) handles the missing-profile case via upsert.
  RETURN NEW;
END;
$$;

-- Recreate trigger to ensure it references the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Fix 3: Ensure RLS UPDATE policy exists on profiles ───────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND cmd        = 'UPDATE'
      AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE TO authenticated
      USING (id = auth.uid());
  END IF;
END;
$$;
