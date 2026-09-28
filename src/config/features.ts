// Funktions-Schalter.
//
// trade: Tausch vorerst AUS (Guido + Matthias, 28.09.2026 — siehe PLAN_Gebote-Tausch_20260928.md im Planungsordner).
// Aus bedeutet: Menü-, Footer- und Startseiten-Einträge, Tauschbörse (/trade), Tausch-Anfragen (/trades), Tags,
// Filter und Tausch-Schalter in Sammlung/Profil sind ausgeblendet; „Nur Tausch“-Trikots erscheinen nicht im Shop.
// Die Datenbank sperrt zusätzlich alle Schreibzugriffe auf Tausch-Tabellen (Migration 20260930160000).
//
// Wieder einschalten: erst den Tausch-Ablauf neu bauen (Versand, Erhalt, Server-Prüfungen), dann die Rechte per
// Migration wieder vergeben, dann hier true setzen. Die Standardtexte (src/content) wurden ohne Tausch formuliert.
export const FEATURES = {
  trade: false,
} as const;
