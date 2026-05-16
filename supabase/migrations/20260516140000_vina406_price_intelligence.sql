-- Migration: VINA-406 — Create jersey_price_references table + RLS + get_price_intelligence() DB function
--
-- Purpose:
--   Builds the full database foundation for the Price Intelligence System (Wave 1).
--   Provides scraper-populated market data and a DB function the frontend can call
--   to get weighted fair-value estimates for a given jersey.
--
-- Table design:
--   - jersey_price_references stores completed sales scraped from external sources.
--   - price is stored as sale_price_cents (INTEGER, EUR-centimes) for Stripe
--     compatibility and to avoid floating-point rounding.
--   - league TEXT column added (beyond the minimal spec) to support the Broad
--     matching tier: "same league + same era → weight 1".
--
-- RLS policy:
--   - Authenticated users: SELECT (price data is available to logged-in users).
--   - Service role: INSERT/UPDATE/DELETE — bypasses RLS automatically in Supabase;
--     no explicit INSERT policy is created so unauthenticated callers cannot write.
--
-- Function: get_price_intelligence()
--   Weighted comparable-sales model:
--     3 = Exact  — same team + same decade + same condition
--     2 = Fuzzy  — same team + year within ±5
--     1 = Broad  — same league + year within ±10 (league auto-detected from data)
--   Returns NULL values if fewer than 3 comparable sales match.
--   Optional p_listing_price_cents enables smart_buy_discount_pct calculation.
--
-- DO NOT run supabase db push without Guido's explicit approval.

