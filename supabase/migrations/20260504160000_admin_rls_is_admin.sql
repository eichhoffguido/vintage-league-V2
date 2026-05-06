-- VINA-170: Add is_admin() function, profiles.is_admin column, and admin RLS for verification

-- 1. Add is_admin column to profiles
ALTER TABLE public.profiles
  ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- 2. Create is_admin() helper function
--    SECURITY DEFINER so it bypasses RLS and can read profiles freely.
--    Returns true if the current authenticated user has is_admin = true.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;

-- 3. Add RLS policy so admins can UPDATE any jersey (needed for verification)
--    Regular users can still update their own jerseys via the existing policy.
CREATE POLICY "Admins can update any jersey"
  ON public.user_jerseys FOR UPDATE TO authenticated
  USING (public.is_admin());

-- 4. Trigger function: prevent non-admins from changing verification fields.
--    PostgreSQL RLS is row-level only; column-level restriction requires a trigger.
--    This BEFORE UPDATE trigger raises an exception when a non-admin attempts to
--    modify verification_status, verified_at, or verified_by.
CREATE OR REPLACE FUNCTION public.check_verification_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    NEW.verification_status IS DISTINCT FROM OLD.verification_status OR
    NEW.verified_at IS DISTINCT FROM OLD.verified_at OR
    NEW.verified_by IS DISTINCT FROM OLD.verified_by
  ) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can update verification fields (verification_status, verified_at, verified_by)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_verification_admin_only
  BEFORE UPDATE ON public.user_jerseys
  FOR EACH ROW EXECUTE FUNCTION public.check_verification_update();

-- Index to speed up is_admin() lookups on the profiles table
CREATE INDEX idx_profiles_is_admin ON public.profiles(id) WHERE is_admin = true;
