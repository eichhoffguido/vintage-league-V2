-- Migration: CC-S1 — Payments hardening schema (prepares S2 checkout/webhook
--            hardening and S3 Stripe Connect Express with 5 % application fee)
--
-- Purpose:
--   1. public.stripe_events — idempotency log for Stripe webhook events
--      (service role only; the webhook inserts event.id before processing and
--      skips events it has already seen).
--   2. public.transactions — new lifecycle columns (livemode, checkout_expires_at,
--      stripe_payment_intent_id, updated_at), extended status set
--      ('pending','completed','refunded','expired','failed'), and a partial
--      UNIQUE index that allows at most ONE active (pending or completed) sale
--      per jersey — the database-level guard against double-selling.
--   3. public.seller_payout_accounts — Stripe Connect Express account per seller
--      (separate from the publicly readable profiles table). Only the service
--      role writes; owner and admins can read. public.seller_can_receive_payments()
--      exposes a plain boolean for the "Sofort kaufen" button.
--
-- Design notes:
--   - status stays TEXT + CHECK (project convention, see VINA-242 / VINA-390).
--     The original inline CHECK was auto-named "transactions_status_check"; to be
--     robust against a differently named constraint in production, every CHECK
--     constraint on transactions whose definition references "status" is dropped
--     and a single named constraint "transactions_status_check" is re-created.
--   - stripe_session_id stays UNIQUE NOT NULL (S2 inserts the pending row only
--     after the Checkout Session was created, so the id is always known).
--   - Stripe Connect data lives in its own table, NOT on profiles, because
--     profiles is readable by anon + authenticated (VINA-224/264). Writes are
--     service-role only simply by having no write policies/grants for users —
--     no column-guard trigger needed.
--   - Wrapped in a single transaction: if anything fails (e.g. the duplicate-sale
--     safety check), NOTHING is applied.
--
-- DO NOT run supabase db push without Guido's explicit approval.
-- Guido runs this manually in the Supabase SQL editor
-- (see docs/payments-migration-howto.md).

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. stripe_events — webhook idempotency log (service role only)
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id           TEXT        PRIMARY KEY,            -- Stripe event id (evt_…)
  type         TEXT        NOT NULL,
  livemode     BOOLEAN     NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error        TEXT
);

-- Lookups of unprocessed / failed events for retries and monitoring.
CREATE INDEX IF NOT EXISTS idx_stripe_events_unprocessed
  ON public.stripe_events (received_at)
  WHERE processed_at IS NULL;

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- Intentionally NO policies: anon/authenticated must never read or write this
-- table. The service role bypasses RLS.

REVOKE ALL ON public.stripe_events FROM anon, authenticated;
-- Explicit service_role grants (see VINA-417: bypassing RLS still requires
-- table-level privileges).
GRANT SELECT, INSERT, UPDATE ON public.stripe_events TO service_role;

COMMENT ON TABLE  public.stripe_events IS
  'CC-S1: Idempotency log of received Stripe webhook events. Service role only (RLS on, no policies).';
COMMENT ON COLUMN public.stripe_events.id IS
  'Stripe event id (evt_…). Primary key → a duplicate delivery of the same event fails on INSERT and is skipped.';
COMMENT ON COLUMN public.stripe_events.type IS
  'Stripe event type, e.g. checkout.session.completed, checkout.session.expired, charge.refunded, account.updated.';
COMMENT ON COLUMN public.stripe_events.livemode IS
  'Stripe event.livemode: true = live mode, false = test mode.';
COMMENT ON COLUMN public.stripe_events.received_at IS
  'When the webhook first received (and stored) this event.';
COMMENT ON COLUMN public.stripe_events.processed_at IS
  'When processing finished successfully. NULL = not (yet) processed or failed.';
COMMENT ON COLUMN public.stripe_events.error IS
  'Last processing error message, if any. NULL on success.';


-- ════════════════════════════════════════════════════════════════════════════
-- 2. transactions — lifecycle columns, status set, one active sale per jersey
-- ════════════════════════════════════════════════════════════════════════════

-- 2a. New columns
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS livemode                 BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checkout_expires_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_at               TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON COLUMN public.transactions.livemode IS
  'CC-S1: true if created with live Stripe keys, false for test mode. Existing rows default to false.';
COMMENT ON COLUMN public.transactions.checkout_expires_at IS
  'CC-S1: Expiry of the Stripe Checkout Session (session.expires_at). A pending row past this time can be swept to status=expired, freeing the jersey.';
COMMENT ON COLUMN public.transactions.stripe_payment_intent_id IS
  'CC-S1: Stripe PaymentIntent id (pi_…) once known — used to match refund/dispute events to the transaction.';
