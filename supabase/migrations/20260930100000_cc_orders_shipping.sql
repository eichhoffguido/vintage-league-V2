-- CC-ORDERS — „Versendet / Erhalten“ (28.09.2026).
-- Entscheidungen Guido: Lieferung nur nach Deutschland (Stripe Checkout), Sendungsnummer Pflicht,
-- Konto-Löschsperre bis „Erhalten“ (ersetzt die 30 Tage), fehlt die Bestätigung, setzt ein Admin „Erhalten“.
--
-- Reihenfolge: ERST diese Migration ausführen, DANN die Edge Functions create-checkout-session und
-- stripe-webhook deployen (sie schreiben die neuen Spalten), DANN den PR mergen (die Seite liest sie).
--
-- Neue Spalten in bestehender Tabelle erben die Tabellenrechte. Schreiben dürfen Nutzer sie nur über die
-- beiden Funktionen unten (es gibt keine UPDATE-Policy auf transactions).

BEGIN;

-- 1 · Spalten ---------------------------------------------------------------------------------------
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS shipping_name    text,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS shipped_at       timestamptz,
  ADD COLUMN IF NOT EXISTS shipping_carrier text,
  ADD COLUMN IF NOT EXISTS tracking_number  text,
  ADD COLUMN IF NOT EXISTS received_at      timestamptz,
  ADD COLUMN IF NOT EXISTS received_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_shipping_carrier_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_shipping_carrier_check
  CHECK (shipping_carrier IS NULL OR shipping_carrier IN ('dhl', 'deutsche_post', 'hermes', 'dpd', 'gls', 'ups', 'other'));

COMMENT ON COLUMN public.transactions.shipping_address IS 'Lieferadresse aus Stripe Checkout: {line1, line2, postal_code, city, country}';
COMMENT ON COLUMN public.transactions.received_by IS 'Wer „Erhalten“ gesetzt hat: Käufer oder Admin';

-- Trikot-Schnappschuss für bestehende Käufe (Käufer sehen verkaufte Trikots sonst nicht, RLS)
UPDATE public.transactions t
   SET jersey_snapshot = jsonb_build_object(
         'team', j.team, 'name', j.name, 'league', j.league, 'year', j.year,
         'size', j.size, 'condition', j.condition, 'image', COALESCE(j.image_urls[1], j.image_url))
  FROM public.user_jerseys j
 WHERE t.jersey_id = j.id AND t.jersey_snapshot IS NULL AND t.status IN ('completed', 'refunded');

-- 2 · Admins sehen alle Käufe (offene Bestellungen im Admin-Bereich) ---------------------------------
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT TO authenticated USING (public.is_admin());

