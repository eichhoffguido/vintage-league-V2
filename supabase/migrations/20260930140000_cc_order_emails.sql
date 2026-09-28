-- CC-ORDER-MAILS — Protokoll der Bestell-Mails (28.09.2026).
-- Jede Mail (Kauf/Verkauf, Versand, Erhalt) wird genau einmal verschickt: vor dem Versand wird hier eine Zeile
-- (transaction_id, event) angelegt; gibt es sie schon, geht keine zweite Mail raus. Schlägt der Versand fehl,
-- wird die Zeile wieder gelöscht, damit ein späterer Versuch möglich ist.
-- Nur Edge Functions (service_role) lesen und schreiben; Nutzer haben keinen Zugriff.
--
-- Reihenfolge: ERST diese Migration, DANN Edge Functions stripe-webhook + order-email deployen, DANN mergen.

BEGIN;

CREATE TABLE IF NOT EXISTS public.order_emails (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  event          text NOT NULL CHECK (event IN ('paid_buyer', 'paid_seller', 'shipped_buyer', 'received_seller')),
  recipient_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resend_id      text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transaction_id, event)
);

COMMENT ON TABLE public.order_emails IS 'Versandprotokoll der Bestell-Mails (Resend). Nur service_role.';

ALTER TABLE public.order_emails ENABLE ROW LEVEL SECURITY;
-- Keine Policies: anon/authenticated sehen nichts. Explizite Rechte, weil neue Tabellen hier keine Standardrechte haben.
REVOKE ALL ON public.order_emails FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.order_emails TO service_role;

COMMIT;

-- Prüfen:
--   SELECT count(*) FROM public.order_emails;   → 0
