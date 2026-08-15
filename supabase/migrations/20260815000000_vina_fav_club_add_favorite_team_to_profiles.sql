ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorite_team TEXT;

COMMENT ON COLUMN public.profiles.favorite_team IS
  'User''s favorite club, selected from the frontend team list (no free text).';
-- Kein RLS-Update nötig: bestehende profiles-Policies decken Self-Update ab;
-- öffentliche Lesbarkeit von profiles besteht bereits (vina224).
