-- Migration: Add listing_type to user_jerseys
-- Part of VINA-197 — Beta 2.0 schema additions
--
-- listing_type classifies how a jersey can be acquired:
--   'trade_only'  — only available for trades (default, existing behaviour)
--   'buy_now'     — only available for direct purchase
--   'both'        — available for both trade and purchase
--
-- Default is 'trade_only' to preserve existing jersey behaviour.
-- Note: is_for_sale was removed (VINA-214). Use sale_price_cents IS NOT NULL instead.

ALTER TABLE public.user_jerseys
  ADD COLUMN listing_type text NOT NULL DEFAULT 'trade_only'
  CHECK (listing_type IN ('trade_only', 'buy_now', 'both'));

-- Backfill: jerseys with a sale_price_cents set should be 'both'
UPDATE public.user_jerseys
  SET listing_type = 'both'
WHERE sale_price_cents IS NOT NULL;

COMMENT ON COLUMN public.user_jerseys.listing_type IS
  'Listing mode: trade_only | buy_now | both. Replaces the removed is_for_sale flag.';
