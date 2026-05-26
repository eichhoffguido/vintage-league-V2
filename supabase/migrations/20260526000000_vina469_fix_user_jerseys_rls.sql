-- Migration: Fix RLS policies on user_jerseys table
-- Context: Guido manually fixed a critical RLS bug where SELECT policies
-- were filtering on available_for_trade (old field) instead of listing_type (current field).
-- This migration documents that fix for the repo.

DROP POLICY IF EXISTS "Public can view available jerseys" ON public.user_jerseys;
CREATE POLICY "Public can view available jerseys"
ON public.user_jerseys FOR SELECT TO anon
USING (
  deleted_at IS NULL
  AND listing_type IN ('buy_now', 'both', 'trade_only')
);

DROP POLICY IF EXISTS "Users can view own jerseys or available-for-trade" ON public.user_jerseys;
CREATE POLICY "Users can view own jerseys or available-for-trade"
ON public.user_jerseys FOR SELECT TO authenticated
USING (
  deleted_at IS NULL
  AND (
    user_id = auth.uid()
    OR listing_type IN ('buy_now', 'both', 'trade_only')
  )
);
