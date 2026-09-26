-- CC-DB0 — Schema-Abgleich Repo ↔ Produktion (26.09.2026)
--
-- Befund (Abfrage gegen Projekt napzgxpxkoiujjqwtzvz am 26.09.2026):
-- Fünf Repo-Migrationen wurden in Produktion nie ausgeführt:
--   20260504160000_admin_rls_is_admin                 → is_admin(), profiles.is_admin, Prüf-Schutz-Trigger
--   20260504140000_trade_ratings_and_average_rating    → trade_ratings, profiles.average_rating
--   20260504150000_create_sales_history                → sales_history + Trigger + RPC
--   20260505020000_add_trade_confirmations_tracking    → trade_confirmations
--   20260506000000_vina244_create_jersey_sold_notifications → jersey_sold_notifications
-- (20260504154917_create_user_favorites wird bewusst NICHT nachgezogen — im Code ungenutzt, ersetzt durch jersey_favorites.)
--
-- Außerdem: In diesem Projekt vergibt Postgres für neue Tabellen KEINE Standardrechte an
-- anon/authenticated/service_role (default ACL nur Dxtm). Daher hier explizite GRANTs.
-- Und: service_role fehlten Schreibrechte auf transactions/user_jerseys/profiles/trade_requests,
-- die der Stripe-Webhook und die Edge Functions brauchen.
--
-- Die Datei ist idempotent (mehrfach ausführbar) und läuft komplett in einer Transaktion.
-- Das Setzen von Admin-Konten ist bewusst NICHT Teil dieser Datei (keine personenbezogenen Daten im Repo).

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Admin: profiles.is_admin, is_admin(), Admin-Policy, Prüf-Schutz
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Admins can update any jersey" ON public.user_jerseys;
CREATE POLICY "Admins can update any jersey"
  ON public.user_jerseys FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Prüf-Felder dürfen nur Admins ändern. Abweichung zum Repo-Original: Die Server-Rolle
-- (Edge Functions) und direkte SQL-Sitzungen ohne JWT (SQL Editor) sind ebenfalls erlaubt.
CREATE OR REPLACE FUNCTION public.check_verification_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    NEW.verification_status IS DISTINCT FROM OLD.verification_status OR
    NEW.verified_at IS DISTINCT FROM OLD.verified_at OR
    NEW.verified_by IS DISTINCT FROM OLD.verified_by
  )
  AND NOT public.is_admin()
  AND COALESCE(auth.role(), 'none') NOT IN ('service_role', 'none') THEN
    RAISE EXCEPTION 'Nur Admins dürfen den Prüfstatus ändern (verification_status, verified_at, verified_by).'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_verification_admin_only ON public.user_jerseys;
CREATE TRIGGER enforce_verification_admin_only
  BEFORE UPDATE ON public.user_jerseys
  FOR EACH ROW EXECUTE FUNCTION public.check_verification_update();

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(id) WHERE is_admin = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tausch-Bewertungen
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trade_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trade_requests(id),
  rater_user_id uuid NOT NULL REFERENCES auth.users(id),
  rated_user_id uuid NOT NULL REFERENCES auth.users(id),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trade_id, rater_user_id)
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS average_rating numeric(3,2);

ALTER TABLE public.trade_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read trade_ratings" ON public.trade_ratings;
CREATE POLICY "Public read trade_ratings"
  ON public.trade_ratings FOR SELECT
  USING (true);
DROP POLICY IF EXISTS "Authenticated users insert own ratings" ON public.trade_ratings;
CREATE POLICY "Authenticated users insert own ratings"
  ON public.trade_ratings FOR INSERT TO authenticated
  WITH CHECK (rater_user_id = auth.uid());

GRANT SELECT ON public.trade_ratings TO anon, authenticated;
GRANT INSERT ON public.trade_ratings TO authenticated;
GRANT ALL ON public.trade_ratings TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Verkaufshistorie (Tausch-Abschlüsse) + RPC
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sales_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jersey_id uuid NOT NULL REFERENCES public.user_jerseys(id),
  seller_user_id uuid NOT NULL REFERENCES auth.users(id),
  buyer_user_id uuid REFERENCES auth.users(id),
  sale_price_cents integer NOT NULL,
  team text NOT NULL,
  league text NOT NULL,
  year text NOT NULL,
  condition smallint NOT NULL,
  sold_at timestamptz NOT NULL DEFAULT now(),
  trade_request_id uuid REFERENCES public.trade_requests(id)
);

