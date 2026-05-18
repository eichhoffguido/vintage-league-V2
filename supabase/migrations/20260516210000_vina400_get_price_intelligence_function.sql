-- Migration: VINA-400 — Create get_price_intelligence() DB function
--
-- IMPORTANT: The jersey_price_references table already exists in production
-- (22,500+ records created by Guido). This migration adds ONLY the function.
-- Do NOT re-create or modify the table.
--
-- Function: get_price_intelligence()
--   Weighted comparable-sales model using two matching tiers:
--     Weight 3 = Exact  — same team + same decade + condition matches (if provided)
--     Weight 2 = Fuzzy  — same team + year within ±5 (any condition)
--
--   Returns NULL values for all price columns when fewer than 3 comparable
--   sales are found.
--
-- Return columns match the PriceIntelligence.tsx frontend component (VINA-408):
--   fair_value_mid_cents  — weighted median of comparable sales
--   fair_value_min_cents  — 25th percentile (weighted)
--   fair_value_max_cents  — 75th percentile (weighted)
--   comparable_count      — number of raw (pre-expansion) matching sales
--
-- SECURITY INVOKER: runs as the calling user so Supabase RLS applies to the
-- underlying jersey_price_references table SELECT.
--
-- DO NOT run supabase db push without Guido's explicit approval.

CREATE OR REPLACE FUNCTION public.get_price_intelligence(
  p_team      TEXT,
  p_year      INT,
  p_condition TEXT DEFAULT NULL,
  p_size      TEXT DEFAULT NULL
)
RETURNS TABLE (
  fair_value_mid_cents  INT,
  fair_value_min_cents  INT,
  fair_value_max_cents  INT,
  comparable_count      INT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_decade  INT := p_year / 10;
  v_count   INT;
  v_median  INT;
  v_p25     INT;
  v_p75     INT;
BEGIN
  -- Count distinct comparable sales (pre-expansion) for the diagnostic field.
  SELECT COUNT(*)::INT INTO v_count
  FROM public.jersey_price_references r
  WHERE r.year IS NOT NULL
    AND (
      -- Exact tier: same team + same decade + condition matches (if provided)
      (r.team = p_team
        AND (r.year / 10) = v_decade
        AND (p_condition IS NULL OR r.condition = p_condition))
      OR
      -- Fuzzy tier: same team + year within ±5 (any condition)
      (r.team = p_team AND ABS(r.year - p_year) <= 5)
    );

  -- Return early with nulls when there is insufficient data.
  IF v_count < 3 THEN
    RETURN QUERY SELECT NULL::INT, NULL::INT, NULL::INT, v_count;
    RETURN;
  END IF;

  -- Compute weighted percentiles.
  -- Each matching row is duplicated `weight` times in the `expanded` CTE so that
  -- higher-confidence tiers pull the distribution toward their price cluster.
  WITH candidates AS (
    SELECT
      r.sale_price_cents,
      CASE
        -- Exact tier: same team + same decade + condition matches
        WHEN r.team = p_team
          AND (r.year / 10) = v_decade
          AND (p_condition IS NULL OR r.condition = p_condition)
          THEN 3
        -- Fuzzy tier: same team + within ±5 years
        ELSE 2
      END AS weight
    FROM public.jersey_price_references r
    WHERE r.year IS NOT NULL
      AND (
        (r.team = p_team
          AND (r.year / 10) = v_decade
          AND (p_condition IS NULL OR r.condition = p_condition))
        OR (r.team = p_team AND ABS(r.year - p_year) <= 5)
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

  RETURN QUERY SELECT v_median, v_p25, v_p75, v_count;
END;
$$;

-- Grant EXECUTE to authenticated role so the function can be called via the
-- Supabase client SDK (supabase.rpc()) from the frontend.
GRANT EXECUTE
  ON FUNCTION public.get_price_intelligence(TEXT, INT, TEXT, TEXT)
  TO authenticated;

-- ── Verification queries ──────────────────────────────────────────────────────
-- Run after applying to confirm expected state:
--
-- Function exists with correct signature:
--   SELECT proname, pg_get_function_arguments(oid) AS args
--   FROM pg_proc
--   WHERE proname = 'get_price_intelligence'
--     AND pronamespace = 'public'::regnamespace;
--
-- Smoke test (expect comparable_count = 0 if no data, or real data if present):
--   SELECT * FROM get_price_intelligence('FC Bayern München', 1997, 'mint');