-- 3 · Verkäufer: als versendet markieren ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_order_shipped(p_transaction_id uuid, p_carrier text, p_tracking_number text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx transactions%ROWTYPE;
  v_tracking text := btrim(COALESCE(p_tracking_number, ''));
BEGIN
  SELECT * INTO v_tx FROM transactions WHERE id = p_transaction_id FOR UPDATE;
  IF NOT FOUND OR v_tx.seller_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Diesen Verkauf gibt es nicht.' USING ERRCODE = 'P0001';
  END IF;
  IF v_tx.status <> 'completed' THEN
    RAISE EXCEPTION 'Dieser Verkauf ist nicht bezahlt — bitte nichts verschicken.' USING ERRCODE = 'P0001';
  END IF;
  IF v_tx.shipped_at IS NOT NULL THEN
    RAISE EXCEPTION 'Dieser Verkauf ist schon als versendet markiert.' USING ERRCODE = 'P0001';
  END IF;
  IF p_carrier IS NULL OR p_carrier NOT IN ('dhl', 'deutsche_post', 'hermes', 'dpd', 'gls', 'ups', 'other') THEN
    RAISE EXCEPTION 'Bitte wähle den Versanddienst.' USING ERRCODE = 'P0001';
  END IF;
  IF length(v_tracking) < 5 OR length(v_tracking) > 64 THEN
    RAISE EXCEPTION 'Bitte gib die Sendungsnummer an (5 bis 64 Zeichen).' USING ERRCODE = 'P0001';
  END IF;

  UPDATE transactions
     SET shipped_at = now(), shipping_carrier = p_carrier, tracking_number = v_tracking
   WHERE id = p_transaction_id;

  -- Benachrichtigung an den Käufer (nicht kritisch — der Versand zählt auch ohne)
  IF v_tx.buyer_id IS NOT NULL AND v_tx.jersey_id IS NOT NULL THEN
    BEGIN
      INSERT INTO jersey_sold_notifications (recipient_id, type, jersey_id, buyer_id, amount_cents)
      VALUES (v_tx.buyer_id, 'jersey_shipped', v_tx.jersey_id, v_tx.buyer_id, v_tx.amount_cents);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END;
$$;

-- 4 · Käufer (oder Admin): Erhalt bestätigen --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_order_received(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx transactions%ROWTYPE;
  v_admin boolean := public.is_admin();
BEGIN
  SELECT * INTO v_tx FROM transactions WHERE id = p_transaction_id FOR UPDATE;
  IF NOT FOUND OR (v_tx.buyer_id IS DISTINCT FROM auth.uid() AND NOT v_admin) THEN
    RAISE EXCEPTION 'Diesen Kauf gibt es nicht.' USING ERRCODE = 'P0001';
  END IF;
  IF v_tx.status <> 'completed' THEN
    RAISE EXCEPTION 'Dieser Kauf ist nicht abgeschlossen.' USING ERRCODE = 'P0001';
  END IF;
  IF v_tx.received_at IS NOT NULL THEN
    RAISE EXCEPTION 'Der Erhalt ist schon bestätigt.' USING ERRCODE = 'P0001';
  END IF;
  IF v_tx.shipped_at IS NULL AND NOT v_admin THEN
    RAISE EXCEPTION 'Der Verkäufer hat das Trikot noch nicht als versendet markiert.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE transactions SET received_at = now(), received_by = auth.uid() WHERE id = p_transaction_id;

  IF v_tx.seller_id IS NOT NULL AND v_tx.jersey_id IS NOT NULL THEN
    BEGIN
      INSERT INTO jersey_sold_notifications (recipient_id, type, jersey_id, buyer_id, amount_cents)
      VALUES (v_tx.seller_id, 'jersey_received', v_tx.jersey_id, v_tx.buyer_id, v_tx.amount_cents);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_order_shipped(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_order_received(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_order_shipped(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_order_received(uuid) TO authenticated, service_role;

-- 5 · Konto löschen: gesperrt bis „Erhalten“ statt 30 Tage; Lieferadressen des Käufers werden entfernt
CREATE OR REPLACE FUNCTION public.delete_account_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Community content of deleted accounts points here; the UI shows "Gelöschtes Mitglied".
  c_deleted_member CONSTANT uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  IF p_user_id IS NULL OR p_user_id = c_deleted_member THEN
    RAISE EXCEPTION 'Ungültiges Konto.' USING ERRCODE = '22023';
  END IF;

  -- Blockers ---------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM transactions
     WHERE status = 'pending' AND (buyer_id = p_user_id OR seller_id = p_user_id)
  ) THEN
    RAISE EXCEPTION 'Gerade läuft ein Kauf oder Verkauf. Du kannst dein Konto löschen, sobald er abgeschlossen ist.'
      USING ERRCODE = 'P0001';
  END IF;

  -- CC-ORDERS: statt pauschal 30 Tage — gesperrt, solange ein bezahlter Kauf/Verkauf nicht als erhalten bestätigt ist.
  IF EXISTS (
    SELECT 1 FROM transactions
     WHERE status = 'completed' AND received_at IS NULL
       AND (buyer_id = p_user_id OR seller_id = p_user_id)
  ) THEN
    RAISE EXCEPTION 'Du hast noch einen offenen Kauf oder Verkauf: Das Trikot ist noch nicht als erhalten bestätigt. Unter „Käufe & Verkäufe“ siehst du, was fehlt.'
      USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM bid_ask_matches m
      LEFT JOIN bids b ON b.id = m.bid_id
      LEFT JOIN asks a ON a.id = m.ask_id
      LEFT JOIN user_jerseys j ON j.id = m.jersey_id
     WHERE m.status = 'pending'
       AND (b.user_id = p_user_id OR a.user_id = p_user_id OR j.user_id = p_user_id)
  ) THEN
    RAISE EXCEPTION 'Zu einem deiner Gebote oder Angebote ist eine Zahlung offen. Du kannst dein Konto löschen, sobald sie erledigt ist.'
      USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM trade_requests tr
      JOIN user_jerseys j ON j.id IN (tr.requester_jersey_id, tr.owner_jersey_id)
     WHERE j.user_id = p_user_id AND tr.status = 'accepted' AND tr.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Du hast einen vereinbarten Tausch, der noch nicht abgeschlossen ist. Schließe ihn zuerst ab.'
      USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND is_admin)
     AND (SELECT count(*) FROM profiles WHERE is_admin) <= 1 THEN
    RAISE EXCEPTION 'Du bist der einzige Admin. Ernenne zuerst einen weiteren Admin.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Data ------------------------------------------------------------------
  -- Snapshot of sold jerseys before they are deleted with their owner
  UPDATE transactions t
     SET jersey_snapshot = jsonb_build_object(
           'team', j.team, 'name', j.name, 'league', j.league,
           'year', j.year, 'size', j.size, 'condition', j.condition)
    FROM user_jerseys j
   WHERE t.jersey_id = j.id AND j.user_id = p_user_id AND t.jersey_snapshot IS NULL;

  -- Lieferadressen des Käufers entfernen (Verkäufe sind hier alle abgeschlossen)
  UPDATE transactions
     SET shipping_name = NULL, shipping_address = NULL
   WHERE buyer_id = p_user_id AND (shipping_name IS NOT NULL OR shipping_address IS NOT NULL);

  -- Bids/asks: own ones, and everyone's on this user's jerseys (those jerseys disappear)
  DELETE FROM bids
   WHERE user_id = p_user_id
      OR jersey_id IN (SELECT id FROM user_jerseys WHERE user_id = p_user_id);
  DELETE FROM asks
   WHERE user_id = p_user_id
      OR jersey_id IN (SELECT id FROM user_jerseys WHERE user_id = p_user_id);

  -- Community: anonymise, attached images are removed from storage by the Edge Function
  UPDATE forum_posts
     SET user_id = c_deleted_member, image_urls = '{}', updated_at = now()
   WHERE user_id = p_user_id;
  UPDATE forum_comments
     SET user_id = c_deleted_member, image_urls = '{}', updated_at = now()
   WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_account_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account_data(uuid) TO service_role;

COMMIT;

-- Prüfen:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions' AND column_name IN
--     ('shipping_name','shipping_address','shipped_at','shipping_carrier','tracking_number','received_at','received_by');  → 7 Zeilen
--   SELECT proname FROM pg_proc WHERE proname IN ('mark_order_shipped','confirm_order_received');                        → 2 Zeilen
--
-- Rollback: delete_account_data aus 20260928150000_cc_transactions_paid_at.sql erneut ausführen;
--   DROP FUNCTION public.mark_order_shipped(uuid, text, text); DROP FUNCTION public.confirm_order_received(uuid);
--   DROP POLICY "Admins can view all transactions" ON public.transactions;
--   Spalten erst entfernen, nachdem die alten Edge Functions wieder deployt sind.
