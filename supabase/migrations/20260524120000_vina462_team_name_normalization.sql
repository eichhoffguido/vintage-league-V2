-- Migration: VINA-462 — Team Name Normalization for jersey_price_references
--
-- BACKGROUND:
-- 22,500+ price reference records were scraped from findyourjersey.org using
-- English team names without umlauts (e.g. "Bayern Munich", "Monchengladbach").
-- Our jersey listings use German/canonical names with umlauts
-- (e.g. "FC Bayern München", "Borussia Mönchengladbach").
-- This mismatch causes get_price_intelligence() to return NULL for most German
-- teams despite having data.
--
-- PARTS:
--   1. Create team_name_aliases mapping table (idempotent via IF NOT EXISTS)
--   2. Seed alias rows (idempotent via ON CONFLICT DO NOTHING)
--   3. Back-fill jersey_price_references.team to canonical names
--   4. Replace get_price_intelligence() to resolve via alias table (CREATE OR REPLACE)
--
-- DO NOT run supabase db push without Guido's explicit approval.
-- This file is designed to be run manually in the Supabase SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- PART 1 — Create team_name_aliases table (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.team_name_aliases (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  alias          TEXT        NOT NULL UNIQUE,
  canonical_name TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PART 2 — Seed alias rows (idempotent via ON CONFLICT DO NOTHING)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.team_name_aliases (alias, canonical_name) VALUES
  -- German clubs
  ('Bayern Munich',             'FC Bayern München'),
  ('FC Bayern Munich',          'FC Bayern München'),
  ('Bayern München',            'FC Bayern München'),
  ('Monchengladbach',           'Borussia Mönchengladbach'),
  ('Borussia Monchengladbach',  'Borussia Mönchengladbach'),
  ('Borussia Mönchengladbach',  'Borussia Mönchengladbach'),
  ('Borussia Dortmund',         'Borussia Dortmund'),
  ('Schalke',                   'FC Schalke 04'),
  ('Schalke 04',                'FC Schalke 04'),
  ('Werder Bremen',             'SV Werder Bremen'),
  ('Hamburger SV',              'Hamburger SV'),
  ('HSV',                       'Hamburger SV'),
  ('Stuttgart',                 'VfB Stuttgart'),
  ('VfB Stuttgart',             'VfB Stuttgart'),
  ('Bayer Leverkusen',          'Bayer 04 Leverkusen'),
  ('Eintracht Frankfurt',       'Eintracht Frankfurt'),
  ('1. FC Köln',                '1. FC Köln'),
  ('Koln',                      '1. FC Köln'),
  ('FC Köln',                   '1. FC Köln'),
  ('RB Leipzig',                'RB Leipzig'),
  -- Spanish clubs
  ('Barcelona',                 'FC Barcelona'),
  ('FC Barcelona',              'FC Barcelona'),
  ('Real Madrid',               'Real Madrid CF'),
  ('Atletico Madrid',           'Atlético de Madrid'),
  ('Atletico de Madrid',        'Atlético de Madrid'),
  ('Sevilla',                   'Sevilla FC'),
  ('Valencia',                  'Valencia CF'),
  ('Athletic Bilbao',           'Athletic Club'),
  ('Real Sociedad',             'Real Sociedad'),
  -- Italian clubs
  ('AC Milan',                  'AC Milan'),
  ('Inter Milan',               'Inter Milan'),
  ('Inter',                     'Inter Milan'),
  ('Juventus',                  'Juventus FC'),
  ('Roma',                      'AS Roma'),
  ('AS Roma',                   'AS Roma'),
  ('Lazio',                     'SS Lazio'),
  ('Napoli',                    'SSC Napoli'),
  ('Fiorentina',                'ACF Fiorentina'),
  -- English clubs
  ('Manchester United',         'Manchester United'),
  ('Man United',                'Manchester United'),
  ('Man Utd',                   'Manchester United'),
  ('Manchester City',           'Manchester City'),
  ('Man City',                  'Manchester City'),
  ('Liverpool',                 'Liverpool FC'),
  ('Arsenal',                   'Arsenal FC'),
  ('Chelsea',                   'Chelsea FC'),
  ('Tottenham',                 'Tottenham Hotspur'),
  ('Spurs',                     'Tottenham Hotspur'),
  ('Tottenham Hotspur',         'Tottenham Hotspur'),
  ('Everton',                   'Everton FC'),
  ('Newcastle',                 'Newcastle United'),
  ('Newcastle United',          'Newcastle United'),
  ('Aston Villa',               'Aston Villa'),
  ('West Ham',                  'West Ham United'),
  ('Leeds',                     'Leeds United'),
  ('Leeds United',              'Leeds United'),
  -- French clubs
  ('Paris Saint-Germain',       'Paris Saint-Germain'),
  ('PSG',                       'Paris Saint-Germain'),
  ('Marseille',                 'Olympique de Marseille'),
  ('Olympique Marseille',       'Olympique de Marseille'),
  ('Lyon',                      'Olympique Lyonnais'),
  ('Olympique Lyonnais',        'Olympique Lyonnais'),
  ('Monaco',                    'AS Monaco'),
  -- Dutch clubs
  ('Ajax',                      'AFC Ajax'),
  ('PSV',                       'PSV Eindhoven'),
  ('Feyenoord',                 'Feyenoord'),
  -- Portuguese clubs
  ('Benfica',                   'SL Benfica'),
  ('Porto',                     'FC Porto'),
  ('Sporting',                  'Sporting CP'),
  -- National teams
  ('Germany',                   'Deutschland'),
  ('Deutschland',               'Deutschland'),
  ('France',                    'Frankreich'),
  ('Spain',                     'Spanien'),
  ('Italy',                     'Italien'),
  ('England',                   'England'),
  ('Brazil',                    'Brasilien'),
  ('Argentina',                 'Argentinien'),
  ('Netherlands',               'Niederlande'),
  ('Holland',                   'Niederlande'),
  ('Portugal',                  'Portugal')
ON CONFLICT (alias) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- PART 3 — Back-fill jersey_price_references.team to canonical names
--
-- Idempotent: the WHERE clause guards against re-updating rows that are already
-- canonical (r.team != a.canonical_name).
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE public.jersey_price_references r
SET    team = a.canonical_name
FROM   public.team_name_aliases a
WHERE  r.team = a.alias
  AND  r.team != a.canonical_name;

-- ─────────────────────────────────────────────────────────────────────────────
-- PART 4 — Replace get_price_intelligence() with alias-aware version
--
-- Changes vs. previous version (VINA-400):
--   • Resolves p_team to its canonical name via team_name_aliases before querying
--   • After back-fill (Part 3) all jersey_price_references rows already use
--     canonical names, so the alias lookup mainly helps future resilience when
--     callers pass scraped/alias names directly.
-- ─────────────────────────────────────────────────────────────────────────────

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
  v_decade    INT := p_year / 10;
  v_canonical TEXT;
  v_count     INT;
  v_median    INT;
  v_p25       INT;
  v_p75       INT;
BEGIN
  -- Resolve canonical name via alias table.
  -- If p_team is itself an alias, use the canonical_name; if it is already a
  -- canonical_name (or unknown), COALESCE falls back to p_team unchanged.
  SELECT COALESCE(a.canonical_name, p_team)
  INTO   v_canonical
  FROM   (SELECT p_team AS input_team) t
  LEFT JOIN public.team_name_aliases a
         ON a.alias = p_team OR a.canonical_name = p_team
  LIMIT 1;

  -- Count distinct comparable sales (pre-expansion) for the diagnostic field.
  SELECT COUNT(*)::INT INTO v_count
  FROM   public.jersey_price_references r
  WHERE  r.year IS NOT NULL
    AND (
      -- Exact tier: same canonical team + same decade + condition matches (if provided)
      (r.team = v_canonical
        AND (r.year / 10) = v_decade
        AND (p_condition IS NULL OR r.condition = p_condition))
      OR
      -- Fuzzy tier: same canonical team + year within ±5 (any condition)
      (r.team = v_canonical AND ABS(r.year - p_year) <= 5)
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
        -- Exact tier: same canonical team + same decade + condition matches
        WHEN r.team = v_canonical
          AND (r.year / 10) = v_decade
          AND (p_condition IS NULL OR r.condition = p_condition)
          THEN 3
        -- Fuzzy tier: same canonical team + within ±5 years
        ELSE 2
      END AS weight
    FROM   public.jersey_price_references r
    WHERE  r.year IS NOT NULL
      AND (
        (r.team = v_canonical
          AND (r.year / 10) = v_decade
          AND (p_condition IS NULL OR r.condition = p_condition))
        OR (r.team = v_canonical AND ABS(r.year - p_year) <= 5)
      )
  ),
  expanded AS (
    -- Expand each row by its weight to produce a weighted distribution.
    SELECT c.sale_price_cents
    FROM   candidates c
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

-- Grant EXECUTE to authenticated role (unchanged from VINA-400).
GRANT EXECUTE
  ON FUNCTION public.get_price_intelligence(TEXT, INT, TEXT, TEXT)
  TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES (run manually after applying)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- 1. Check alias table was seeded:
--    SELECT count(*) FROM public.team_name_aliases;
--    -- Expected: 82 rows
--
-- 2. Check how many jersey_price_references rows were back-filled:
--    SELECT team, count(*)
--    FROM   public.jersey_price_references
--    WHERE  team IN ('FC Bayern München', 'Borussia Mönchengladbach')
--    GROUP  BY team;
--
-- 3. Test the function with canonical names:
--    SELECT * FROM get_price_intelligence('FC Bayern München', 1997, NULL, NULL);
--    SELECT * FROM get_price_intelligence('Borussia Mönchengladbach', 2006, NULL, NULL);
--
-- 4. Test the function with alias names (should now also return data):
--    SELECT * FROM get_price_intelligence('Bayern Munich', 1997, NULL, NULL);
--    SELECT * FROM get_price_intelligence('Monchengladbach', 2006, NULL, NULL);
--
-- 5. Confirm function signature:
--    SELECT proname, pg_get_function_arguments(oid) AS args
--    FROM   pg_proc
--    WHERE  proname = 'get_price_intelligence'
--      AND  pronamespace = 'public'::regnamespace;
