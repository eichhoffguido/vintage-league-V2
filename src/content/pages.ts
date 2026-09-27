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
export interface TradeContent { header: PageHeaderContent }
export interface TradesContent { header: PageHeaderContent }
export interface CollectionContent { header: PageHeaderContent; empty: string }
export interface WatchlistContent { header: PageHeaderContent }
export interface AuthContent {
  eyebrow: string;
  headline: string;
  points: string[];
  formEyebrow: string;
  formTitle: string;
}
export interface OnboardingContent { header: { eyebrow: string; headline: string } }

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
    subline: "Dein persönliches Album. Lege fest, welche Trikots du tauschst und welche du verkaufst.",
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
};

export const ONBOARDING_CONTENT: OnboardingContent = {
  header: { eyebrow: "Benvenuto · Willkommen", headline: "Dein Start bei *Calcio Classics.*" },
};
