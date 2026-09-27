// CC-C3 — Beschreibung der CMS-Oberfläche: welche Seite, welche Abschnitte (in der Reihenfolge, wie sie
// auf der Seite erscheinen), welche Felder — in Alltagssprache. Standardwerte kommen aus
// SITE_CONTENT_DEFAULTS (src/hooks/useSiteContent.ts); hier stehen nur Beschriftungen.
import type { SitePage } from "@/hooks/useSiteContent";

export type CmsFieldType = "headline" | "text" | "textarea" | "link" | "image" | "toggle" | "list";
export type CmsGround = "avorio" | "nero" | "verde";

export interface CmsListItemField {
  key: string;
  label: string;
  type: "text" | "textarea";
}

export interface CmsField {
  /** Pfad im Seiteninhalt, z. B. "album.headline" */
  path: string;
  label: string;
  hint?: string;
  type: CmsFieldType;
  max?: number;
  /** Überschriften: Hintergrund für die Vorschau */
  ground?: CmsGround;
  /** Listen: Felder je Eintrag — fehlt es, ist die Liste eine Liste von Texten */
  itemFields?: CmsListItemField[];
  /** Listen: Bezeichnung eines Eintrags („Punkt“, „Frage“ …) */
  itemLabel?: string;
}

export interface CmsSection {
  id: string;
  title: string;
  /** Ein Satz: wo erscheint das auf der Seite? */
  where: string;
  fields: CmsField[];
  /** Eigene Editoren für Listen aus eigenen Tabellen */
  special?: "heroSlides" | "faqItems";
}

export interface CmsPage {
  page: SitePage;
  title: string;
  /** Link „Auf der Seite ansehen“ */
  url: string;
  sections: CmsSection[];
}

// Wiederkehrende Felder
const eyebrow = (path: string): CmsField => ({
  path,
  label: "Kleine Zeile über der Überschrift",
  hint: "Italienisch · Deutsch, z. B. „Il mercato · Marktplatz“",
  type: "text",
  max: 60,
});
const headline = (path: string, ground: CmsGround = "avorio"): CmsField => ({ path, label: "Überschrift", type: "headline", ground, max: 80 });
const subline = (path: string, label = "Text unter der Überschrift"): CmsField => ({ path, label, type: "textarea", max: 280 });
const cta = (path: string, label: string): CmsField[] => [
  { path: `${path}.label`, label: `${label}: Beschriftung`, type: "text", max: 40 },
  { path: `${path}.to`, label: `${label}: führt zu`, hint: "Seite wie /shop oder /community", type: "link" },
];
const header = (path: string, ground: CmsGround): CmsField[] => [eyebrow(`${path}.eyebrow`), headline(`${path}.headline`, ground), subline(`${path}.subline`)];

