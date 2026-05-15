-- Migration: VINA-378 — Fix forum_comments RLS policies
--
-- Bug: "permission denied for table forum_comments" reported during QA of VINA-350.
-- Root cause: The original RLS policies and GRANTs for forum_comments may not have
-- been applied on the live Supabase instance, or were lost during a prior migration.
--
-- This migration idempotently re-creates the three RLS policies and re-applies all
-- required GRANTs. All statements are safe to re-run (DROP IF EXISTS, idempotent GRANT).
--
-- RLS policy design:
--   SELECT  — public read (anon + authenticated), no deleted_at filter yet
--             (soft-deleted rows are still returned; client can filter if needed)
--   INSERT  — authenticated users only, user_id must match auth.uid()
--   UPDATE  — authenticated users only, own rows only
--   DELETE  — authenticated users only, own rows only
--
-- DO NOT run supabase db push without Guido's explicit approval.

-- ── 1. Ensure RLS is enabled ────────────────────────────────────────────────
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

-- ── 2. Drop existing policies (idempotent) ──────────────────────────────────
DROP POLICY IF EXISTS "Public can view comments"            ON public.forum_comments;
DROP POLICY IF EXISTS "Users can create own comments"       ON public.forum_comments;
DROP POLICY IF EXISTS "Users can update own comments"       ON public.forum_comments;
DROP POLICY IF EXISTS "Users can delete own comments"       ON public.forum_comments;

-- Legacy policy names that may exist under different labels
DROP POLICY IF EXISTS "Authenticated users can view comments"  ON public.forum_comments;
DROP POLICY IF EXISTS "Anyone can read forum comments"         ON public.forum_comments;
DROP POLICY IF EXISTS "forum_comments_select_policy"           ON public.forum_comments;

-- ── 3. Re-create policies ───────────────────────────────────────────────────

-- SELECT: allow anon and authenticated to read all comments (public forum)
CREATE POLICY "Public can view comments"
ON public.forum_comments
FOR SELECT
USING (true);

-- INSERT: authenticated users may only insert rows owned by themselves
CREATE POLICY "Users can create own comments"
ON public.forum_comments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: authenticated users may only update their own rows
CREATE POLICY "Users can update own comments"
ON public.forum_comments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: authenticated users may only delete their own rows
CREATE POLICY "Users can delete own comments"
ON public.forum_comments
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ── 4. Re-apply GRANTs (idempotent — duplicate GRANT is a no-op) ────────────
GRANT SELECT                  ON public.forum_comments TO anon;
GRANT SELECT                  ON public.forum_comments TO authenticated;
GRANT INSERT, UPDATE, DELETE  ON public.forum_comments TO authenticated;
