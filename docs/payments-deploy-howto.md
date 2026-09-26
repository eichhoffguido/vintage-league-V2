# Zahlungen live schalten (CC-S1 + CC-S2) — Anleitung für Guido

**Wer führt aus:** Du (Guido). Kein Agent deployt oder ändert Datenbank/Stripe selbst.
**Dauer:** ca. 30–45 Minuten inkl. Test.
**Modus:** Alles zuerst im **Stripe-Testmodus** (Schalter „Testmodus“ oben rechts im Stripe Dashboard).

Die Reihenfolge ist wichtig: erst Datenbank, dann Server-Funktionen, dann Stripe, dann Website.
Die neuen Funktionen brauchen die neuen Tabellen/Felder aus der Migration — umgekehrt würde der Kauf fehlschlagen.

---

## Was ändert sich? (kurz)

- **Nur angemeldete Nutzer** können einen Bezahlvorgang starten. Der Käufer ist immer der angemeldete Nutzer.
- **Reservierung:** Sobald jemand auf „Kaufen“ klickt, ist das Trikot **30 Minuten** für ihn reserviert.
  Ein Zweiter bekommt „Dieses Trikot ist gerade reserviert oder bereits verkauft.“ Bezahlt der Erste nicht,
  wird das Trikot automatisch wieder kaufbar.
- **Stripe-Nachrichten werden nur einmal verarbeitet** (auch wenn Stripe sie doppelt schickt).
- **Abgelaufene, fehlgeschlagene und erstattete Zahlungen** werden sauber vermerkt.
- **Doppelverkauf-Schutz:** Falls doch einmal zwei Zahlungen für dasselbe Trikot ankommen, wird die zweite
  automatisch voll erstattet.
- **Erfolgsseite** zeigt jetzt den echten Status: bezahlt / in Bearbeitung (z. B. SEPA-Lastschrift) /
  fehlgeschlagen / abgelaufen.
- **Gebühr:** 5 % Plattformgebühr wird jetzt auch bei Gebot/Angebot-Käufen berechnet (vorher 0 %). Sie wird
  nur vermerkt — echtes Aufteilen an Verkäufer kommt erst mit S3 (Stripe Connect).
- Produktname im Stripe-Bezahlfenster: „Calcio Classics – ‹Trikotname›“.

---

## Schritt 1 — Datenbank-Migration (S1)

Folge **[docs/payments-migration-howto.md](./payments-migration-howto.md)** komplett (SQL Editor → Migration
ausführen → Kontrollabfragen). Erst weitermachen, wenn dort alles grün ist.

---

## Schritt 2 — Server-Funktionen (Edge Functions) deployen

Im Repo gab es bisher **keine** Deploy-Anleitung oder Skripte für Edge Functions — sie wurden manuell per
Supabase CLI hochgeladen. So geht es:

1. Terminal öffnen, in den Projektordner wechseln (der Ordner, in dem `package.json` liegt), und zwar auf dem
   Stand, der die S2-Änderungen enthält (Branch `feature/CC-S2-checkout-hardening` bzw. nach dem Merge `main`).
2. Einmalig anmelden (öffnet den Browser):
   ```bash
   npx supabase login
   ```
3. Die drei Funktionen hochladen:
   ```bash
   npx supabase functions deploy create-checkout-session --project-ref napzgxpxkoiujjqwtzvz
   npx supabase functions deploy verify-checkout-session --project-ref napzgxpxkoiujjqwtzvz
   npx supabase functions deploy stripe-webhook --project-ref napzgxpxkoiujjqwtzvz --no-verify-jwt
   ```
   **Warum `--no-verify-jwt` beim Webhook?** Stripe ruft den Webhook direkt auf und hat kein Supabase-Login.
   Ohne diesen Schalter lehnt Supabase jede Stripe-Nachricht mit „401“ ab. Der Webhook prüft stattdessen selbst
   die Stripe-Signatur. Das steht zusätzlich in `supabase/config.toml` (`[functions.stripe-webhook]
   verify_jwt = false`), der Schalter im Befehl ist die doppelte Absicherung.
   Die beiden anderen Funktionen bleiben **mit** Login-Prüfung.
4. Kontrolle: Supabase Dashboard → **Edge Functions** → alle drei Funktionen sind gelistet;
   bei `stripe-webhook` steht „Verify JWT: off“ (bzw. „JWT verification disabled“).

---

## Schritt 3 — Secret `SITE_URL` setzen

Supabase Dashboard → Projekt `napzgxpxkoiujjqwtzvz` → **Edge Functions** → **Secrets** (bzw.
Project Settings → Edge Functions → Secrets) → **Add new secret**:

| Name | Wert |
|---|---|
| `SITE_URL` | `https://vintage-league-v2.vercel.app` |

