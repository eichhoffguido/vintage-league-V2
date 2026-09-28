// CC-C5 — Meta-Tags je Seite. Gemeinsam genutzt von middleware.ts (Link-Vorschau-Bots wie WhatsApp bekommen
// die Tags ohne JavaScript) und vom Browser (Titel, Beschreibung, Canonical beim Seitenwechsel).
// Nur relative Imports ohne Vite-Abhängigkeiten — sonst lässt sich die Datei in api/ nicht bündeln.
import { SEO_CONTENT, SEO_DEFAULT_IMAGE, type SeoContent, type SeoEntry, type SeoPageKey } from "../content/seo";
import { CONDITION_LABELS } from "../data/condition";

/** Kanonische Adresse — immer die Hauptdomain, auch auf Vercel-Previews. */
export const SEO_ORIGIN = "https://calcioclassics.de";
const BRAND = "Calcio Classics";

export interface PageMeta {
  title: string;
  description: string;
  /** Absolute Bild-URL */
  image: string;
  /** Absolute kanonische URL */
  url: string;
  type: "website" | "product";
  noindex: boolean;
}

export interface JerseyForSeo {
  id: string;
  team: string;
  name: string;
  year: string;
  size: string;
  condition: number;
  league?: string | null;
  sale_price_cents: number | null;
  price_cents: number | null;
  listing_type: string | null;
  image_urls: string[] | null;
  image_url: string | null;
}

// --- Seiten -----------------------------------------------------------------------------------------

const PAGE_BY_PATH: Record<string, SeoPageKey> = {
  "/": "home",
  "/shop": "shop",
  "/community": "community",
  "/trade": "trade",
  "/imprint": "imprint",
  "/privacy": "privacy",
  "/agb": "terms",
};

/** Konto-, Admin- und Mitgliederbereiche: nicht in Suchmaschinen. */
const PRIVATE_PREFIXES = [
  "/auth",
  "/onboarding",
  "/collection",
  "/profile",
  "/watchlist",
  "/favorites",
  "/my-bids",
  "/orders",
  "/admin",
  "/trades",
  "/success",
  "/community/",
];

