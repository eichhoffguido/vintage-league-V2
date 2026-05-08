-- Migration: VINA-307 — Add description TEXT column to user_jerseys
-- Adds a nullable TEXT column to store a jersey's story/description.
-- Nullable so existing rows are unaffected (no NOT NULL backfill required).

ALTER TABLE public.user_jerseys
  ADD COLUMN IF NOT EXISTS description TEXT;
