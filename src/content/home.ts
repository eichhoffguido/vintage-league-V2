// Inhalte der Startseite (freigegebenes Design „Runde 4 – Il tuo album“).
// Ab CC-C2 kommen diese Werte aus dem CMS (Supabase); die Datei bleibt als Rückfall-Standard.
import heroMaglia from "@/assets/home/hero-maglia.webp";
import heroCimeli from "@/assets/home/detail-stitch.webp";
import heroRarita from "@/assets/home/p-crest.webp";
import dealerImage from "@/assets/home/wall-frames.webp";
import swapLeft from "@/assets/home/stripes.webp";
import swapRight from "@/assets/home/collar.webp";
import communityImage from "@/assets/home/hands.webp";

export interface HeroSlide {
  label: string;
  subline: string;
  image: string;
  imageAlt: string;
  caption: string;
  stamp: string[];
}

export interface HomeContent {
  hero: {
    /** CMS-Überschrift: *Wort* = Outline, Zeilenumbruch = neue Zeile */
    headline: string;
    searchPlaceholder: string;
    primaryCta: { label: string; to: string };
    secondaryCta: { label: string };
    stats: { jerseys: string; profiles: string; trades: string };
    slides: HeroSlide[];
  };
  album: { eyebrow: string; headline: string; subline: string; allLabel: string };
  trust: { eyebrow: string; label: string; ticker: string[]; features: { title: string; description: string }[] };
  dealer: {
    eyebrow: string;
    headline: string;
    subline: string;
    image: string;
    imageAlt: string;
    points: { title: string; text: string }[];
    primaryCta: { label: string; to: string };
    secondaryCta: { label: string; to: string };
  };
  swap: {
    eyebrow: string;
    word: string;
    headline: string;
    text: string;
    offer: { label: string; caption: string; image: string };
    search: { label: string; caption: string; image: string };
    primaryCta: { label: string; to: string };
    secondaryCta: { label: string; to: string };
    countLabel: string;
  };
  community: {
    eyebrow: string;
    headline: string;
    text: string;
    topics: { title: string; hint: string }[];
    cta: { label: string; to: string };
    image: string;
    imageAlt: string;
    caption: string;
  };
  faq: { eyebrow: string; headline: string; text: string; items: { question: string; answer: string }[] };
}

