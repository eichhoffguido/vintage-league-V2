# Zahlungs-Migration CC-S1 — Anleitung für Guido

**Datei:** `supabase/migrations/20260926120000_cc_s1_payments_hardening.sql`
**Wer führt aus:** Du (Guido), manuell im Supabase SQL Editor. Kein Agent führt das aus.
**Dauer:** ca. 5 Minuten inkl. Kontrolle.

---

## 1. Was macht die Migration? (in einfachen Worten)

Sie bereitet die Datenbank darauf vor, dass Zahlungen sicherer werden (Aufgabe S2) und dass Verkäufer später
ihr eigenes Stripe-Konto verbinden können, wobei Calcio Classics automatisch 5 % Gebühr einbehält (Aufgabe S3).
Es wird **nichts gelöscht** und **keine bestehende Zeile verändert**. Es kommen nur neue Felder und Regeln dazu.

1. **Neues „Eingangsbuch" für Stripe-Nachrichten (`stripe_events`).**
   Stripe schickt manchmal dieselbe Nachricht („Zahlung erfolgreich") zweimal. Das Buch merkt sich jede
   Nachricht, damit sie nur einmal verarbeitet wird. Nur die Server-Funktionen dürfen es lesen oder schreiben,
   normale Nutzer sehen es nie.

2. **Transaktionen bekommen mehr Informationen.**
   - Ob es eine Test- oder eine echte Zahlung war (`livemode`).
   - Wann ein offener Bezahlvorgang abläuft (`checkout_expires_at`).
   - Die Stripe-Zahlungsnummer (`stripe_payment_intent_id`), um später Rückerstattungen zuzuordnen.
   - Wann die Zeile zuletzt geändert wurde (`updated_at`, wird automatisch gepflegt).
   - Zwei neue Zustände: **abgelaufen** (`expired`) und **fehlgeschlagen** (`failed`), zusätzlich zu
     offen, bezahlt und erstattet.

3. **Die wichtigste neue Regel: „Ein Trikot kann nur einmal verkauft werden."**
   Pro Trikot darf es höchstens **einen** offenen oder bezahlten Kauf geben. Wenn zwei Leute gleichzeitig auf
   „Kaufen" klicken, lehnt die Datenbank den zweiten ab — statt dass beide bezahlen.

4. **Neue, geschützte Tabelle für Verkäufer-Stripe-Konten (`seller_payout_accounts`).**
   Pro Verkäufer: die Stripe-Konto-ID und drei Ja/Nein-Felder („darf Zahlungen annehmen", „darf Auszahlungen
   bekommen", „Formular ausgefüllt"). Bewusst **nicht** im Profil, denn Profile kann jeder lesen.
   - Sehen darf die Zeile nur **der Verkäufer selbst** und **Admins**.
   - Schreiben dürfen **nur die Server-Funktionen** — kein Nutzer und kein Admin über die App. Sonst könnte sich
     jemand selbst als „freigeschaltet" markieren.
   - Dazu eine kleine Abfrage-Funktion `seller_can_receive_payments`, die für jedes Trikot nur **Ja/Nein**
     beantwortet: „Kann dieser Verkäufer Geld empfangen?" Daran entscheidet die Website, ob der Button
     **„Sofort kaufen"** angezeigt wird. Die Konto-ID selbst wird dabei nie verraten.

Alles läuft in einem Rutsch (`BEGIN … COMMIT`): Entweder klappt **alles**, oder es wird **gar nichts** geändert.

---

## 2. Ausführen — Schritt für Schritt

> **Wann?** Führe die Migration **erst direkt vor dem Deploy der S2-Edge-Functions** aus (Checkout + Webhook).
> Grund: Die neue Regel „ein Trikot nur einmal verkaufen" gilt sofort. Der alte Webhook kennt sie noch nicht —
> würden bis zum S2-Deploy zwei Leute dasselbe Trikot gleichzeitig bezahlen, bekäme der zweite Kauf vom alten
> Webhook einen Fehler (500), obwohl Stripe das Geld schon eingezogen hat. S2 behandelt genau diesen Fall.

1. Öffne <https://supabase.com/dashboard> und melde dich an.
2. Wähle das Projekt **`napzgxpxkoiujjqwtzvz`** (Region EU-Frankfurt).
3. Links in der Seitenleiste: **SQL Editor**.
4. Oben links: **+ New query** (bzw. „New SQL snippet").
5. Öffne die Datei `supabase/migrations/20260926120000_cc_s1_payments_hardening.sql`
   (auf GitHub im Pull Request oder lokal), markiere **den gesamten Inhalt** und kopiere ihn.
6. Füge ihn in das leere Abfragefenster ein.
7. Klicke unten rechts auf **Run** (oder `Cmd + Enter`).
8. Erwartetes Ergebnis: **„Success. No rows returned"**.
   Falls Supabase vorher warnt („This query contains destructive operations" o. ä.), ist das wegen der
   Zeilen, die eine alte Regel ersetzen — das ist gewollt, du kannst bestätigen.

> Die Migration darf auch ein zweites Mal ausgeführt werden. Sie prüft selbst, was schon da ist.

---

## 3. Was bedeutet der Sicherheitsfehler?

Bevor die Regel „ein Trikot nur einmal verkaufen" angelegt wird, schaut die Migration nach, ob es **heute schon**
ein Trikot mit mehr als einem offenen/bezahlten Kauf gibt. Falls ja, bricht sie ab mit einer Meldung wie:

```
CC-S1 ABGEBROCHEN / ABORTED: 1 Trikot(s) haben bereits mehr als einen aktiven Verkauf ...
  jersey_id=1234… (2 rows: abcd… [completed], ef01… [completed])
```

Das heißt:
- **Es wurde nichts geändert** — die Datenbank ist genau wie vorher.
- Irgendwann wurde ein Trikot doppelt verkauft (oder doppelt als verkauft eingetragen, z. B. durch einen Test).
- **Bitte nichts selbst löschen.** Kopiere die komplette Fehlermeldung und gib sie an Claude / die Pipeline.
  Dann wird entschieden, welcher Eintrag z. B. auf „erstattet" gesetzt wird. Danach die Migration einfach
  noch einmal ausführen.

---

## 4. Kontrolle danach

Jede Abfrage einzeln in einem neuen Query-Fenster einfügen und **Run** klicken.

**a) Neue Spalten in `transactions`** — du solltest u. a. `livemode`, `checkout_expires_at`,
`stripe_payment_intent_id`, `updated_at` sehen:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'transactions'
ORDER BY ordinal_position;
```

**b) Neue Tabelle `seller_payout_accounts` und ihre Leseregeln** — erwartet: 2 Zeilen
(„Owners can view own payout account", „Admins can view all payout accounts"), beide `SELECT`:

```sql
SELECT policyname, cmd, roles FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'seller_payout_accounts';
```

Und die Ja/Nein-Funktion — erwartet: `false` (ein ausgedachter Verkäufer hat natürlich kein Konto):

```sql
SELECT public.seller_can_receive_payments(gen_random_uuid());
```

**c) Indizes auf `transactions`** — erwartet u. a. `transactions_one_active_sale_per_jersey`,
`idx_transactions_status_checkout_expires_at`, `idx_transactions_stripe_payment_intent_id`:

```sql
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'transactions';
```

**d) Erlaubte Status-Werte** — erwartet: eine Zeile `transactions_status_check` mit
`pending, completed, refunded, expired, failed`:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.transactions'::regclass AND contype = 'c';
```

**e) `stripe_events` und `seller_payout_accounts` existieren und sind geschützt** — erwartet: zwei Zeilen,
beide mit `rowsecurity = true`:

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('stripe_events', 'seller_payout_accounts');
```

**f) Test: Ein normaler Nutzer kann sich NICHT selbst ein Stripe-Konto eintragen.**
Dieser Test tut so, als wäre er ein eingeloggter Nutzer, und versucht, sich selbst als „freigeschaltet"
einzutragen. Am Ende wird alles zurückgenommen (`ROLLBACK`). Es wird **nichts gespeichert**, egal wie es ausgeht.

```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  json_build_object('role', 'authenticated',
                    'sub', (SELECT id FROM public.profiles LIMIT 1))::text,
  true
);
INSERT INTO public.seller_payout_accounts (user_id, stripe_account_id, charges_enabled, payouts_enabled)
VALUES (auth.uid(), 'acct_test_fake', true, true);
ROLLBACK;
```

- **Richtig ist:** eine rote Fehlermeldung `permission denied for table seller_payout_accounts`.
  Das ist der Beweis, dass der Schutz wirkt.
- **Falsch wäre:** „Success" mit „1 row affected" → bitte melden (es wurde trotzdem nichts gespeichert,
  wegen `ROLLBACK`).
- Falls der Editor danach meckert, dass eine Transaktion „aborted" ist: einfach eine neue Query mit nur
  `ROLLBACK;` ausführen.

---

## 5. Zurückrollen (nur im Notfall)

Am Ende der Migrationsdatei steht ein auskommentierter Block **„DOWN / ROLLBACK"**.

1. Neues Query-Fenster öffnen.
2. Den Block ab `-- BEGIN;` bis `-- COMMIT;` kopieren.
3. Bei jeder Zeile die führenden `-- ` entfernen (oder Claude bitten, dir die fertige Version zu geben).
4. **Run**.

Wichtig:
- Das Zurückrollen **löscht** die neuen Spalten und Tabellen samt Inhalt (z. B. verbundene Stripe-Konten der Verkäufer).
  Nur machen, wenn S2/S3 noch nicht live sind — sonst vorher mit Claude sprechen.
- Gibt es schon Transaktionen mit Status `expired` oder `failed`, bricht das Zurückrollen ab
  (die alte Regel kennt diese Werte nicht). Auch dann: Claude fragen.