Das ist die Adresse, auf die Stripe nach dem Bezahlen zurückleitet. Nach dem Domain-Umzug hier
`https://calcioclassics.de` eintragen. Ohne `SITE_URL` funktioniert der Kauf nur noch von erlaubten Adressen
aus (Produktion, Vorschau-Deployments, localhost) — sonst erscheint eine Fehlermeldung.

Außerdem prüfen, dass diese Secrets schon existieren (nicht ändern): `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`. (`SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` setzt Supabase automatisch.)

---

## Schritt 4 — Stripe-Webhook konfigurieren (Testmodus)

Stripe Dashboard → **Testmodus an** → **Entwickler (Developers)** → **Webhooks**.

- Gibt es schon einen Endpoint `https://napzgxpxkoiujjqwtzvz.supabase.co/functions/v1/stripe-webhook`:
  anklicken → **Bearbeiten / Update details** → „Events auswählen“.
- Sonst: **Endpoint hinzufügen** mit genau dieser URL.

Folgende Events anhaken:

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

Speichern. **Nur bei einem neu angelegten Endpoint:** „Signing secret“ anzeigen (`whsec_…`) und in Supabase
unter Edge Functions → Secrets als `STRIPE_WEBHOOK_SECRET` eintragen (bestehendes überschreiben). Das Secret nie
in Chats oder Dokumente kopieren.

---

## Schritt 5 — PRs mergen

1. PR von **CC-S1** (Migration) mergen.
2. PR von **CC-S2** (dieser Umbau) mergen. Vercel deployt die neue Erfolgsseite automatisch.

Hinweis: Die Server-Funktionen (Schritt 2) werden **nicht** automatisch durch den Merge deployt —
deshalb der manuelle Schritt 2.

---

## Schritt 6 — Test im Stripe-Testmodus

Mit zwei Konten (z. B. du + „Herbert theBot“) und einem Test-Trikot mit „Sofort kaufen“:

| # | Test | Erwartung |
|---|---|---|
| 1 | Kaufen mit Testkarte `4242 4242 4242 4242`, beliebiges zukünftiges Datum, beliebige CVC | Erfolgsseite: „Zahlung erfolgreich.“; Trikot ist „verkauft“; Verkäufer bekommt Benachrichtigung |
| 2 | Stripe Dashboard → Webhooks → Endpoint → letztes Event `checkout.session.completed` → **Erneut senden** | Antwort 200, **keine** zweite Benachrichtigung, nichts doppelt |
| 3 | Zwei Browser (zwei Konten), dasselbe Trikot: A klickt „Kaufen“ (Stripe-Fenster offen lassen), dann B klickt „Kaufen“ | B bekommt eine Fehlermeldung (Trikot reserviert). Hinweis: die aktuelle Kauf-Schaltfläche zeigt evtl. nur „Fehler“ statt des deutschen Textes — das ist bekannt, siehe unten |
| 4 | A bricht ab und wartet ca. 31 Minuten (Stripe lässt die Session ablaufen) | B kann das Trikot danach kaufen |
| 5 | Gebot/Angebot-Match bezahlen (Testkarte) | Match „completed“, Trikot verkauft, **beide** bekommen „bid_ask_matched“-Benachrichtigung — genau einmal |
| 6 | Erfolgsseite-Zustände: Testzahlung per SEPA-Lastschrift (Test-IBAN aus Stripe-Doku) | Erfolgsseite zeigt „Zahlung in Bearbeitung.“ |
| 7 | Erfolgsseite `/success` ohne `session_id` aufrufen | „Kein Kauf gefunden.“ |
| 8 | Abgemeldet: Kauf-Funktion ohne Login aufrufen (Pipeline/QA mit `curl` ohne Nutzer-Token) | Antwort **401** „Bitte melde dich an …“ |
| 9 | Stripe Dashboard → Zahlung → **Erstatten** (voll) | Transaktion wird „refunded“; Trikot bleibt „verkauft“ (Entscheidung durch Admin) |

Wenn etwas fehlschlägt: Supabase Dashboard → Edge Functions → Funktion → **Logs** ansehen und der Pipeline
schicken; im SQL Editor zeigt `select * from stripe_events order by received_at desc limit 20;`, welche
Stripe-Nachrichten angekommen sind und ob ein Fehler (`error`) vermerkt wurde.

---

## Bekannte Einschränkungen

- Die Kauf-Schaltflächen (Startseite, Shop, Merkliste, Trikot-Detail, Gebot-Dialog) zeigen bei Fehlern noch den
  allgemeinen Text statt der deutschen Server-Meldung. Das wird in einer eigenen Aufgabe an den Seiten behoben.
- Nach einer Erstattung bleibt das Trikot „verkauft“ — ob es wieder angeboten wird, entscheidet ein Admin.
- Noch **keine Auszahlung an Verkäufer** über Stripe Connect (kommt mit S3).
