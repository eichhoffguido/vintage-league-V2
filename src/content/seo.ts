// CC-C5 — Titel, Beschreibung und Vorschaubild je Seite (Google, WhatsApp, iMessage …).
// Standardwerte im Code, das CMS überschreibt pro Schlüssel "seo.<seite>.<feld>".
// Bewusst ohne Imports: die Datei wird auch von den Vercel-Funktionen in api/ gelesen.

export interface SeoEntry {
  /** Titel im Browser-Tab und in der Link-Vorschau (ca. 60 Zeichen) */
  title: string;
  /** Beschreibung unter dem Titel (ca. 155 Zeichen) */
  description: string;
  /** Vorschaubild: Storage-Pfad in site-media oder Pfad/URL; leer = Standardbild */
  image: string;
}

export type SeoPageKey = "default" | "home" | "shop" | "community" | "trade" | "imprint" | "privacy" | "terms";

export type SeoContent = Record<SeoPageKey, SeoEntry>;

/** Standard-Vorschaubild (1200×630, liegt in public/) */
export const SEO_DEFAULT_IMAGE = "/og-calcio-classics.jpg";

export const SEO_CONTENT: SeoContent = {
  default: {
    title: "Calcio Classics – Marktplatz für Vintage-Fußballtrikots",
    description: "Authentische Vintage-Fußballtrikots kaufen, verkaufen und tauschen. Jedes Stück geprüft, jeder Preis fair eingeordnet.",
    image: "",
  },
  home: {
    title: "Calcio Classics – Marktplatz für Vintage-Fußballtrikots",
    description: "Authentische Vintage-Fußballtrikots kaufen, verkaufen und tauschen. Jedes Stück geprüft, jeder Preis fair eingeordnet.",
    image: "",
  },
  shop: {
    title: "Marktplatz – Vintage-Fußballtrikots | Calcio Classics",
    description: "Retro- und Vintage-Trikots aus Bundesliga, Serie A, Premier League und von Nationalteams — von Sammlern für Sammler, mit fairer Preiseinordnung.",
    image: "",
  },
  community: {
    title: "Community | Calcio Classics",
    description: "Fachsimpeln, Fundstücke zeigen, Echtheit prüfen: die Community für Sammler von Vintage-Fußballtrikots.",
    image: "",
  },
  trade: {
    title: "Tauschbörse | Calcio Classics",
    description: "Trikot gegen Trikot: Finde Sammler, die tauschen wollen, und vervollständige deine Sammlung.",
    image: "",
  },
  imprint: { title: "Impressum | Calcio Classics", description: "Impressum von Calcio Classics.", image: "" },
  privacy: { title: "Datenschutz | Calcio Classics", description: "Datenschutzerklärung von Calcio Classics.", image: "" },
  terms: { title: "AGB | Calcio Classics", description: "Allgemeine Geschäftsbedingungen von Calcio Classics.", image: "" },
};
