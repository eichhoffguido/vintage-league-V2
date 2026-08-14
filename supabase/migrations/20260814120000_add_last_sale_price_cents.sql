-- Migration: Remember the last sale price when a listing is withdrawn from sale
--
-- Context: the Collection page's new "Zum Verkauf" toggle lets a seller
-- withdraw a sale offer while keeping the item's trade status untouched.
-- Withdrawing sets sale_price_cents back to NULL (this must stay the
-- authoritative "is this jersey currently for sale?" signal elsewhere in the
-- app -- JerseyCard, JerseyDetail and filterJerseys all key off
-- `sale_price_cents IS NOT NULL`). To let the price modal pre-fill with the
-- previous price when the seller reactivates the sale later, the last price
-- is copied into this new column before it's nulled out.
--
-- listing_type note: this feature also introduces a new listing_type value,
-- 'unlisted', for jerseys that are neither for sale nor for trade. No schema
-- change is required for that -- the live user_jerseys.listing_type column
-- currently has no CHECK constraint (confirmed via
-- pg_constraint / information_schema.columns), so it already accepts any
-- text value. The public/authenticated RLS SELECT policies only allow
-- ('buy_now','both','trade_only'), so 'unlisted' rows are automatically
-- excluded from the marketplace without any RLS change.

ALTER TABLE public.user_jerseys
  ADD COLUMN IF NOT EXISTS last_sale_price_cents integer;

COMMENT ON COLUMN public.user_jerseys.last_sale_price_cents IS
  'Remembers the most recent sale_price_cents value after a sale offer is withdrawn (sale_price_cents set back to NULL), so the price modal can be pre-filled when the listing is reactivated for sale.';