export const HOME_CONTENT: HomeContent = {
  hero: {
    headline: "Il tuo\nalbum di\n*maglie.*",
    searchPlaceholder: "Trikot, Verein, Spieler …",
    primaryCta: { label: "Kollektion entdecken →", to: "/shop" },
    secondaryCta: { label: "Trikot verkaufen" },
    stats: { jerseys: "Zertifizierte Trikots", profiles: "Sammler & Händler", trades: "Erfolgreiche Trades" },
    slides: [
      {
        label: "Maglie",
        subline:
          "Authentische Vintage-Trikots kaufen und verkaufen. Jedes Stück geprüft, jeder Preis fair eingeordnet — wie ein Stickeralbum, nur mit echten Stücken.",
        image: heroMaglia,
        imageAlt: "Gestreiftes Vintage-Trikot auf einem Holztisch",
        caption: "Maglia N° 001 · Anni '70",
        stamp: ["Verificato", "Grado 4/5", "Taglia M"],
      },
      {
        label: "Cimeli",
        subline:
          "Memorabilia aus den goldenen Ären des Fußballs — Aufnäher, Flock, Etiketten. Jedes Detail erzählt, woher ein Trikot kommt.",
        image: heroCimeli,
        imageAlt: "Gestickter Aufnäher auf dunklem Trikotstoff",
        caption: "Cimeli · Stickerei & Flock",
        stamp: ["Verificato", "Originale"],
      },
      {
        label: "Rarità",
        subline:
          "Seltene Fundstücke mit Geschichte — kuratiert, geprüft und fair eingeordnet für echte Kenner.",
        image: heroRarita,
        imageAlt: "Weißes Trikot mit gesticktem Wappen und Stern",
        caption: "Rarità · Pezzo unico",
        stamp: ["Rarità", "Pezzo unico"],
      },
    ],
  },
  album: {
    eyebrow: "Figurine · Nuovi arrivi",
    headline: "Neu im *Album.*",
    subline: "Handverlesene Trikots — frisch kuratiert für Sammler.",
    allLabel: "Alle anzeigen →",
  },
  trust: {
    eyebrow: "Perché Calcio Classics",
    label: "Authentizitätsgarantie",
    ticker: ["Jedes Stück geprüft", "22.000+ Referenzpreise", "Kaufen · Bieten · Sammeln", "Hosting in der EU"],
    features: [
      { title: "Echtheitszertifikat", description: "Jedes Stück wird von Experten geprüft und zertifiziert." },
      { title: "Sammlerstücke", description: "Kuratierte Auswahl seltener und historischer Trikots." },
      { title: "Versicherter Versand", description: "Sorgfältig verpackt und weltweit versichert." },
      { title: "Käuferschutz", description: "Geld-zurück-Garantie bei Nicht-Authentizität." },
    ],
  },
  dealer: {
    eyebrow: "Per i commercianti · Für Händler",
    headline: "Deine Bühne für besondere *Trikots.*",
    subline:
      "Präsentiere deine Raritäten einer leidenschaftlichen Community — in einem Umfeld, das Qualität und Authentizität in den Mittelpunkt stellt.",
    image: dealerImage,
    imageAlt: "Gerahmte Vintage-Trikots an einer Wohnzimmerwand",
    points: [
      { title: "Reichweite & Community", text: "Sammler und Liebhaber, die echtes Interesse an deinen Stücken haben." },
      { title: "Zertifizierung & Vertrauen", text: "Echtheitsprüfung und Händler-Siegel stärken das Vertrauen deiner Käufer." },
      { title: "Präsentation & Tools", text: "Hochwertige Produktseiten, Händler-Dashboard, Verkaufsstatistiken." },
    ],
    primaryCta: { label: "Händler werden →", to: "/auth" },
    secondaryCta: { label: "Kollektion ansehen", to: "/shop" },
  },
  swap: {
    eyebrow: "Lo scambio · Trikottausch",
    word: "Scambio.",
    headline: "Trikot gegen *Trikot.*",
    text: "Der klassische Trikottausch — digital. Finde Sammler mit den Raritäten, die dir fehlen, und biete deine eigenen Schätze zum Tausch an.",
    offer: { label: "Biete", caption: "Rosso-Nero · Home · 1991–92 · L", image: swapLeft },
    search: { label: "Suche", caption: "Azzurro · Home · 1990–91 · M", image: swapRight },
    primaryCta: { label: "⇄ Tauschbörse entdecken", to: "/shop?tradeable=true" },
    secondaryCta: { label: "Jetzt registrieren", to: "/auth" },
    countLabel: "Trikots zum Tausch",
  },
  community: {
    eyebrow: "La comunità · Community",
    headline: "Wissen teilen, voneinander *lernen.*",
    text: "Restaurierung, Pflege, Echtheitsprüfung — die Community teilt ihr Wissen rund um Vintage-Trikots.",
    topics: [
      { title: "Restaurierung", hint: "Anleitungen & Tipps" },
      { title: "Echtheitsprüfung", hint: "Original oder Fälschung" },
      { title: "Pflege & Lagerung", hint: "Für die Ewigkeit" },
    ],
    cta: { label: "Community entdecken →", to: "/community" },
    image: communityImage,
    imageAlt: "Hände prüfen die Naht eines gestreiften Trikots",
    caption: "Legit-Check · Naht, Label, Stoff",
  },
  faq: {
    eyebrow: "Domande · FAQ",
    headline: "Häufig gestellte *Fragen.*",
    text: "Noch etwas offen? Die Community hilft — oder schreib uns direkt.",
    items: [
      {
        question: "Was ist Calcio Classics?",
        answer:
          "Ein Marktplatz von Sammlern für Sammler: authentische Vintage-Fußballtrikots kaufen und verkaufen — mit Community und Preistransparenz.",
      },
      {
        question: "Wie funktioniert das Kaufen?",
        answer:
          "Trikot finden, „Sofort kaufen“ oder ein Gebot abgeben. Der Verkäufer nimmt an — bezahlt wird sicher über unseren Zahlungspartner.",
      },
      {
        question: "Was bedeutet die Prüfung?",
        answer:
          "Eingestellte Trikots werden von uns geprüft; verifizierte Stücke tragen ein Badge. So bleibt der Marktplatz vertrauenswürdig.",
      },
      {
        question: "Wie wird der Marktwert ermittelt?",
        answer:
          "Aus über 22.000 Referenzpreisen vergleichbarer Trikots. Die Skala dient der Einordnung — den Verkaufspreis bestimmst du selbst.",
      },
      {
        question: "Was kostet die Nutzung?",
        answer:
          "Registrieren, sammeln und stöbern ist kostenlos. Beim Verkauf fällt eine Transaktionsgebühr über den Zahlungsanbieter an.",
      },
      {
        question: "Wie verkaufe ich ein Trikot?",
        answer: "In deiner Sammlung anlegen, Fotos hochladen, „Zum Verkauf“ aktivieren, Preis setzen — fertig.",
      },
      {
        question: "Wie sicher sind meine Daten?",
        answer: "Hosting in der EU, DSGVO-konform. Details in der Datenschutzerklärung.",
      },
    ],
  },
};
