-- Migration: VINA-390 — Wave 1 (DB) Bid/Ask Schema + RLS + Indexes + pg_cron Expiry
--
-- Purpose:
--   Creates the full database foundation for the Bid/Ask system:
--     • bids           — buyer offers to purchase a jersey at a given price
--     • asks           — seller offers to sell a jersey at a given price
--     • bid_ask_matches — records when a bid and ask are matched (trade execution)
--
-- Design notes:
--   - price_cents / matched_price_cents are INTEGER (never FLOAT) — mirrors the
--     Stripe/transactions convention; integer cents avoid floating-point rounding.
--   - status uses TEXT + CHECK constraint rather than an enum so that adding new
--     states (e.g. 'disputed') requires no DDL migration in future.
--   - expires_at defaults to now() + 30 days; expiry cleanup is handled via lazy
--     evaluation in Edge Functions (pg_cron not available on Supabase Free Plan).
--   - bid_ask_matches RLS grants SELECT to the buyer (via bids.user_id) and the
--     seller (via asks.user_id) using correlated EXISTS subqueries; INSERT/UPDATE
--     is reserved for the service role (Supabase webhook / matching engine).
--   - bids and asks are SELECT-open (anon + authenticated) to support public
--     market-display pages; mutations are owner-only.
--   - This migration must merge (and be applied to production) before Wave 2 starts.
--
-- DO NOT run supabase db push without Guido's explicit approval.

-- ── Table: bids ──────────────────────────────────────────────────────────────
CREATE TABLE public.bids (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id),
  jersey_id   UUID        NOT NULL REFERENCES public.user_jerseys(id),
  price_cents INTEGER     NOT NULL CHECK (price_cents > 0),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  status      TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'matched', 'cancelled', 'expired')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Table: asks ──────────────────────────────────────────────────────────────
CREATE TABLE public.asks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id),
  jersey_id   UUID        NOT NULL REFERENCES public.user_jerseys(id),
  price_cents INTEGER     NOT NULL CHECK (price_cents > 0),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  status      TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'matched', 'cancelled', 'expired')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Table: bid_ask_matches ────────────────────────────────────────────────────
CREATE TABLE public.bid_ask_matches (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id                   UUID        NOT NULL REFERENCES public.bids(id),
  ask_id                   UUID        NOT NULL REFERENCES public.asks(id),
  jersey_id                UUID        NOT NULL REFERENCES public.user_jerseys(id),
  matched_price_cents      INTEGER     NOT NULL,
  status                   TEXT        NOT NULL DEFAULT 'pending'
                                       CHECK (status IN ('pending', 'completed', 'failed')),
  stripe_payment_intent_id TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes: bids ─────────────────────────────────────────────────────────────
-- Partial index: active bids per jersey (matching engine lookup).
CREATE INDEX idx_bids_jersey_status
  ON public.bids (jersey_id, status)
  WHERE status = 'active';

-- Partial index: active bids ordered by descending price (highest bid first).
CREATE INDEX idx_bids_price
  ON public.bids (jersey_id, price_cents DESC)
  WHERE status = 'active';

-- Full index: all bids for a user across any status (dashboard / history).
CREATE INDEX idx_bids_user
  ON public.bids (user_id, status);

-- ── Indexes: asks ─────────────────────────────────────────────────────────────
-- Partial index: active asks per jersey (matching engine lookup).
CREATE INDEX idx_asks_jersey_status
  ON public.asks (jersey_id, status)
  WHERE status = 'active';

-- Partial index: active asks ordered by ascending price (lowest ask first).
CREATE INDEX idx_asks_price
  ON public.asks (jersey_id, price_cents ASC)
  WHERE status = 'active';

-- Full index: all asks for a user across any status (dashboard / history).
CREATE INDEX idx_asks_user
  ON public.asks (user_id, status);

-- ── Row-Level Security: bids ──────────────────────────────────────────────────
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Public market display: anyone (anon + authenticated) can read active bids.
CREATE POLICY "Anyone can view bids"
  ON public.bids
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Owners can insert their own bids.
CREATE POLICY "Owners can insert bids"
  ON public.bids
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Owners can update (e.g. cancel) their own bids.
CREATE POLICY "Owners can update bids"
  ON public.bids
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ── Row-Level Security: asks ──────────────────────────────────────────────────
ALTER TABLE public.asks ENABLE ROW LEVEL SECURITY;

-- Public market display: anyone (anon + authenticated) can read active asks.
CREATE POLICY "Anyone can view asks"
  ON public.asks
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Owners can insert their own asks.
CREATE POLICY "Owners can insert asks"
  ON public.asks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Owners can update (e.g. cancel) their own asks.
CREATE POLICY "Owners can update asks"
  ON public.asks
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ── Row-Level Security: bid_ask_matches ───────────────────────────────────────
ALTER TABLE public.bid_ask_matches ENABLE ROW LEVEL SECURITY;

-- Buyer (bid owner) can view matches they are party to.
CREATE POLICY "Buyer can view own matches"
  ON public.bid_ask_matches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bids
      WHERE bids.id = bid_id
        AND bids.user_id = auth.uid()
    )
  );

-- Seller (ask owner) can view matches they are party to.
CREATE POLICY "Seller can view own matches"
  ON public.bid_ask_matches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.asks
      WHERE asks.id = ask_id
        AND asks.user_id = auth.uid()
    )
  );

-- Service role (matching engine / webhook) bypasses RLS in Supabase by default;
-- no explicit INSERT/UPDATE policy is needed for bid_ask_matches.

-- ── Grants ────────────────────────────────────────────────────────────────────
-- bids: open SELECT for market display; writes are owner-only via RLS above.
GRANT SELECT, INSERT, UPDATE ON public.bids TO authenticated;
GRANT SELECT ON public.bids TO anon;

-- asks: same pattern as bids.
GRANT SELECT, INSERT, UPDATE ON public.asks TO authenticated;
GRANT SELECT ON public.asks TO anon;

-- bid_ask_matches: authenticated users need SELECT for the RLS policies to fire.
-- INSERT/UPDATE is performed by the service role (bypasses RLS).
GRANT SELECT ON public.bid_ask_matches TO authenticated;

-- NOTE: pg_cron expiry sweep intentionally omitted.
-- Supabase Free Plan does not support pg_cron. Expiry cleanup is handled via
-- lazy evaluation inside Edge Functions (see VINA-391).

--── Verification queries ──────────────────────────────────────────────────────
-- Run after applying to confirm expected state:
--
-- Tables exist:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name IN ('bids','asks','bid_ask_matches');
--
-- RLS enabled:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' AND tablename IN ('bids','asks','bid_ask_matches');
--
-- Policies:
--   SELECT tablename, policyname, cmd, roles
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename IN ('bids','asks','bid_ask_matches')
--   ORDER BY tablename, policyname;
--
-- pg_cron job:
--   SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'expire-bids-asks';
--
-- Indexes:
--   SELECT indexname, tablename, indexdef FROM pg_indexes
--   WHERE schemaname = 'public'
--     AND tablename IN ('bids','asks')
--   ORDER BY tablename, indexname;
