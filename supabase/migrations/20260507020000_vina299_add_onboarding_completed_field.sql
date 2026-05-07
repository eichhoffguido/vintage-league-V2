-- VINA-299: Add onboarding_completed field to profiles table
--
-- Purpose: Track whether a user has completed onboarding flow
-- - New users start with onboarding_completed = false
-- - Onboarding.tsx sets this to true when user completes the onboarding flow
-- - ProfileGuard in App.tsx checks this field to decide: /collection or /onboarding

-- Add the onboarding_completed column to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Update the handle_new_user() trigger to set onboarding_completed = false
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, onboarding_completed)
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
    NEW.raw_user_meta_data->>'avatar_url',
    -- New users start with onboarding_completed = false
    false
  )
  ON CONFLICT (id) DO NOTHING;   -- idempotent; safe on retries
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user creation due to profile side-effects.
  -- The frontend (Onboarding) handles the missing-profile case via upsert.
  RETURN NEW;
END;
$$;
