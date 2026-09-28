-- CC-TECH — transactions.paid_at: echter Zahlungszeitpunkt (28.09.2026).
-- Bisher rechnete die 30-Tage-Löschsperre ab created_at (Anlage der Reservierung), weil updated_at bei jedem
-- Update neu gesetzt wird. Ab jetzt setzt stripe-webhook paid_at genau einmal beim Übergang auf "completed".
--
-- Reihenfolge: ERST diese Migration ausführen, DANN die Edge Function stripe-webhook deployen
-- (sonst schreibt der Webhook in eine Spalte, die es noch nicht gibt).
--
-- Neue Spalte in bestehender Tabelle → erbt die bestehenden Tabellenrechte, keine GRANTs nötig.

BEGIN;

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS paid_at timestamptz;

COMMENT ON COLUMN public.transactions.paid_at IS
  'Zahlungszeitpunkt (stripe-webhook, einmalig beim Übergang auf completed). Vor 28.09.2026: = created_at.';

-- Bestehende bezahlte/erstattete Käufe: bester bekannter Wert ist created_at
UPDATE public.transactions
   SET paid_at = created_at
 WHERE paid_at IS NULL AND status IN ('completed', 'refunded');

-- Löschsperre: 30 Tage ab paid_at (Fallback created_at). Sonst unverändert zu 20260927130000.
CREATE OR REPLACE FUNCTION public.delete_account_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Community content of deleted accounts points here; the UI shows "Gelöschtes Mitglied".
  c_deleted_member CONSTANT uuid := '00000000-0000-0000-0000-000000000000';
  c_hold CONSTANT interval := interval '30 days';
  v_last_sale timestamptz;
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

  -- Frist ab dem Zahlungszeitpunkt (paid_at); ältere Käufe ohne paid_at fallen auf created_at zurück.
  SELECT max(COALESCE(paid_at, created_at)) INTO v_last_sale
    FROM transactions
   WHERE status = 'completed' AND (buyer_id = p_user_id OR seller_id = p_user_id)
     AND COALESCE(paid_at, created_at) > now() - c_hold;
  IF v_last_sale IS NOT NULL THEN
    RAISE EXCEPTION 'Nach einem Kauf oder Verkauf bleibt dein Konto 30 Tage bestehen (Versand, Rückfragen). Löschen ist ab dem % möglich.',
      to_char((v_last_sale + c_hold) AT TIME ZONE 'Europe/Berlin', 'DD.MM.YYYY')
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

-- Prüfen (sollte 0 liefern: bezahlte Käufe ohne paid_at):
--   SELECT count(*) FROM public.transactions WHERE status IN ('completed','refunded') AND paid_at IS NULL;
--
-- Rollback: Funktion aus 20260927130000_cc_account_deletion_guards.sql erneut ausführen;
--   ALTER TABLE public.transactions DROP COLUMN paid_at;  (erst nachdem der alte Webhook wieder deployt ist)
