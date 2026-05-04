-- Migration: create jersey_favorites table
-- Part of VINA-158 Watchlist / Favorites feature
-- VINA-167: DB Migration for jersey_favorites

CREATE TABLE public.jersey_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jersey_id uuid NOT NULL REFERENCES public.user_jerseys(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, jersey_id)
);

-- Enable Row Level Security
ALTER TABLE public.jersey_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: users can only manage (insert/select/delete) their own favorites
-- This prevents any user from reading or modifying another user's favorites list
CREATE POLICY "users can manage own favorites"
  ON public.jersey_favorites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
-- idx_jersey_favorites_user_id: fast lookup of all favorites for a given user
CREATE INDEX idx_jersey_favorites_user_id ON public.jersey_favorites(user_id);
-- idx_jersey_favorites_jersey_id: fast lookup of how many users favorited a jersey
CREATE INDEX idx_jersey_favorites_jersey_id ON public.jersey_favorites(jersey_id);