ALTER TABLE public.sales_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read sales_history" ON public.sales_history;
CREATE POLICY "Public read sales_history"
  ON public.sales_history FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_sales_history_team_year ON public.sales_history(team, year);
CREATE INDEX IF NOT EXISTS idx_sales_history_sold_at ON public.sales_history(sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_history_jersey_id ON public.sales_history(jersey_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_seller ON public.sales_history(seller_user_id);

GRANT SELECT ON public.sales_history TO anon, authenticated;
GRANT ALL ON public.sales_history TO service_role;

CREATE OR REPLACE FUNCTION public.record_completed_trade_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_jersey   public.user_jerseys%ROWTYPE;
  v_buyer_user_id  uuid;
BEGIN
  IF NEW.status::text <> 'completed' OR OLD.status::text = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_owner_jersey FROM public.user_jerseys WHERE id = NEW.owner_jersey_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_buyer_user_id FROM public.user_jerseys WHERE id = NEW.requester_jersey_id;

  INSERT INTO public.sales_history (
    jersey_id, seller_user_id, buyer_user_id, sale_price_cents,
    team, league, year, condition, sold_at, trade_request_id
  ) VALUES (
    v_owner_jersey.id, v_owner_jersey.user_id, v_buyer_user_id,
    COALESCE(v_owner_jersey.sale_price_cents, v_owner_jersey.price_cents, 0),
    v_owner_jersey.team, v_owner_jersey.league, v_owner_jersey.year, v_owner_jersey.condition,
    now(), NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_trade_request_completed ON public.trade_requests;
CREATE TRIGGER on_trade_request_completed
  AFTER UPDATE OF status ON public.trade_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.record_completed_trade_sale();

CREATE OR REPLACE FUNCTION public.get_recent_sales_by_team_year(
  p_team text,
  p_year text,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  jersey_id uuid,
  sale_price_cents integer,
  team text,
  league text,
  year text,
  condition smallint,
  sold_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sh.id, sh.jersey_id, sh.sale_price_cents, sh.team, sh.league, sh.year, sh.condition, sh.sold_at
  FROM public.sales_history sh
  WHERE sh.team = p_team AND sh.year = p_year
  ORDER BY sh.sold_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_recent_sales_by_team_year(text, text, int) TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Tausch-Bestätigungen (beide Seiten bestätigen den Erhalt)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trade_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trade_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confirmed_at timestamptz DEFAULT now(),
  UNIQUE (trade_id, user_id)
);

ALTER TABLE public.trade_confirmations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own confirmations" ON public.trade_confirmations;
CREATE POLICY "Users can insert their own confirmations"
  ON public.trade_confirmations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Anyone authenticated can read confirmations" ON public.trade_confirmations;
CREATE POLICY "Anyone authenticated can read confirmations"
  ON public.trade_confirmations FOR SELECT TO authenticated
  USING (true);

GRANT SELECT, INSERT ON public.trade_confirmations TO authenticated;
GRANT ALL ON public.trade_confirmations TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Benachrichtigungen zu Verkäufen / Geboten
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jersey_sold_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'jersey_sold',
  jersey_id uuid NOT NULL REFERENCES public.user_jerseys(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jersey_sold_notifications_recipient
  ON public.jersey_sold_notifications(recipient_id, created_at DESC);

ALTER TABLE public.jersey_sold_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Recipients can select own notifications" ON public.jersey_sold_notifications;
CREATE POLICY "Recipients can select own notifications"
  ON public.jersey_sold_notifications FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);

GRANT SELECT ON public.jersey_sold_notifications TO authenticated;
GRANT ALL ON public.jersey_sold_notifications TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Rechte der Server-Rolle (Edge Functions / Stripe-Webhook)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON public.transactions TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_jerseys TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.trade_requests TO service_role;

COMMIT;
