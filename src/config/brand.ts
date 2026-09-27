// Zentrale Marken-Konstanten für Calcio Classics (Skill cc-design).
// Markenname und Produktions-URL.

export const BRAND_NAME = "Calcio Classics";

// Produktions-URL; bis zum Domain-Wechsel (CC-D1) fällt sie auf den aktuellen Origin zurück.
export const SITE_URL: string =
  (import.meta.env.VITE_SITE_URL as string | undefined) ??
  (typeof window !== "undefined" ? window.location.origin : "https://calcioclassics.de");

// Kontakt-E-Mail, Instagram und Footer-Claim sind seit CC-C2b im CMS pflegbar
// (Standard: SITE_SETTINGS / FOOTER_CONTENT in src/content/pages.ts).
