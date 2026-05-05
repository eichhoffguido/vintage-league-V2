-- Migration: Add listing_type to user_jerseys
-- Part of VINA-197 — Beta 2.0 schema additions
--
-- listing_type classifies how a jersey can be acquired:
--   'trade_only'  — only available for trades (default, existing behaviour)
--   'buy_now'     — only available for direct purchase
--   'both'        — available for both trade and purchase
--
-- Default is 'trade_only' to preserve existing jersey behaviour.
-- The is_for_sale boolean (added in VINA-165) will remain for backward
-- compatibility; listing_type supersedes it for new feature logic.

ALTER TABLE public.user_jerseys
  ADD COLUMN listing_type text NOT NULL DEFAULT 'trade_only'
  CHECK (listing_type IN ('trade_only', 'buy_now', 'both'));

-- Backfill: jerseys already marked is_for_sale=true should be 'both'
-- (they were tradeable AND for sale)
UPDATE public.user_jerseys
  SET listing_type = 'both'
WHERE is_for_sale = true;

COMMENT ON COLUMN public.user_jerseys.listing_type IS
  'Listing mode: trade_only | buy_now | both. Supersedes is_for_sale for new feature logic.';
