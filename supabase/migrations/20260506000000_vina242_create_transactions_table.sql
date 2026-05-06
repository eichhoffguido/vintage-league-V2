-- Migration: VINA-242 — Create transactions table (Stripe Phase 1)
--
-- Purpose:
--   Records all Stripe purchase events for the VintageLeague buy-now flow.
--   Each row represents a single checkout session: buyer, seller, jersey,
--   monetary amounts in cents (Stripe-compatible integers), and status.
--
-- Design notes:
--   - amount_cents / platform_fee_cents are INTEGER (never FLOAT) — Stripe uses
--     integer cents and floating-point arithmetic would introduce rounding errors.
--   - stripe_session_id has a UNIQUE constraint so the webhook handler can safely
--     upsert without creating duplicate rows.
--   - status is a plain TEXT column with a CHECK constraint; an enum is avoided so
--     adding values (e.g. 'disputed') does not require a DDL migration.
--   - Service role bypasses RLS in Supabase by default, so no INSERT/UPDATE RLS
--     policy is needed for the webhook handler — only SELECT policies for end users.
--
-- DO NOT run supabase db push without Guido's explicit approval.

-- ── Table ────────────────────────────────────────────────────────────────────
CREATE TABLE public.transactions (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  jersey_id          UUID        NOT NULL REFERENCES public.user_jerseys(id),
  buyer_id           UUID        NOT NULL REFERENCES auth.users(id),
  seller_id          UUID        NOT NULL REFERENCES auth.users(id),
  amount_cents       INTEGER     NOT NULL,
  platform_fee_cents INTEGER     NOT NULL,
  stripe_session_id  TEXT        UNIQUE NOT NULL,
  status             TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
-- Fast webhook lookups by Stripe session id (high-frequency webhook path).
CREATE INDEX idx_transactions_stripe_session_id
  ON public.transactions (stripe_session_id);

-- Lookups by jersey to find purchase history for a given listing.
CREATE INDEX idx_transactions_jersey_id
  ON public.transactions (jersey_id);

-- ── Row-Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Buyers can read their own purchase records.
CREATE POLICY "Buyers can view own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- Sellers can read transactions where they are the seller (sales dashboard).
CREATE POLICY "Sellers can view own sale transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- ── Grants ───────────────────────────────────────────────────────────────────
-- Authenticated users need SELECT privilege so the RLS policies above can fire.
-- INSERT / UPDATE are handled exclusively by the webhook handler (service_role),
-- which bypasses RLS and holds superuser-level privileges by default in Supabase.
GRANT SELECT ON public.transactions TO authenticated;
