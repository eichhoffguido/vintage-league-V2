-- Migration: trade_ratings table + average_rating on profiles
--
-- Part of the Trade Completion + Star Ratings feature (VINA-155).
-- Creates the trade_ratings table for post-trade star ratings and
-- adds average_rating to profiles for display in the marketplace.

-- New table: public.trade_ratings
CREATE TABLE public.trade_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trade_requests(id),
  rater_user_id uuid NOT NULL REFERENCES auth.users(id),
  rated_user_id uuid NOT NULL REFERENCES auth.users(id),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trade_id, rater_user_id)
);

-- New column on profiles: average_rating
-- Populated by application logic / future trigger; nullable (no ratings yet)
ALTER TABLE public.profiles ADD COLUMN average_rating numeric(3,2);

-- Enable RLS on trade_ratings
ALTER TABLE public.trade_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: anyone (including anonymous) can read ratings
CREATE POLICY "Public read trade_ratings"
  ON public.trade_ratings FOR SELECT
  USING (true);

-- Policy: authenticated users can insert their own ratings only
CREATE POLICY "Authenticated users insert own ratings"
  ON public.trade_ratings FOR INSERT TO authenticated
  WITH CHECK (rater_user_id = auth.uid());

-- No UPDATE or DELETE policies — ratings are immutable once submitted
