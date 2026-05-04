-- Migration: Add is_for_sale and sale_price_cents to user_jerseys
-- Part of the Kaufen (Buy Now) feature (VINA-157)

ALTER TABLE user_jerseys
  ADD COLUMN is_for_sale boolean NOT NULL DEFAULT false,
  ADD COLUMN sale_price_cents integer NULL;
