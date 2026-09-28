// Pflegbare Texte der übrigen Seiten (CC-C2). Standardwerte = heutige Texte; das CMS überschreibt sie
// pro Schlüssel (z. B. "shop.header.headline"). Überschriften: *Wort* = Outline, frei mischbar.
// Funktionale Beschriftungen (Filter, Formularfelder, Fehlermeldungen) bleiben bewusst im Code.

export interface PageHeaderContent {
  eyebrow: string;
  headline: string;
  subline: string;
}

export interface ShopContent { header: PageHeaderContent }
export interface CommunityContent {
  header: PageHeaderContent;
  teaser: { eyebrow: string; headline: string; text: string; cta: string };
}
export interface TradeContent { header: PageHeaderContent; empty: { title: string; text: string } }
export interface TradesContent { header: PageHeaderContent }
export interface CollectionContent { header: PageHeaderContent; empty: string }
export interface WatchlistContent { header: PageHeaderContent }
export interface AuthContent {
  eyebrow: string;
  headline: string;
  points: string[];
  formEyebrow: string;
  formTitle: string;
  /** Tab „Registrieren“ (CC-D2) */
  signup: { eyebrow: string; headline: string; formEyebrow: string; formTitle: string };
  /** Nach der Registrierung / nach „Passwort vergessen“ */
  checkMail: { headline: string; text: string; resetText: string };
  /** Seite /auth/reset — neues Passwort setzen */
  reset: { eyebrow: string; headline: string; text: string };
}
export interface OnboardingContent {
  header: { eyebrow: string; headline: string };
  welcome: { headline: string; intro: string; features: { title: string; text: string }[] };
}

export const SHOP_CONTENT: ShopContent = {
  header: {
    eyebrow: "Il mercato · Marktplatz",
    headline: "Der *Marktplatz.*",
    subline: "Authentische Trikots von Sammlern für Sammler — jedes Stück geprüft und fair eingeordnet.",
  },
};

export const COMMUNITY_CONTENT: CommunityContent = {
  header: {
    eyebrow: "La comunità · Community",
    headline: "Wissen *teilen.*",
    subline: "Tipps zur Restaurierung, Pflege und Lagerung — von Sammlern für Sammler.",
  },
  teaser: {
    eyebrow: "Solo membri · Nur für Mitglieder",
    headline: "Mitreden, *mitsammeln.*",
    text: "Die Community ist für angemeldete Sammler.",
    cta: "Anmelden und mitlesen →",
  },
};

export const TRADE_CONTENT: TradeContent = {
  header: {
    eyebrow: "Lo scambio · Tauschbörse",
    headline: "Die *Tauschbörse.*",
    subline: "Finde Trikots anderer Sammler und schlage einen Tausch vor.",
  },
  empty: {
    title: "Aktuell keine Trikots zum Tausch verfügbar.",
    text: "Markiere deine eigenen Trikots als tauschbar, um loszulegen.",
  },
};

export const TRADES_CONTENT: TradesContent = {
  header: {
    eyebrow: "Lo scambio · Tausch-Anfragen",
    headline: "Meine Tausch- *Anfragen.*",
    subline: "Eingehende und ausgehende Anfragen — annehmen, abschließen, bewerten.",
  },
};

export const COLLECTION_CONTENT: CollectionContent = {
  header: {
    eyebrow: "La mia collezione · Sammlung",
    headline: "Meine *Sammlung.*",
    subline: "Alle deine Trikots an einem Ort. Lege fest, welche Trikots du tauschst und welche du verkaufst.",
  },
  empty: "Noch keine Trikots in deiner Sammlung",
};

export const WATCHLIST_CONTENT: WatchlistContent = {
  header: {
    eyebrow: "La mia lista · Merkliste",
    headline: "Deine *Merkliste.*",
    subline: "Speichere Trikots, die dir gefallen, und behalte ihre Preise im Auge.",
  },
};

export const AUTH_CONTENT: AuthContent = {
  eyebrow: "Bentornato · Anmelden",
  headline: "Willkommen\n*zurück.*",
  points: [
    "Deine Sammlung verwalten und Trikots einstellen.",
    "Merkliste, Gebote und Tauschanfragen im Blick.",
    "Mit der Community Wissen teilen.",
  ],
  formEyebrow: "Accesso · Login",
  formTitle: "Melde dich an, um deine Sammlung zu verwalten.",
  signup: {
    eyebrow: "Benvenuto · Willkommen",
    headline: "Willkommen bei\n*Calcio Classics.*",
    formEyebrow: "Registrazione · Registrieren",
    formTitle: "Leg dein Konto an und starte deine Sammlung.",
  },
  checkMail: {
    headline: "Schau in dein Postfach.",
    text: "Wir haben dir einen Link geschickt. Klick darauf, um deine E-Mail-Adresse zu bestätigen — danach geht es direkt los.",
    resetText: "Falls ein Konto mit dieser Adresse existiert, haben wir dir einen Link für ein neues Passwort geschickt.",
  },
  reset: {
    eyebrow: "Sicurezza · Passwort",
    headline: "Neues\n*Passwort.*",
    text: "Wähle ein neues Passwort für dein Konto. Danach bist du direkt angemeldet.",
  },
};

