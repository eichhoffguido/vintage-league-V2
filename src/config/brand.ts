// Zentrale Marken-Konstanten für Calcio Classics (Skill cc-design).
// Alle sichtbaren Markennamen, Kontakt- und Social-Links kommen von hier.

export const BRAND_NAME = "Calcio Classics";

// Produktions-URL; bis zum Domain-Wechsel (CC-D1) fällt sie auf den aktuellen Origin zurück.
export const SITE_URL: string =
  (import.meta.env.VITE_SITE_URL as string | undefined) ??
  (typeof window !== "undefined" ? window.location.origin : "https://calcioclassics.de");

// Postfach wird bei Ionos angelegt (Plan G2, Schritt 8) — bis dahin Platzhalter-Adresse der neuen Domain.
export const CONTACT_EMAIL = "kontakt@calcioclassics.de";

export const INSTAGRAM_HANDLE = "@calcioclassics.de";
export const INSTAGRAM_URL = "https://instagram.com/calcioclassics.de";

export const BRAND_TAGLINE = "Vintage-Fußballtrikots aus Deutschland — mit Herz für Calcio.";