export const CMS_PAGES: CmsPage[] = [
  {
    page: "home",
    title: "Startseite",
    url: "/",
    sections: [
      {
        id: "hero",
        title: "Hero oben",
        where: "Der grüne Block ganz oben mit großer Überschrift, Suche und Kennzahlen.",
        fields: [
          headline("hero.headline", "verde"),
          { path: "hero.searchPlaceholder", label: "Platzhalter im Suchfeld", type: "text", max: 40 },
          ...cta("hero.primaryCta", "Button 1"),
          { path: "hero.secondaryCta.label", label: "Button 2: Beschriftung", hint: "Führt zu „Trikot verkaufen“", type: "text", max: 40 },
          { path: "hero.stats.jerseys", label: "Kennzahl 1: Beschriftung", type: "text", max: 30 },
          { path: "hero.stats.profiles", label: "Kennzahl 2: Beschriftung", type: "text", max: 30 },
          { path: "hero.stats.trades", label: "Kennzahl 3: Beschriftung", type: "text", max: 30 },
        ],
      },
      {
        id: "heroSlides",
        title: "Hero-Bilder",
        where: "Die wechselnden Fotos rechts im Hero mit Stichwort, Unterzeile, Bildunterschrift und rundem Stempel.",
        fields: [],
        special: "heroSlides",
      },
      {
        id: "album",
        title: "Neu im Album",
        where: "Das Trikot-Raster direkt unter dem Hero.",
        fields: [eyebrow("album.eyebrow"), headline("album.headline"), subline("album.subline"), { path: "album.allLabel", label: "Link rechts", type: "text", max: 30 }],
      },
      {
        id: "trust",
        title: "Vertrauensstreifen",
        where: "Der schwarze Streifen mit den vier Versprechen (auch im Marktplatz).",
        fields: [
          { path: "trust.eyebrow", label: "Rote Zeile links", type: "text", max: 40 },
          { path: "trust.label", label: "Zeile daneben", type: "text", max: 40 },
          { path: "trust.ticker", label: "Laufzeile (nur Desktop)", type: "list", itemLabel: "Stichwort" },
          {
            path: "trust.features",
            label: "Die vier Versprechen",
            type: "list",
            itemLabel: "Versprechen",
            itemFields: [
              { key: "title", label: "Titel", type: "text" },
              { key: "description", label: "Text", type: "textarea" },
            ],
          },
        ],
      },
      {
        id: "dealer",
        title: "Für Händler",
        where: "Abschnitt mit Foto links und den nummerierten Punkten rechts.",
        fields: [
          eyebrow("dealer.eyebrow"),
          headline("dealer.headline"),
          subline("dealer.subline"),
          { path: "dealer.image", label: "Bild", type: "image" },
          { path: "dealer.imageAlt", label: "Bildbeschreibung", hint: "Für Blinde und Google — was ist zu sehen?", type: "text", max: 120 },
          {
            path: "dealer.points",
            label: "Punkte",
            type: "list",
            itemLabel: "Punkt",
            itemFields: [
              { key: "title", label: "Titel", type: "text" },
              { key: "text", label: "Text", type: "textarea" },
            ],
          },
          ...cta("dealer.primaryCta", "Button 1"),
          ...cta("dealer.secondaryCta", "Button 2"),
        ],
      },
      {
        id: "swap",
        title: "Tausch (Scambio)",
        where: "Der schwarze Streifen mit den zwei Trikot-Silhouetten.",
        fields: [
          eyebrow("swap.eyebrow"),
          { path: "swap.word", label: "Großes Wort im Hintergrund", type: "text", max: 14 },
          headline("swap.headline", "nero"),
          subline("swap.text"),
          { path: "swap.offer.label", label: "Silhouette links: Stichwort", type: "text", max: 20 },
          { path: "swap.offer.caption", label: "Silhouette links: Unterschrift", type: "text", max: 60 },
          { path: "swap.offer.image", label: "Silhouette links: Bild", type: "image" },
          { path: "swap.search.label", label: "Silhouette rechts: Stichwort", type: "text", max: 20 },
          { path: "swap.search.caption", label: "Silhouette rechts: Unterschrift", type: "text", max: 60 },
          { path: "swap.search.image", label: "Silhouette rechts: Bild", type: "image" },
          ...cta("swap.primaryCta", "Button 1"),
          ...cta("swap.secondaryCta", "Button 2"),
          { path: "swap.countLabel", label: "Beschriftung der Tausch-Zahl", type: "text", max: 40 },
        ],
      },
      {
        id: "community",
        title: "Community",
        where: "Abschnitt mit Themenliste links und großem Foto rechts.",
        fields: [
          eyebrow("community.eyebrow"),
          headline("community.headline"),
          subline("community.text"),
          {
            path: "community.topics",
            label: "Themen",
            type: "list",
            itemLabel: "Thema",
            itemFields: [
              { key: "title", label: "Thema", type: "text" },
              { key: "hint", label: "Hinweis rechts", type: "text" },
            ],
          },
          ...cta("community.cta", "Button"),
          { path: "community.image", label: "Bild", type: "image" },
          { path: "community.imageAlt", label: "Bildbeschreibung", hint: "Für Blinde und Google — was ist zu sehen?", type: "text", max: 120 },
          { path: "community.caption", label: "Bildunterschrift", type: "text", max: 60 },
        ],
      },
      {
        id: "faq",
        title: "FAQ",
        where: "Häufige Fragen ganz unten auf der Startseite.",
        fields: [eyebrow("faq.eyebrow"), headline("faq.headline"), subline("faq.text")],
      },
      { id: "faqItems", title: "FAQ-Fragen", where: "Die aufklappbaren Fragen und Antworten.", fields: [], special: "faqItems" },
    ],
  },
  {
    page: "shop",
    title: "Marktplatz",
    url: "/shop",
    sections: [{ id: "header", title: "Seitenkopf", where: "Schwarzes Band oben auf dem Marktplatz.", fields: header("header", "nero") }],
  },
  {
    page: "detail",
    title: "Trikot-Seite",
    url: "/shop",
    sections: [
      {
        id: "verification",
        title: "Echtheit & Prüfung",
        where: "Schwarzer Streifen unter jedem Trikot. Der Text hängt vom Prüfstatus des Trikots ab.",
        fields: [
          { path: "verification.eyebrow", label: "Rote Zeile", type: "text", max: 20 },
          { path: "verification.label", label: "Zeile daneben", type: "text", max: 40 },
          { ...headline("verification.verified.headline", "nero"), label: "Überschrift — Trikot geprüft" },
          { ...subline("verification.verified.text"), label: "Text — Trikot geprüft" },
          { ...headline("verification.pending.headline", "nero"), label: "Überschrift — Prüfung läuft" },
          { ...subline("verification.pending.text"), label: "Text — Prüfung läuft" },
          { ...headline("verification.unverified.headline", "nero"), label: "Überschrift — nicht geprüft" },
          { ...subline("verification.unverified.text"), label: "Text — nicht geprüft" },
          {
            path: "verification.points",
            label: "Die drei Versprechen",
            type: "list",
            itemLabel: "Versprechen",
            itemFields: [
              { key: "title", label: "Titel", type: "text" },
              { key: "text", label: "Text", type: "textarea" },
            ],
          },
          { path: "historyEyebrow", label: "Kleine Zeile über „Preisverlauf“", type: "text", max: 40 },
        ],
      },
    ],
  },
  {
    page: "community",
    title: "Community",
    url: "/community",
    sections: [
      { id: "header", title: "Seitenkopf", where: "Schwarzes Band oben in der Community.", fields: header("header", "nero") },
      {
        id: "teaser",
        title: "Hinweis für Gäste",
        where: "Kasten, den ausgeloggte Besucher statt der Beiträge sehen.",
        fields: [
          eyebrow("teaser.eyebrow"),
          headline("teaser.headline"),
          { path: "teaser.text", label: "Text (die Beitragszahl wird automatisch ergänzt)", type: "textarea", max: 200 },
          { path: "teaser.cta", label: "Button-Beschriftung", type: "text", max: 40 },
        ],
      },
    ],
  },
  {
    page: "trade",
    title: "Tauschbörse",
    url: "/trade",
    sections: [
      { id: "header", title: "Seitenkopf", where: "Schwarzes Band mit den Trikot-Silhouetten.", fields: header("header", "nero") },
      {
        id: "empty",
        title: "Wenn nichts zum Tausch da ist",
        where: "Kasten, wenn gerade keine Trikots zum Tausch angeboten werden.",
        fields: [
          { path: "empty.title", label: "Titel", type: "text", max: 80 },
          { path: "empty.text", label: "Text", type: "textarea", max: 200 },
        ],
      },
    ],
  },
  {
    page: "trades",
    title: "Tausch-Anfragen",
    url: "/trades",
    sections: [{ id: "header", title: "Seitenkopf", where: "Schwarzes Band oben bei „Meine Tausch-Anfragen“.", fields: header("header", "nero") }],
  },
  {
    page: "collection",
    title: "Sammlung",
    url: "/collection",
    sections: [
      { id: "header", title: "Seitenkopf", where: "Grünes Band oben in der eigenen Sammlung.", fields: header("header", "verde") },
      { id: "empty", title: "Leere Sammlung", where: "Text, solange noch kein Trikot angelegt ist.", fields: [{ path: "empty", label: "Text", type: "text", max: 80 }] },
    ],
  },
  {
    page: "watchlist",
    title: "Merkliste",
    url: "/watchlist",
    sections: [{ id: "header", title: "Seitenkopf", where: "Schwarzes Band oben auf der Merkliste.", fields: header("header", "nero") }],
  },
  {
    page: "profile",
    title: "Profil",
    url: "/profile",
    sections: [
      {
        id: "texts",
        title: "Texte",
        where: "Grünes Band oben im eigenen Profil und der Sammlungs-Abschnitt darunter.",
        fields: [
          eyebrow("header.eyebrow"),
          headline("header.headline", "verde"),
          { ...eyebrow("collection.eyebrow"), label: "Sammlung: kleine Zeile" },
          { ...headline("collection.headline"), label: "Sammlung: Überschrift" },
          { path: "empty", label: "Text bei leerer Sammlung", type: "text", max: 80 },
        ],
      },
    ],
  },
  {
    page: "bids",
    title: "Meine Gebote",
    url: "/my-bids",
    sections: [{ id: "header", title: "Seitenkopf", where: "Grünes Band oben bei „Meine Gebote“.", fields: [eyebrow("header.eyebrow"), headline("header.headline", "verde")] }],
  },
  {
    page: "seller",
    title: "Verkäuferprofil",
    url: "/shop",
    sections: [
      {
        id: "texts",
        title: "Texte",
        where: "Öffentliches Profil eines Verkäufers (Name kommt automatisch).",
        fields: [
          eyebrow("eyebrow"),
          { ...eyebrow("jerseys.eyebrow"), label: "Trikots: kleine Zeile" },
          { ...headline("jerseys.headline"), label: "Trikots: Überschrift" },
          { path: "jerseys.empty", label: "Trikots: Text wenn leer", type: "text", max: 80 },
          { ...eyebrow("reviews.eyebrow"), label: "Bewertungen: kleine Zeile" },
          { ...headline("reviews.headline"), label: "Bewertungen: Überschrift" },
          { path: "reviews.none", label: "Bewertungen: Text wenn keine", type: "text", max: 60 },
        ],
      },
    ],
  },
  {
    page: "auth",
    title: "Login",
    url: "/auth",
    sections: [
      {
        id: "welcome",
        title: "Begrüßung",
        where: "Grüne Hälfte der Login-Seite und Überschrift über dem Formular.",
        fields: [
          eyebrow("eyebrow"),
          headline("headline", "verde"),
          { path: "points", label: "Stichpunkte", type: "list", itemLabel: "Stichpunkt" },
          { ...eyebrow("formEyebrow"), label: "Formular: kleine Zeile" },
          { path: "formTitle", label: "Formular: Überschrift", type: "text", max: 80 },
        ],
      },
    ],
  },
  {
    page: "onboarding",
    title: "Onboarding",
    url: "/onboarding",
    sections: [
      {
        id: "welcome",
        title: "Willkommen",
        where: "Erster Schritt nach der Registrierung.",
        fields: [
          eyebrow("header.eyebrow"),
          headline("header.headline", "verde"),
          { path: "welcome.headline", label: "Begrüßung", type: "text", max: 60 },
          { path: "welcome.intro", label: "Einleitung", type: "textarea", max: 160 },
          {
            path: "welcome.features",
            label: "Die drei Kacheln",
            type: "list",
            itemLabel: "Kachel",
            itemFields: [
              { key: "title", label: "Titel", type: "text" },
              { key: "text", label: "Text", type: "textarea" },
            ],
          },
        ],
      },
    ],
  },
  {
    page: "notfound",
    title: "Seite nicht gefunden (404)",
    url: "/diese-seite-gibt-es-nicht",
    sections: [
      {
        id: "texts",
        title: "Texte",
        where: "Erscheint bei falschen oder veralteten Links.",
        fields: [
          eyebrow("eyebrow"),
          headline("headline"),
          subline("text"),
          { path: "primaryCta", label: "Button 1", type: "text", max: 40 },
          { path: "secondaryCta", label: "Button 2", type: "text", max: 40 },
        ],
      },
    ],
  },
  {
    page: "footer",
    title: "Footer",
    url: "/",
    sections: [{ id: "claim", title: "Claim", where: "Satz unter dem Logo im grünen Footer.", fields: [{ path: "claim", label: "Claim", type: "textarea", max: 120 }] }],
  },
  {
    page: "site",
    title: "Allgemein",
    url: "/",
    sections: [
      {
        id: "announcement",
        title: "Hinweisband",
        where: "Schmales schwarzes Band ganz oben auf jeder Seite — z. B. für Beta-Hinweise oder Wartung.",
        fields: [
          { path: "announcement.enabled", label: "Hinweisband anzeigen", type: "toggle" },
          { path: "announcement.text", label: "Text", type: "text", max: 120 },
          { path: "announcement.linkLabel", label: "Link-Text (optional)", type: "text", max: 30 },
          { path: "announcement.linkUrl", label: "Link führt zu (optional)", hint: "/seite oder https://…", type: "link" },
        ],
      },
      {
        id: "contact",
        title: "Kontakt & Social",
        where: "Instagram-Link im Footer. (Die Impressums-E-Mail pflegst du unter „Rechtliches“.)",
        fields: [
          { path: "contact.instagramHandle", label: "Instagram-Name", hint: "z. B. @calcioclassics.de", type: "text", max: 40 },
          { path: "contact.instagramUrl", label: "Instagram-Link", type: "link" },
        ],
      },
    ],
  },
];