export const ONBOARDING_CONTENT: OnboardingContent = {
  header: { eyebrow: "Benvenuto · Willkommen", headline: "Dein Start bei *Calcio Classics.*" },
  welcome: {
    headline: "Willkommen bei Calcio Classics!",
    intro: "Die Community-erste Plattform für den Handel mit Vintage-Fußballtrikots",
    features: [
      { title: "Deine Sammlung", text: "Katalogisiere deine Lieblings-Trikots und verwalte deine Sammlung" },
      { title: "Community", text: "Verbinde dich mit anderen Sammlern und tausche Trikots" },
      { title: "Marktplatz", text: "Entdecke Trikots von anderen Sammlern im Marktplatz" },
    ],
  },
};

// --- C2b (28.09.): weitere Seiten + seitenübergreifende Einstellungen -------------------------------

export interface DetailContent {
  verification: {
    eyebrow: string;
    label: string;
    verified: { headline: string; text: string };
    pending: { headline: string; text: string };
    unverified: { headline: string; text: string };
    points: { title: string; text: string }[];
  };
  historyEyebrow: string;
}
export interface ProfileContent {
  header: { eyebrow: string; headline: string };
  collection: { eyebrow: string; headline: string };
  empty: string;
}
export interface BidsContent { header: { eyebrow: string; headline: string } }
export interface OrdersContent {
  header: { eyebrow: string; headline: string; subline: string };
  empty: { sold: string; bought: string };
}
export interface SellerContent {
  eyebrow: string;
  jerseys: { eyebrow: string; headline: string; empty: string };
  reviews: { eyebrow: string; headline: string; none: string };
}
export interface NotFoundContent {
  eyebrow: string;
  headline: string;
  text: string;
  primaryCta: string;
  secondaryCta: string;
}
export interface FooterContent { claim: string }
export interface SiteSettings {
  contact: { email: string; instagramHandle: string; instagramUrl: string };
  /** Hinweisband ganz oben (z. B. „Private Beta“), im CMS ein-/ausschaltbar. */
  announcement: { enabled: boolean; text: string; linkLabel: string; linkUrl: string };
}

export const DETAIL_CONTENT: DetailContent = {
  verification: {
    eyebrow: "Verifica",
    label: "Echtheit & Prüfung",
    verified: {
      headline: "Geprüft und *verificato.*",
      text: "Dieses Trikot wurde von unserem Team geprüft: Stoff, Stickerei, Label und Flock.",
    },
    pending: {
      headline: "Prüfung *läuft.*",
      text: "Unser Team prüft dieses Trikot gerade. Bis dahin trägt es kein Verificato-Siegel.",
    },
    unverified: {
      headline: "Noch nicht *geprüft.*",
      text: "Dieses Trikot wurde noch nicht geprüft. Frag im Zweifel die Community nach einem Legit-Check.",
    },
    points: [
      { title: "Echtheitsprüfung", text: "Stoff, Label, Stickerei und Flock werden kontrolliert." },
      { title: "Faire Einordnung", text: "Marktwert aus über 22.000 Referenzpreisen." },
      { title: "Sicher bezahlen", text: "Bezahlung über Stripe — deine Kartendaten landen nie bei uns." },
    ],
  },
  historyEyebrow: "Storico · Preisverlauf",
};

export const PROFILE_CONTENT: ProfileContent = {
  header: { eyebrow: "Il mio profilo · Profil", headline: "Mein *Profil.*" },
  collection: { eyebrow: "La mia collezione · Sammlung", headline: "Meine *Sammlung.*" },
  empty: "Noch keine Trikots in deiner Sammlung",
};

export const BIDS_CONTENT: BidsContent = {
  header: { eyebrow: "Le mie offerte · Gebote", headline: "Meine *Gebote.*" },
};

export const ORDERS_CONTENT: OrdersContent = {
  header: {
    eyebrow: "I miei ordini · Käufe & Verkäufe",
    headline: "Käufe & *Verkäufe.*",
    subline: "Was du versenden musst und was gerade zu dir unterwegs ist.",
  },
  empty: {
    sold: "Du hast noch nichts verkauft.",
    bought: "Du hast noch nichts gekauft.",
  },
};

export const SELLER_CONTENT: SellerContent = {
  eyebrow: "Il venditore · Verkäufer",
  jerseys: { eyebrow: "Le maglie · Trikots", headline: "Verfügbare *Trikots.*", empty: "Noch keine Trikots eingestellt" },
  reviews: { eyebrow: "Le recensioni · Bewertungen", headline: "Letzte *Bewertungen.*", none: "Keine Bewertungen" },
};

export const NOTFOUND_CONTENT: NotFoundContent = {
  eyebrow: "Fuorigioco · Seite nicht gefunden",
  headline: "Im *Abseits.*",
  text: "Diese Seite gibt es nicht (mehr). Vielleicht wurde das Trikot schon verkauft — im Marktplatz warten viele andere.",
  primaryCta: "Zum Marktplatz →",
  secondaryCta: "Zur Startseite",
};

export const FOOTER_CONTENT: FooterContent = {
  claim: "Vintage-Fußballtrikots aus Deutschland — mit Herz für Calcio.",
};

export const SITE_SETTINGS: SiteSettings = {
  contact: {
    email: "kontakt@calcioclassics.de",
    instagramHandle: "@calcioclassics.de",
    instagramUrl: "https://instagram.com/calcioclassics.de",
  },
  announcement: {
    enabled: false,
    text: "Private Beta — Kaufen läuft im Testmodus.",
    linkLabel: "",
    linkUrl: "",
  },
};
