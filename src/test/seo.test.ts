import { describe, expect, it } from "vitest";
import { SEO_CONTENT } from "@/content/seo";
import {
  isPreviewBot,
  isPrivatePath,
  jerseyIdFromPath,
  jerseyMeta,
  mergeSeoContent,
  pageMeta,
  renderPreviewPage,
  seoPageForPath,
  sitemapXml,
  type JerseyForSeo,
} from "@/lib/seo";

const SB = "https://example.supabase.co";
const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

const jersey: JerseyForSeo = {
  id: ID,
  team: "AC Milan",
  name: "Heimtrikot",
  year: "1994/95",
  size: "L",
  condition: 4,
  league: "Serie A",
  sale_price_cents: 18900,
  price_cents: null,
  listing_type: "both",
  image_urls: ["user/abc.jpg"],
  image_url: null,
};

describe("Seiten", () => {
  it("ordnet Adressen den SEO-Seiten zu", () => {
    expect(seoPageForPath("/")).toBe("home");
    expect(seoPageForPath("/shop?leagues=serie-a")).toBe("shop");
    expect(seoPageForPath("/shop/")).toBe("shop");
    expect(seoPageForPath("/agb")).toBe("terms");
    expect(seoPageForPath("/seller/123")).toBe("default");
  });

  it("markiert Konto- und Mitgliederbereiche als noindex", () => {
    expect(isPrivatePath("/collection")).toBe(true);
    expect(isPrivatePath("/auth/reset")).toBe(true);
    expect(isPrivatePath("/admin/cms")).toBe(true);
    expect(isPrivatePath("/community/abc")).toBe(true);
    expect(isPrivatePath("/community")).toBe(false);
    expect(isPrivatePath("/shop")).toBe(false);
    expect(isPrivatePath("/authors")).toBe(false);
  });

  it("erkennt Trikot-Seiten", () => {
    expect(jerseyIdFromPath(`/jersey/${ID}`)).toBe(ID);
    expect(jerseyIdFromPath("/jersey/kein-uuid")).toBeNull();
  });

  it("legt CMS-Werte über die Standards, leere Texte zählen nicht", () => {
    const merged = mergeSeoContent([
      { key: "seo.shop.title", value: "Shop | CC" },
      { key: "seo.shop.description", value: "  " },
      { key: "seo.unbekannt.title", value: "x" },
      { key: "home.hero.headline", value: "y" },
    ]);
    expect(merged.shop.title).toBe("Shop | CC");
    expect(merged.shop.description).toBe(SEO_CONTENT.shop.description);
    expect(SEO_CONTENT.shop.title).not.toBe("Shop | CC"); // Standard bleibt unverändert
  });

  it("baut Meta-Daten mit kanonischer Hauptdomain und Standardbild", () => {
    const meta = pageMeta("/shop?leagues=serie-a", SEO_CONTENT, SB);
    expect(meta.url).toBe("https://calcioclassics.de/shop");
    expect(meta.image).toBe("https://calcioclassics.de/og-calcio-classics.jpg");
    expect(meta.noindex).toBe(false);
  });

  it("löst Storage-Pfade aus dem CMS auf", () => {
    const content = mergeSeoContent([{ key: "seo.home.image", value: "seo/home.jpg" }]);
    expect(pageMeta("/", content, SB).image).toBe(`${SB}/storage/v1/object/public/site-media/seo/home.jpg`);
  });
});

describe("Trikot-Seiten", () => {
  it("erzeugt Titel, Beschreibung und Bild aus dem Trikot", () => {
    const meta = jerseyMeta(jersey, SEO_CONTENT, SB);
    expect(meta.title).toBe("AC Milan 1994/95 – Heimtrikot | Calcio Classics");
    expect(meta.description).toContain("Größe L");
    expect(meta.description).toContain("Zustand: Sehr gut");
    expect(meta.description).toContain("189 € oder Tausch.");
    expect(meta.image).toBe(`${SB}/storage/v1/object/public/jersey-images/user/abc.jpg`);
    expect(meta.url).toBe(`https://calcioclassics.de/jersey/${ID}`);
    expect(meta.type).toBe("product");
  });

  it("zeigt bei reinen Tauschangeboten keinen Preis und fällt ohne Foto aufs Standardbild zurück", () => {
    const meta = jerseyMeta({ ...jersey, listing_type: "trade_only", image_urls: [], image_url: null }, SEO_CONTENT, SB);
    expect(meta.description).toContain("Nur zum Tausch.");
    expect(meta.description).not.toContain("€");
    expect(meta.image).toBe("https://calcioclassics.de/og-calcio-classics.jpg");
  });
});

describe("HTML für Link-Vorschau-Bots", () => {
  it("maskiert Nutzertexte", () => {
    const html = renderPreviewPage(jerseyMeta({ ...jersey, team: 'Inter "<b>' }, SEO_CONTENT, SB));
    expect(html).toContain("Inter &quot;&lt;b&gt;");
    expect(html).not.toContain("<b>");
  });

  it("setzt Bildmaße nur beim Standardbild", () => {
    expect(renderPreviewPage(pageMeta("/", SEO_CONTENT, SB))).toContain('og:image:width" content="1200"');
    expect(renderPreviewPage(jerseyMeta(jersey, SEO_CONTENT, SB))).not.toContain("og:image:width");
  });

  it("erkennt Vorschau-Dienste, aber keine Suchmaschinen oder Browser", () => {
    expect(isPreviewBot("WhatsApp/2.23.20.0")).toBe(true);
    expect(isPreviewBot("facebookexternalhit/1.1 Facebot Twitterbot/1.0")).toBe(true); // iMessage
    expect(isPreviewBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(false);
    expect(isPreviewBot("Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Safari/605.1.15")).toBe(false);
    expect(isPreviewBot(null)).toBe(false);
  });
});

describe("Sitemap", () => {
  it("enthält feste Seiten, Trikots und die AGB nur mit Text", () => {
    const xml = sitemapXml([{ id: ID, updated_at: "2026-09-28T10:00:00Z" }], false);
    expect(xml).toContain("<loc>https://calcioclassics.de/shop</loc>");
    expect(xml).toContain(`<loc>https://calcioclassics.de/jersey/${ID}</loc><lastmod>2026-09-28</lastmod>`);
    expect(xml).not.toContain("/agb");
    expect(sitemapXml([], true)).toContain("/agb");
  });
});
