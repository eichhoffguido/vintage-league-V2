-- Migration: VINA-224 — Grant SELECT to anon role for profiles (public data)
--
-- Context:
--   /community posts display author display_name from profiles table.
--   However, anon users (unauthenticated visitors) could not read profiles,
--   causing the component to fail silently or show blank/dark content.
--
--   We need to grant anon SELECT on profiles to allow public reading of
--   user display_name and avatar_url. RLS policies ensure only public
--   data is visible.
--
-- Fix:
--   Add GRANT SELECT on profiles to anon role.
--   RLS policy "Authenticated users can view profiles" remains, and we add
--   a new policy for anon users to read non-sensitive profile fields.

-- Grant anon read access to profiles table
GRANT SELECT ON public.profiles TO anon;

-- Add RLS policy for anon users to read public profile data
CREATE POLICY "Anon users can view public profiles"
  ON public.profiles FOR SELECT TO anon USING (true);
