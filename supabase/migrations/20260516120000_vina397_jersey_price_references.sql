-- VINA-397: Create jersey_price_references table + RLS + get_price_intelligence() DB function
-- Migration for the Price Intelligence System (Wave 1)

-- =========================================================
-- 1. jersey_price_references table
-- =========================================================
CREATE TABLE public.jersey_price_references (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team          TEXT        NOT NULL,
  season        TEXT,
  year          INT,
  condition     TEXT,
  size          TEXT,
  sale_price_cents INT      NOT NULL,
  currency      TEXT        NOT NULL DEFAULT 'EUR',
  sale_date     DATE,
  source_url    TEXT        UNIQUE,
  scraped_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.jersey_price_references IS
  'Historical reference sales used by the Price Intelligence System to compute fair-value estimates.';

-- =========================================================
-- 2. Row Level Security
-- =========================================================
ALTER TABLE public.jersey_price_references ENABLE ROW LEVEL SECURITY;

-- INSERT: service role only (scrapers / backend processes)
-- No explicit policy needed for service_role — it bypasses RLS by default.
-- We add a DENY-all policy for authenticated/anon to be explicit.

-- SELECT: authenticated users may read reference data
CREATE POLICY "authenticated_select_jersey_price_references"
  ON public.jersey_price_references
  FOR SELECT
  TO authenticated
  USING (true);

-- Anon users: no access (default deny)

-- =========================================================
-- 3. get_price_intelligence() DB function
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_price_intelligence(
  p_team      TEXT,
  p_year      INT,
  p_condition TEXT DEFAULT NULL,
  p_size      TEXT DEFAULT NULL
)
RETURNS TABLE (
  fair_value_cents        INT,
  price_range_low         INT,
  price_range_high        INT,
  comparable_sales_count  INT,
  smart_buy_discount_pct  INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_decade         INT;
  v_era_start      INT;
  v_era_end        INT;
  v_min_comparables INT := 3;
BEGIN
  -- Decade for exact matching (e.g. year 1994 → decade 1990)
  v_decade   := (p_year / 10) * 10;
  -- Era window for fuzzy matching: ±5 years
  v_era_start := p_year - 5;
  v_era_end   := p_year + 5;

  RETURN QUERY
  WITH weighted_sales AS (
    SELECT
      r.sale_price_cents,
      CASE
        -- Exact: same team + same decade + same condition (if provided)
        WHEN r.team = p_team
          AND (r.year / 10) * 10 = v_decade
          AND (p_condition IS NULL OR r.condition = p_condition)
          THEN 3
        -- Fuzzy: same team + within ±5 years
        WHEN r.team = p_team
          AND r.year BETWEEN v_era_start AND v_era_end
          THEN 2
        -- Broad: same team, any year (catch-all for same team + era)
        WHEN r.team = p_team
          THEN 1
        ELSE 0
      END AS weight
    FROM public.jersey_price_references r
    WHERE
      -- Only rows that match at least one tier
      r.team = p_team
      -- Optional size filter (when provided, limit to matching size or NULLs)
      AND (p_size IS NULL OR r.size IS NULL OR r.size = p_size)
  ),
  -- Expand rows by weight so percentile functions give correct weighting
  expanded AS (
    SELECT
      ws.sale_price_cents,
      ws.weight,
      generate_series(1, ws.weight) AS _series   -- repeat row `weight` times
    FROM weighted_sales ws
    WHERE ws.weight > 0
  ),
  aggregates AS (
    SELECT
      COUNT(*)::INT                                               AS cnt,
      PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY sale_price_cents)::INT AS median_price,
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY sale_price_cents)::INT AS p25_price,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY sale_price_cents)::INT AS p75_price
    FROM expanded
  )
  SELECT
    CASE WHEN agg.cnt >= v_min_comparables THEN agg.median_price ELSE NULL END,
    CASE WHEN agg.cnt >= v_min_comparables THEN agg.p25_price    ELSE NULL END,
    CASE WHEN agg.cnt >= v_min_comparables THEN agg.p75_price    ELSE NULL END,
    agg.cnt,
    -- smart_buy_discount_pct: only meaningful when listing price < fair value
    -- (NULL returned here; callers pass the current listing price for comparison)
    NULL::INT
  FROM aggregates agg;
END;
$$;

COMMENT ON FUNCTION public.get_price_intelligence(TEXT, INT, TEXT, TEXT) IS
  'Returns weighted price intelligence (median, IQR, comparable count) for a jersey '
  'described by team + year. Uses a three-tier matching strategy: '
  'exact (team+decade+condition, weight 3), fuzzy (team ±5 years, weight 2), '
  'broad (team any year, weight 1). Returns NULL row fields when < 3 comparables found.';

-- Grant EXECUTE to authenticated role so the frontend can call it via RPC
GRANT EXECUTE ON FUNCTION public.get_price_intelligence(TEXT, INT, TEXT, TEXT) TO authenticated;