export const normalizePath = (path: string) => {
  const clean = (path.split(/[?#]/)[0] || "/").replace(/\/+$/, "");
  return clean === "" ? "/" : clean.startsWith("/") ? clean : `/${clean}`;
};

export const seoPageForPath = (path: string): SeoPageKey => PAGE_BY_PATH[normalizePath(path)] ?? "default";

export const isPrivatePath = (path: string) => {
  const p = normalizePath(path);
  return PRIVATE_PREFIXES.some((prefix) => (prefix.endsWith("/") ? p.startsWith(prefix) : p === prefix || p.startsWith(`${prefix}/`)));
};

/** Trikot-Detailseite? Liefert die ID. */
export const jerseyIdFromPath = (path: string): string | null => {
  const match = /^\/jersey\/([0-9a-f-]{36})$/i.exec(normalizePath(path));
  return match ? match[1] : null;
};

/** CMS-Zeilen "seo.<seite>.<feld>" über die Standardwerte legen (leere Texte = Standard). */
export function mergeSeoContent(rows: { key: string; value: unknown }[] | null | undefined): SeoContent {
  const out = structuredClone(SEO_CONTENT);
  for (const row of rows ?? []) {
    const [prefix, page, field] = row.key.split(".");
    if (prefix !== "seo" || !(page in out) || !field) continue;
    const entry = out[page as SeoPageKey] as unknown as Record<string, string>;
    if (field in entry && typeof row.value === "string" && row.value.trim() !== "") entry[field] = row.value.trim();
  }
  return out;
}

/** Bildwert → absolute URL (Storage-Pfad in site-media, Pfad in public/ oder volle URL). */
export function resolveSeoImage(value: string, supabaseUrl: string): string {
  if (!value) return `${SEO_ORIGIN}${SEO_DEFAULT_IMAGE}`;
  if (/^https?:\/\//.test(value)) return value;
  if (value.startsWith("/")) return `${SEO_ORIGIN}${value}`;
  return `${supabaseUrl}/storage/v1/object/public/site-media/${value}`;
}

export function pageMeta(path: string, content: SeoContent, supabaseUrl: string): PageMeta {
  const page = seoPageForPath(path);
  const entry: SeoEntry = content[page];
  const fallback = content.default;
  const normalized = normalizePath(path);
  return {
    title: entry.title || fallback.title,
    description: entry.description || fallback.description,
    image: resolveSeoImage(entry.image || fallback.image, supabaseUrl),
    url: `${SEO_ORIGIN}${normalized === "/" ? "/" : normalized}`,
    type: "website",
    noindex: isPrivatePath(path),
  };
}

// --- Trikots ----------------------------------------------------------------------------------------

const formatEuros = (cents: number) =>
  `${new Intl.NumberFormat("de-DE", { minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(cents / 100)} €`;

function jerseyImage(jersey: JerseyForSeo, supabaseUrl: string): string | null {
  const first = jersey.image_urls?.find(Boolean) ?? jersey.image_url;
  if (!first) return null;
  if (/^https?:\/\//.test(first)) return first;
  return `${supabaseUrl}/storage/v1/object/public/jersey-images/${first}`;
}

/** Titel/Beschreibung/Bild einer Trikot-Seite automatisch aus den Trikot-Daten. */
export function jerseyMeta(jersey: JerseyForSeo, content: SeoContent, supabaseUrl: string): PageMeta {
  const season = jersey.year?.trim();
  const heading = [jersey.team, season].filter(Boolean).join(" ");
  const title = `${heading}${jersey.name && jersey.name !== jersey.team ? ` – ${jersey.name}` : ""} | ${BRAND}`;

  const price = jersey.sale_price_cents ?? jersey.price_cents;
  const offer =
    jersey.listing_type === "trade_only"
      ? "Nur zum Tausch."
      : price
        ? `${formatEuros(price)}${jersey.listing_type === "both" ? " oder Tausch" : ""}.`
        : "";
  const facts = [
    jersey.size ? `Größe ${jersey.size}` : "",
    CONDITION_LABELS[jersey.condition] ? `Zustand: ${CONDITION_LABELS[jersey.condition]}` : "",
  ].filter(Boolean);
  const description = [`Vintage-Trikot ${heading}.`, facts.length ? `${facts.join(", ")}.` : "", offer, `Jetzt auf ${BRAND} ansehen.`]
    .filter(Boolean)
    .join(" ");

  return {
    title,
    description,
    image: jerseyImage(jersey, supabaseUrl) ?? resolveSeoImage(content.default.image, supabaseUrl),
    url: `${SEO_ORIGIN}/jersey/${jersey.id}`,
    type: "product",
    noindex: false,
  };
}

// --- HTML -------------------------------------------------------------------------------------------

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Die Meta-Tags als HTML (für die Bot-Antwort der Middleware). */
export function renderSeoTags(meta: PageMeta): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const img = escapeHtml(meta.image);
  const url = escapeHtml(meta.url);
  const defaultImage = meta.image.endsWith(SEO_DEFAULT_IMAGE);
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}">`,
    `<link rel="canonical" href="${url}">`,
    meta.noindex ? `<meta name="robots" content="noindex">` : "",
    `<meta property="og:type" content="${meta.type}">`,
    `<meta property="og:site_name" content="${BRAND}">`,
    `<meta property="og:locale" content="de_DE">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:image" content="${img}">`,
    // Maße nur beim Standardbild bekannt (1200×630)
    defaultImage ? `<meta property="og:image:width" content="1200">` : "",
    defaultImage ? `<meta property="og:image:height" content="630">` : "",
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${t}">`,
    `<meta name="twitter:description" content="${d}">`,
    `<meta name="twitter:image" content="${img}">`,
  ]
    .filter(Boolean)
    .join("\n    ");
}

/** Vollständige Mini-Seite für Link-Vorschau-Bots: nur Kopf + Link zur echten Seite. */
export function renderPreviewPage(meta: PageMeta): string {
  const url = escapeHtml(meta.url);
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8">
    ${renderSeoTags(meta)}
  </head>
  <body>
    <h1>${escapeHtml(meta.title)}</h1>
    <p>${escapeHtml(meta.description)}</p>
    <p><a href="${url}">${url}</a></p>
  </body>
</html>
`;
}

/** Link-Vorschau-Dienste (kein JavaScript). Suchmaschinen gehören bewusst nicht dazu — sie rendern die App. */
const PREVIEW_BOT = /facebookexternalhit|facebot|whatsapp|twitterbot|slackbot|linkedinbot|telegrambot|discordbot|pinterest|redditbot|skypeuripreview|mastodon|embedly|vkshare|snapchat|viber|iframely|bluesky|cardyb/i;

export const isPreviewBot = (userAgent: string | null | undefined) => !!userAgent && PREVIEW_BOT.test(userAgent);

// --- Sitemap ----------------------------------------------------------------------------------------

export const SITEMAP_STATIC: { path: string; changefreq: string; priority: string }[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/imprint", changefreq: "yearly", priority: "0.2" },
  { path: "/privacy", changefreq: "yearly", priority: "0.2" },
];

export function sitemapXml(jerseys: { id: string; updated_at: string }[], includeTerms: boolean): string {
  const urls = [...SITEMAP_STATIC, ...(includeTerms ? [{ path: "/agb", changefreq: "yearly", priority: "0.2" }] : [])].map(
    (u) => `  <url><loc>${SEO_ORIGIN}${u.path}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  );
  for (const j of jerseys) {
    const lastmod = j.updated_at ? `<lastmod>${j.updated_at.slice(0, 10)}</lastmod>` : "";
    urls.push(`  <url><loc>${SEO_ORIGIN}/jersey/${j.id}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.7</priority></url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
