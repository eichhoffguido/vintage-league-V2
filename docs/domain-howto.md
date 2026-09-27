# Domain calcioclassics.de verbinden (G1 + G1b, CC-D1)

Stand DNS am 29.09.2026 (Ionos-Standard): `@` A `217.160.0.64` + AAAA `2001:8d8:100f:f000::200` (Parkseite),
`www` ohne Eintrag, MX `mx00/mx01.ionos.de`, TXT SPF. **MX und TXT bleiben unverändert** (E-Mail-Postfach).

## 1. Vercel (ca. 5 Min.)
1. vercel.com → Projekt **vintage-league-v2** → **Settings → Domains** → **Add Domain** → `calcioclassics.de`.
2. Wenn Vercel fragt: „Redirect www to apex“ bzw. `www.calcioclassics.de` → **Redirect to calcioclassics.de (308)**.
   `calcioclassics.de` ist die Hauptdomain.
3. Vercel zeigt jetzt die nötigen DNS-Einträge an (meist A `@` → eine IP, CNAME `www` → `…vercel-dns…`).
   **Genau diese Werte gelten** — Fenster offen lassen.

## 2. Ionos DNS (ca. 10 Min.)
Ionos → **Domains & SSL** → `calcioclassics.de` → Zahnrad → **DNS**:
1. A-Eintrag `@` (Wert `217.160.0.64`) → **bearbeiten**: Wert = IP von Vercel.
2. **AAAA-Eintrag `@` löschen** (sonst landen IPv6-Nutzer weiter auf der Parkseite).
3. **CNAME `www`** hinzufügen → Wert von Vercel. (Gibt es schon einen A/AAAA für `www`: löschen.)
4. MX- und TXT-Einträge **nicht** anfassen.
5. Warten, bis Vercel bei beiden Domains **„Valid Configuration“** und ein Zertifikat zeigt (Minuten bis 24 h).
   Claude Code kann den Stand jederzeit prüfen.

## 3. Supabase (ca. 3 Min.) — direkt danach
1. Supabase → Projekt `napzgxpxkoiujjqwtzvz` → **Authentication → URL Configuration**
   - **Site URL**: `https://calcioclassics.de`
   - **Redirect URLs ergänzen** (nichts löschen): `https://calcioclassics.de/**`, `https://www.calcioclassics.de/**`
2. **Edge Functions → Secrets**: `SITE_URL` = `https://calcioclassics.de` (Stripe leitet nach dem Kauf dorthin zurück).

## 4. Code-PR (CC-D1) mergen — erst jetzt
Enthält die Weiterleitung `vintage-league-v2.vercel.app` → `calcioclassics.de`, Vorschaubild-Links, Sitemap.
Vorher mergen würde die alte Adresse auf eine noch nicht erreichbare Domain schicken.

## 5. Prüfen
- `https://calcioclassics.de` lädt, `https://www.calcioclassics.de` und `https://vintage-league-v2.vercel.app` leiten dorthin
- Google-Login auf der neuen Domain → zurück auf calcioclassics.de, eingeloggt
- Testkauf (Testmodus) → Rückkehr auf `https://calcioclassics.de/success`
- `https://calcioclassics.de/sitemap.xml` lädt

## Optional (später)
- Google Cloud Console → OAuth-Zustimmungsbildschirm: App-Name „Calcio Classics“, Startseite + Datenschutz auf
  calcioclassics.de, `calcioclassics.de` als autorisierte Domain (Plan G3).
- Weitere Domains (.com/.shop/.global) genauso bei Vercel hinzufügen → „Redirect to calcioclassics.de“.
