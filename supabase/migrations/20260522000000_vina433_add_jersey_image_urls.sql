-- VINA-434: Add image_urls TEXT[] to user_jerseys for multi-image support
-- Idempotent (IF NOT EXISTS) -- safe to re-run
ALTER TABLE user_jerseys
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';