-- ── Table: jersey_price_references ──────────────────────────────────────────────
CREATE TABLE public.jersey_price_references (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team             TEXT        NOT NULL,
  league           TEXT,                                -- e.g. 'Premier League', 'Bundesliga'
  season           TEXT,                                -- e.g. '1997/98'
  year             INT,                                 -- e.g. 1997
  condition        TEXT,                                -- e.g. 'mint', 'good', 'fair'
  size             TEXT,                                -- e.g. 'M', 'L', 'XL'
  sale_price_cents INT         NOT NULL CHECK (sale_price_cents > 0),
  currency         TEXT        NOT NULL DEFAULT 'EUR',
  sale_date        DATE,
  source_url       TEXT        UNIQUE,
  scraped_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────────
-- Primary lookup for exact/fuzzy queries (team + year filter).
CREATE INDEX idx_jpr_team_year
  ON public.jersey_price_references (team, year)
  WHERE year IS NOT NULL;

-- Broad-tier lookup (league + year filter).
CREATE INDEX idx_jpr_league_year
  ON public.jersey_price_references (league, year)
  WHERE league IS NOT NULL AND year IS NOT NULL;

-- ── Row-Level Security ────────────────────────────────────────────────────────────
ALTER TABLE public.jersey_price_references ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read price reference data.
CREATE POLICY "Authenticated users can read price references"
  ON public.jersey_price_references
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE are intentionally not granted to any role via policy.
-- The service role (Python scraper) bypasses RLS in Supabase and can write directly.

-- ── Grants ────────────────────────────────────────────────────────────────────────
GRANT SELECT ON public.jersey_price_references TO authenticated;

-- ── Function: get_price_intelligence ─────────────────────────────────────────────
--
-- Signature (extended from spec to support smart-buy calculation):
--   get_price_intelligence(
--     p_team                TEXT,
--     p_year                INT,
--     p_condition           TEXT DEFAULT NULL,
--     p_size                TEXT DEFAULT NULL,
--     p_listing_price_cents INT  DEFAULT NULL   -- current listing; enables smart_buy_discount_pct
--   )
--
-- Returns one row:
--   fair_value_cents       INT  — weighted median of comparable sales
--   price_range_low        INT  — 25th percentile (weighted)
--   price_range_high       INT  — 75th percentile (weighted)
--   comparable_sales_count INT  — number of raw (pre-expansion) matching sales
--   smart_buy_discount_pct INT  — % below fair value; NULL if no listing price or not a smart buy
--
-- All INT columns are NULL when comparable_sales_count < 3.
--
-- Weighted matching tiers:
--   Tier 1 (weight 3) — Exact:  same team + same decade + condition matches (if provided)
--   Tier 2 (weight 2) — Fuzzy:  same team + |year - p_year| ≤ 5 (any condition)
--   Tier 3 (weight 1) — Broad:  same league (auto-detected) + |year - p_year| ≤ 10
--
-- SECURITY INVOKER: runs as the calling user so Supabase RLS applies to the
-- underlying table SELECT (authenticated users only, per policy above).

CREATE OR REPLACE FUNCTION public.get_price_intelligence(
  p_team                TEXT,
  p_year                INT,
  p_condition           TEXT DEFAULT NULL,
  p_size                TEXT DEFAULT NULL,
  p_listing_price_cents INT  DEFAULT NULL
)
RETURNS TABLE (
  fair_value_cents       INT,
  price_range_low        INT,
  price_range_high       INT,
  comparable_sales_count INT,
  smart_buy_discount_pct INT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_decade   INT := p_year / 10;
  v_league   TEXT;
  v_count    INT;
  v_median   INT;
  v_p25      INT;
  v_p75      INT;
  v_discount INT;
BEGIN
  -- Auto-detect the league for this team from existing reference data.
  -- Used for Broad-tier matching without requiring the caller to pass a league.
  SELECT DISTINCT r.league INTO v_league
  FROM public.jersey_price_references r
  WHERE r.team = p_team AND r.league IS NOT NULL
  LIMIT 1;

  -- Count distinct comparable sales (pre-expansion) for the output diagnostic field.
  SELECT COUNT(*)::INT INTO v_count
  FROM public.jersey_price_references r
  WHERE r.year IS NOT NULL
    AND (
      -- Exact tier
      (r.team = p_team
        AND (r.year / 10) = v_decade
        AND (p_condition IS NULL OR r.condition = p_condition))
      OR
      -- Fuzzy tier (superset: also covers exact decade rows with non-matching condition)
      (r.team = p_team AND ABS(r.year - p_year) <= 5)
      OR
      -- Broad tier
      (v_league IS NOT NULL
        AND r.league = v_league
        AND ABS(r.year - p_year) <= 10)
    );

  -- Return early with nulls when there is not enough data.
  IF v_count < 3 THEN
    RETURN QUERY SELECT NULL::INT, NULL::INT, NULL::INT, v_count, NULL::INT;
    RETURN;
  END IF;

  -- Compute weighted percentiles.
  -- Each matching row is duplicated `weight` times in the `expanded` CTE so that
  -- higher-confidence tiers pull the distribution toward their price cluster.
  WITH candidates AS (
    SELECT
      r.sale_price_cents,
      CASE
        -- Exact: same team + same decade + condition matches
        WHEN r.team = p_team
          AND (r.year / 10) = v_decade
          AND (p_condition IS NULL OR r.condition = p_condition)
          THEN 3
        -- Fuzzy: same team + within ±5 years
        WHEN r.team = p_team AND ABS(r.year - p_year) <= 5
          THEN 2
        -- Broad: same league + same era
        ELSE 1
      END AS weight
    FROM public.jersey_price_references r
    WHERE r.year IS NOT NULL
      AND (
        (r.team = p_team
          AND (r.year / 10) = v_decade
          AND (p_condition IS NULL OR r.condition = p_condition))
        OR (r.team = p_team AND ABS(r.year - p_year) <= 5)
        OR (v_league IS NOT NULL
          AND r.league = v_league
          AND ABS(r.year - p_year) <= 10)
      )
  ),
  expanded AS (
    -- Expand each row by its weight to produce a weighted distribution.
    SELECT c.sale_price_cents
    FROM candidates c
    CROSS JOIN generate_series(1, c.weight) AS gs
  )
  SELECT
    PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY sale_price_cents)::INT,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY sale_price_cents)::INT,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY sale_price_cents)::INT
  INTO v_median, v_p25, v_p75
  FROM expanded;

  -- Smart-buy discount: how far below the fair value is the current listing?
  -- Only populated when a listing price is provided and it is below the median.
  IF p_listing_price_cents IS NOT NULL
    AND v_median IS NOT NULL
    AND p_listing_price_cents < v_median
  THEN
    v_discount := ((v_median - p_listing_price_cents) * 100) / v_median;
  ELSE
    v_discount := NULL;
  END IF;

  RETURN QUERY SELECT v_median, v_p25, v_p75, v_count, v_discount;
END;
$$;

-- Grant EXECUTE to authenticated so the function can be called from the
-- Supabase client SDK on the frontend.
GRANT EXECUTE
  ON FUNCTION public.get_price_intelligence(TEXT, INT, TEXT, TEXT, INT)
  TO authenticated;

-- ── Verification queries ──────────────────────────────────────────────────────────
-- Run after applying to confirm expected state:
--
-- Table exists + RLS enabled:
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public' AND tablename = 'jersey_price_references';
--
-- RLS policies:
--   SELECT policyname, cmd, roles
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'jersey_price_references';
--
-- Indexes:
--   SELECT indexname, indexdef
--   FROM pg_indexes
--   WHERE schemaname = 'public' AND tablename = 'jersey_price_references';
--
-- Function exists:
--   SELECT proname, prosrc
--   FROM pg_proc
--   WHERE proname = 'get_price_intelligence' AND pronamespace = 'public'::regnamespace;
--
-- Smoke test (no data — expect count=0 and all nulls):
--   SELECT * FROM get_price_intelligence('FC Bayern München', 1997, 'mint');
