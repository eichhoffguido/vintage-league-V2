-- Migration: Add sale_price_cents to user_jerseys
-- Part of the Kaufen (Buy Now) feature (VINA-157)
-- Note: is_for_sale was intentionally removed (VINA-214).
--   Use sale_price_cents IS NOT NULL as the "for sale" indicator instead.

ALTER TABLE user_jerseys
  ADD COLUMN sale_price_cents integer NULL;
