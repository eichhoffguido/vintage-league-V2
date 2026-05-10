-- VINA-349: Add image_urls columns to forum_posts and forum_comments
-- Stores an array of Supabase Storage public URLs for attached images.
-- Default is an empty array so existing rows remain valid without backfill.

-- Add image_urls to forum_posts
ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';

-- Add image_urls to forum_comments
ALTER TABLE public.forum_comments
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';
