-- CC-TRADE-OFF — Tausch vorerst aus: alle Schreibzugriffe von Nutzern auf die Tausch-Tabellen sperren (28.09.2026).
--
-- Entscheidung Guido + Matthias: Tausch erst später (PLAN_Gebote-Tausch_20260928.md). Die Oberfläche blendet ihn aus
-- (src/config/features.ts). Diese Migration schließt zusätzlich die Lücken, die über die API offen wären:
--   * trade_requests: jeder Beteiligte konnte jeden Status setzen (auch die eigene Anfrage „annehmen“)
--   * trade_confirmations: jeder angemeldete Nutzer konnte fremde Tausche als bestätigt eintragen (→ „completed“)
--   * trade_ratings: Bewertungen ohne abgeschlossenen Tausch
-- Lesen bleibt erlaubt (bestehende Bewertungen im Verkäuferprofil). SECURITY-DEFINER-Funktionen
-- (soft_delete_user_jersey, delete_account_data) laufen mit Eigentümerrechten und sind nicht betroffen.
-- Kein Edge-Function-Deploy nötig. Der PR (Oberfläche) kann vor oder nach dieser Migration gemergt werden.

BEGIN;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.trade_requests      FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.trade_confirmations FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.trade_ratings       FROM anon, authenticated;

-- trade_confirmations war für alle angemeldeten Nutzer lesbar (wer hat welchen Tausch bestätigt) — nicht mehr nötig
REVOKE SELECT ON public.trade_confirmations FROM anon, authenticated;

COMMIT;

-- Prüfen (sollte nur noch SELECT zeigen, bei trade_confirmations gar nichts):
--   SELECT table_name, grantee, string_agg(privilege_type, ',') FROM information_schema.role_table_grants
--    WHERE table_schema = 'public' AND table_name IN ('trade_requests','trade_confirmations','trade_ratings')
--      AND grantee IN ('anon','authenticated') GROUP BY 1, 2;
--
-- Wieder einschalten (erst nach dem Neubau des Tauschs mit Server-Prüfungen):
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_requests TO authenticated;  -- o. ä., je nach neuem Ablauf
