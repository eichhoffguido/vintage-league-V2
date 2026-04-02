## Trikottausch-Feature — Implementierungsplan

### 1. Datenbank-Architektur
- **profiles** — Nutzerprofil (Anzeigename, Avatar, Bio)
- **user_jerseys** — Trikot-Sammlung der Nutzer (Team, Liga, Jahr, Zustand, Größe, Bild, zum Tausch verfügbar ja/nein)
- **trade_requests** — Tausch-Anfragen (Anbieter-Trikot ↔ Empfänger-Trikot, Status: pending/accepted/declined/completed)
- RLS-Policies für alle Tabellen

### 2. Authentifizierung
- Login & Registrierung (E-Mail + Passwort)
- Auth-Seite mit Login/Signup-Formular
- Passwort-vergessen-Funktion
- Geschützte Routen für Sammlung & Tausch

### 3. UI-Seiten
- **/auth** — Login & Registrierung
- **/collection** — Eigene Sammlung verwalten (Trikots hinzufügen, als tauschbar markieren)
- **/trade** — Tauschbörse: Alle zum Tausch verfügbaren Trikots anderer Sammler durchstöbern
- **/trades** — Eigene Tausch-Anfragen verwalten (eingehend/ausgehend)

### 4. Tausch-Ablauf
1. Sammler A markiert ein Trikot als „zum Tausch verfügbar"
2. Sammler B sieht es in der Tauschbörse und bietet eines seiner eigenen Trikots an
3. Sammler A kann den Tausch annehmen oder ablehnen
4. Bei Annahme werden beide Trikots dem jeweils anderen Sammler zugeordnet