COMMENT ON COLUMN public.transactions.updated_at IS
  'CC-S1: Last modification time, maintained by trigger update_transactions_updated_at.';

-- 2b. updated_at trigger (existing helper public.update_updated_at_column())
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2c. Replace the status CHECK constraint
--     Original (VINA-242, inline, auto-named transactions_status_check):
--       CHECK (status IN ('pending', 'completed', 'refunded'))
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.transactions'::regclass
      AND contype  = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;
END;
$$;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_status_check
  CHECK (status IN ('pending', 'completed', 'refunded', 'expired', 'failed'));

COMMENT ON COLUMN public.transactions.status IS
  'pending = checkout session open; completed = paid; refunded = money returned; expired = checkout session expired unpaid; failed = payment failed. Only pending/completed count as an "active sale" (see transactions_one_active_sale_per_jersey).';

-- 2d. Safety check BEFORE the unique index: abort with a readable message if
--     existing data already has more than one pending/completed row per jersey.
DO $$
DECLARE
  dup_list  TEXT;
  dup_count INTEGER;
BEGIN
  SELECT count(*),
         string_agg(format('jersey_id=%s (%s rows: %s)', jersey_id, n, ids), E'\n  ')
    INTO dup_count, dup_list
  FROM (
    SELECT jersey_id,
           count(*) AS n,
           string_agg(id::text || ' [' || status || ']', ', ' ORDER BY created_at) AS ids
    FROM public.transactions
    WHERE status IN ('pending', 'completed')
    GROUP BY jersey_id
    HAVING count(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION USING
      MESSAGE = format(
        'CC-S1 ABGEBROCHEN / ABORTED: %s Trikot(s) haben bereits mehr als einen aktiven Verkauf (pending/completed). '
        'Die Regel "ein aktiver Verkauf pro Trikot" kann erst angelegt werden, wenn diese Daten bereinigt sind. '
        'Es wurde NICHTS geaendert. / %s jersey(s) already have more than one active (pending/completed) sale. '
        'Nothing was changed.%s  %s',
        dup_count, dup_count, E'\n', dup_list),
      HINT = 'Siehe docs/payments-migration-howto.md, Abschnitt "Sicherheitsfehler". Nicht selbst loeschen — die Liste an die Pipeline/Claude geben.';
  END IF;
END;
$$;

-- 2e. At most ONE active (pending or completed) sale per jersey.
CREATE UNIQUE INDEX IF NOT EXISTS transactions_one_active_sale_per_jersey
  ON public.transactions (jersey_id)
  WHERE status IN ('pending', 'completed');

COMMENT ON INDEX public.transactions_one_active_sale_per_jersey IS
  'CC-S1: DB-level guard against double-selling — at most one pending or completed transaction per jersey.';

-- 2f. Index for the expiry sweep (pending rows whose checkout has expired).
CREATE INDEX IF NOT EXISTS idx_transactions_status_checkout_expires_at
  ON public.transactions (status, checkout_expires_at);

-- 2g. Lookup by PaymentIntent (refund / dispute webhook events).
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id
  ON public.transactions (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- 2h. Explicit service_role grants (VINA-417 lesson; idempotent no-op if held).
GRANT SELECT, INSERT, UPDATE ON public.transactions TO service_role;


-- ════════════════════════════════════════════════════════════════════════════
-- 3. seller_payout_accounts — Stripe Connect Express accounts (service role writes)
-- ════════════════════════════════════════════════════════════════════════════
-- Separate table instead of columns on profiles: profiles is publicly readable
-- (anon + authenticated SELECT USING (true)), this table is NOT.
-- profiles.id is the auth uid (profiles.id REFERENCES auth.users(id)).
CREATE TABLE IF NOT EXISTS public.seller_payout_accounts (
  user_id           UUID        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_account_id TEXT        UNIQUE NOT NULL,
  charges_enabled   BOOLEAN     NOT NULL DEFAULT false,
  payouts_enabled   BOOLEAN     NOT NULL DEFAULT false,
  details_submitted BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_seller_payout_accounts_updated_at ON public.seller_payout_accounts;
CREATE TRIGGER update_seller_payout_accounts_updated_at
  BEFORE UPDATE ON public.seller_payout_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.seller_payout_accounts ENABLE ROW LEVEL SECURITY;

-- Owner can read their own payout account (onboarding status in settings).
DROP POLICY IF EXISTS "Owners can view own payout account" ON public.seller_payout_accounts;
CREATE POLICY "Owners can view own payout account"
  ON public.seller_payout_accounts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all payout accounts (support / verification).
DROP POLICY IF EXISTS "Admins can view all payout accounts" ON public.seller_payout_accounts;
CREATE POLICY "Admins can view all payout accounts"
  ON public.seller_payout_accounts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Intentionally NO INSERT/UPDATE/DELETE policies: only the service role
-- (Connect onboarding Edge Function + account.updated webhook) writes here.
REVOKE ALL ON public.seller_payout_accounts FROM anon;
REVOKE ALL ON public.seller_payout_accounts FROM authenticated;
GRANT SELECT ON public.seller_payout_accounts TO authenticated;
GRANT ALL ON public.seller_payout_accounts TO service_role;

COMMENT ON TABLE public.seller_payout_accounts IS
  'CC-S1: Stripe Connect Express account per seller. Written only by the service role; readable by the owner and admins. Public checks go through seller_can_receive_payments().';
COMMENT ON COLUMN public.seller_payout_accounts.user_id IS
  'CC-S1: Seller = profiles.id (= auth.users.id). One payout account per seller.';
COMMENT ON COLUMN public.seller_payout_accounts.stripe_account_id IS
  'CC-S1: Stripe Connect Express account id (acct_…). Set by the onboarding Edge Function (service role).';
COMMENT ON COLUMN public.seller_payout_accounts.charges_enabled IS
  'CC-S1: Mirror of Stripe account.charges_enabled (account.updated webhook).';
COMMENT ON COLUMN public.seller_payout_accounts.payouts_enabled IS
  'CC-S1: Mirror of Stripe account.payouts_enabled (account.updated webhook).';
COMMENT ON COLUMN public.seller_payout_accounts.details_submitted IS
  'CC-S1: Mirror of Stripe account.details_submitted — seller finished the Stripe onboarding form.';
COMMENT ON COLUMN public.seller_payout_accounts.created_at IS
  'CC-S1: When the payout account row was created.';
COMMENT ON COLUMN public.seller_payout_accounts.updated_at IS
  'CC-S1: Last modification time, maintained by trigger update_seller_payout_accounts_updated_at.';

-- Public yes/no check used by the frontend to decide whether "Sofort kaufen"
-- is shown. Exposes only a boolean, never the account id.
CREATE OR REPLACE FUNCTION public.seller_can_receive_payments(p_seller UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT charges_enabled AND payouts_enabled
     FROM public.seller_payout_accounts
     WHERE user_id = p_seller),
    false
  )
$$;

REVOKE ALL ON FUNCTION public.seller_can_receive_payments(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seller_can_receive_payments(UUID) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.seller_can_receive_payments(UUID) IS
  'CC-S1: true if the seller has a Stripe Connect account with charges AND payouts enabled; false otherwise (incl. no account). Frontend uses it to show/hide "Sofort kaufen".';

COMMIT;


-- ── Verification queries (run after applying) ───────────────────────────────
--   SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'transactions'
--   ORDER BY ordinal_position;
--
--   SELECT tablename, policyname, cmd, roles FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'seller_payout_accounts';
--
--   SELECT public.seller_can_receive_payments(gen_random_uuid());  -- expect false
--
--   SELECT indexname, indexdef FROM pg_indexes
--   WHERE schemaname = 'public' AND tablename = 'transactions';
--
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid = 'public.transactions'::regclass AND contype = 'c';
--
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' AND tablename IN ('stripe_events', 'seller_payout_accounts');


-- ════════════════════════════════════════════════════════════════════════════
-- DOWN / ROLLBACK (commented out — run manually only if needed)
-- ════════════════════════════════════════════════════════════════════════════
-- WARNING: Rollback fails at step "status CHECK" if rows with status
-- 'expired' or 'failed' exist; migrate/delete those first. Dropping columns/tables
-- permanently deletes their data (incl. connected seller Stripe accounts).
--
-- BEGIN;
--
-- -- 3. seller_payout_accounts
-- DROP FUNCTION IF EXISTS public.seller_can_receive_payments(UUID);
-- DROP TABLE IF EXISTS public.seller_payout_accounts;
--
-- -- 2. transactions
-- DROP INDEX IF EXISTS public.idx_transactions_stripe_payment_intent_id;
-- DROP INDEX IF EXISTS public.idx_transactions_status_checkout_expires_at;
-- DROP INDEX IF EXISTS public.transactions_one_active_sale_per_jersey;
-- ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
-- ALTER TABLE public.transactions
--   ADD CONSTRAINT transactions_status_check
--   CHECK (status IN ('pending', 'completed', 'refunded'));
-- DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
-- ALTER TABLE public.transactions
--   DROP COLUMN IF EXISTS updated_at,
--   DROP COLUMN IF EXISTS stripe_payment_intent_id,
--   DROP COLUMN IF EXISTS checkout_expires_at,
--   DROP COLUMN IF EXISTS livemode;
-- COMMENT ON COLUMN public.transactions.status IS NULL;
--
-- -- 1. stripe_events
-- DROP TABLE IF EXISTS public.stripe_events;
--
-- COMMIT;
