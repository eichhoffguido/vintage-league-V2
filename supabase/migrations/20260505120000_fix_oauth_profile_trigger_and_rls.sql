-- Fix: handle_new_user() trigger for Google OAuth compatibility
--
-- Root causes:
--   1. Trigger used raw_user_meta_data->>'display_name' — Google OAuth provides
--      'full_name' / 'name', not 'display_name'. Profile row was created with
--      a NULL or empty display_name, breaking the onboarding profile-step check.
--   2. No ON CONFLICT guard — a second INSERT (race / retry) caused a PK
--      violation that rolled back the entire auth.users transaction.
--   3. No exception handler — any trigger error blocked OAuth sign-up entirely.
-- Note: is_for_sale was intentionally removed (VINA-214). sale_price_cents IS NOT NULL
--   is used as the "for sale" indicator. sale_price_cents is added in migration 20260504160000.

-- ── 1. Ensure sale_price_cents exists (safety net) ───────────────────────────
ALTER TABLE public.user_jerseys
  ADD COLUMN IF NOT EXISTS sale_price_cents integer NULL;

-- ── 2. Replace handle_new_user() with OAuth-aware version ─────────────────────
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
