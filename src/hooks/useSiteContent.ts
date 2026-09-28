import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HOME_CONTENT, type HeroSlide, type HomeContent } from "@/content/home";
import {
  AUTH_CONTENT,
  COLLECTION_CONTENT,
  COMMUNITY_CONTENT,
  ONBOARDING_CONTENT,
  SHOP_CONTENT,
  TRADES_CONTENT,
  TRADE_CONTENT,
  WATCHLIST_CONTENT,
  DETAIL_CONTENT,
  PROFILE_CONTENT,
  BIDS_CONTENT,
  SELLER_CONTENT,
  NOTFOUND_CONTENT,
  FOOTER_CONTENT,
  SITE_SETTINGS,
  type DetailContent,
  type ProfileContent,
  type BidsContent,
  type SellerContent,
  type NotFoundContent,
  type FooterContent,
  type SiteSettings,
  type AuthContent,
  type CollectionContent,
  type CommunityContent,
  type OnboardingContent,
  type ShopContent,
  type TradeContent,
  type TradesContent,
  type WatchlistContent,
} from "@/content/pages";
import { SEO_CONTENT, type SeoContent } from "@/content/seo";
import { IMPRINT_DEFAULT, PRIVACY_DEFAULT_HTML, TERMS_DEFAULT_HTML, type ImprintContent } from "@/content/legal";

// ---------------------------------------------------------------------------
// Standardwerte je Seite. Ein CMS-Schlüssel ist "<seite>.<pfad>", z. B. "home.album.headline"
// oder "home.dealer.points" (ganze Liste). Fehlt ein Schlüssel, gilt der Standard — die Seite
// kann nie leer werden. CC-C3 baut die Formulare aus genau diesen Strukturen.
// ---------------------------------------------------------------------------
export interface SiteContentMap {
  home: HomeContent;
  shop: ShopContent;
  community: CommunityContent;
  trade: TradeContent;
  trades: TradesContent;
  collection: CollectionContent;
  watchlist: WatchlistContent;
  auth: AuthContent;
  onboarding: OnboardingContent;
  detail: DetailContent;
  profile: ProfileContent;
  bids: BidsContent;
  seller: SellerContent;
  notfound: NotFoundContent;
  footer: FooterContent;
  /** Seitenübergreifend: Kontakt, Social, Hinweisband */
  site: SiteSettings;
  /** Titel, Beschreibung, Vorschaubild je Seite (CC-C5) */
  seo: SeoContent;
}
export type SitePage = keyof SiteContentMap;

export const SITE_CONTENT_DEFAULTS: SiteContentMap = {
  home: HOME_CONTENT,
  shop: SHOP_CONTENT,
  community: COMMUNITY_CONTENT,
  trade: TRADE_CONTENT,
  trades: TRADES_CONTENT,
  collection: COLLECTION_CONTENT,
  watchlist: WATCHLIST_CONTENT,
  auth: AUTH_CONTENT,
  onboarding: ONBOARDING_CONTENT,
  detail: DETAIL_CONTENT,
  profile: PROFILE_CONTENT,
  bids: BIDS_CONTENT,
  seller: SELLER_CONTENT,
  notfound: NOTFOUND_CONTENT,
  footer: FOOTER_CONTENT,
  site: SITE_SETTINGS,
  seo: SEO_CONTENT,
};

export interface SiteContentRow {
  key: string;
  value: unknown;
  updated_at: string;
  updated_by?: string | null;
}

const SITE_MEDIA_BUCKET = "site-media";

/** Öffentliche URL einer Datei im Bucket site-media (Pfade wie "defaults/hero-maglia.webp"). */
export const siteMediaUrl = (path: string) =>
  supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;

/** Bildwert aus dem CMS: Storage-Pfad → URL; volle URLs/Assets bleiben unverändert. */
const resolveImage = (value: string) => (/^(https?:|\/|data:)/.test(value) ? value : siteMediaUrl(value));

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Passt ein CMS-Wert zur Form des Standardwerts? (Text ↔ Text, Liste ↔ Liste gleicher Einträge …) */
function matchesShape(def: unknown, val: unknown): boolean {
  if (typeof def === "string") return typeof val === "string";
  if (Array.isArray(def)) {
    if (!Array.isArray(val)) return false;
    return def.length === 0 || val.every((item) => matchesShape(def[0], item));
  }
  if (isRecord(def)) {
    return isRecord(val) && Object.keys(val).every((k) => !(k in def) || matchesShape(def[k], val[k]));
  }
  return typeof def === typeof val;
}

/** Legt einen CMS-Wert über den Standard. Leere Texte gelten als „nicht gepflegt“ → Standard bleibt. */
function overlay(def: unknown, val: unknown, isImage: boolean): unknown {
  if (typeof def === "string") {
    const text = val as string;
    if (text.trim() === "") return def;
    return isImage ? resolveImage(text) : text;
  }
  if (isRecord(def) && isRecord(val)) {
    const out: Record<string, unknown> = { ...def };
    for (const k of Object.keys(val)) {
      if (k in def) out[k] = overlay(def[k], val[k], /image$/i.test(k));
    }
    return out;
  }
  return val;
}

export function mergeSiteContent<T>(page: string, defaults: T, rows: SiteContentRow[] | undefined): T {
  if (!rows || rows.length === 0) return defaults;
  const result = structuredClone(defaults) as unknown as Record<string, unknown>;
  const prefix = `${page}.`;
  for (const row of rows) {
    if (!row.key.startsWith(prefix)) continue;
    const path = row.key.slice(prefix.length).split(".");
    let parent: Record<string, unknown> | undefined = result;
    for (const seg of path.slice(0, -1)) {
      const next: unknown = parent?.[seg];
      parent = isRecord(next) ? next : undefined;
    }
    const leaf = path[path.length - 1];
    if (!parent || !(leaf in parent) || !matchesShape(parent[leaf], row.value)) continue;
    parent[leaf] = overlay(parent[leaf], row.value, /image$/i.test(leaf));
  }
  return result as unknown as T;
}

/** Alle CMS-Einträge (klein, einmal geladen, von allen Seiten geteilt). */
export function useSiteContentRows() {
  return useQuery({
    queryKey: ["site-content"],
    queryFn: async (): Promise<SiteContentRow[]> => {
      const { data, error } = await supabase.from("site_content").select("key, value, updated_at, updated_by");
      if (error) throw error;
      return (data ?? []) as SiteContentRow[];
    },
    staleTime: 60 * 1000,
  });
}

// --- Startseite: Hero-Slides und FAQ kommen aus eigenen Tabellen -----------------------------------
function useHeroSlides(enabled: boolean) {
  return useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("label, subline, image_path, image_alt, caption, stamp")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("sort");
      if (error) throw error;
      return data ?? [];
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

function useFaqItems(enabled: boolean) {
  return useQuery({
    queryKey: ["faq-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("question, answer")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("sort");
      if (error) throw error;
      return data ?? [];
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Pflegbare Inhalte einer Seite: Standardwerte aus src/content/*, überlagert mit den CMS-Einträgen.
 * Startseite zusätzlich mit Hero-Slides und FAQ aus der Datenbank (leer → Standard).
 */
export function useSiteContent<K extends SitePage>(page: K): SiteContentMap[K] {
  const { data: rows } = useSiteContentRows();
  const isHome = page === "home";
  const { data: slides } = useHeroSlides(isHome);
  const { data: faq } = useFaqItems(isHome);

  return useMemo(() => {
    const merged = mergeSiteContent(page, SITE_CONTENT_DEFAULTS[page], rows);
    if (!isHome) return merged;

    const home = merged as HomeContent;
    const defaultSlides = HOME_CONTENT.hero.slides;
    const heroSlides: HeroSlide[] =
      slides && slides.length > 0
        ? slides.map((s, i) => ({
            label: s.label,
            subline: s.subline,
            image: s.image_path ? siteMediaUrl(s.image_path) : defaultSlides[i % defaultSlides.length].image,
            imageAlt: s.image_alt,
            caption: s.caption,
            stamp: s.stamp ?? [],
          }))
        : home.hero.slides;
    const faqItems = faq && faq.length > 0 ? faq : home.faq.items;

    return {
      ...home,
      hero: { ...home.hero, slides: heroSlides },
      faq: { ...home.faq, items: faqItems },
    } as SiteContentMap[K];
  }, [page, rows, isHome, slides, faq]);
}

// --- Rechtstexte ------------------------------------------------------------------------------------
export interface LegalContent {
  imprint: ImprintContent;
  privacyHtml: string;
  /** Zeitpunkt der letzten Änderung des Datenschutztexts im CMS (sonst null). */
  privacyUpdatedAt: string | null;
  /** AGB (leer, bis gepflegt) */
  termsHtml: string;
  termsUpdatedAt: string | null;
}

export function useLegalContent(): LegalContent {
  const { data: rows } = useSiteContentRows();
  return useMemo(() => {
    const imprintRow = rows?.find((r) => r.key === "legal.imprint");
    const privacyRow = rows?.find((r) => r.key === "legal.privacy");
    const termsRow = rows?.find((r) => r.key === "legal.terms");
    const htmlOf = (row: SiteContentRow | undefined) =>
      row && isRecord(row.value) && typeof row.value.html === "string" ? row.value.html : "";
    const terms = htmlOf(termsRow);

    const imprint: ImprintContent = { ...IMPRINT_DEFAULT };
    if (imprintRow && isRecord(imprintRow.value)) {
      for (const k of Object.keys(IMPRINT_DEFAULT) as (keyof ImprintContent)[]) {
        const v = imprintRow.value[k];
        if (typeof v === "string") imprint[k] = v;
      }
    }

    const html = privacyRow && isRecord(privacyRow.value) && typeof privacyRow.value.html === "string"
      ? privacyRow.value.html
      : "";

    return {
      imprint,
      privacyHtml: html.trim() ? html : PRIVACY_DEFAULT_HTML,
      privacyUpdatedAt: html.trim() ? privacyRow!.updated_at : null,
      termsHtml: terms.trim() ? terms : TERMS_DEFAULT_HTML,
      termsUpdatedAt: terms.trim() ? termsRow!.updated_at : null,
    };
  }, [rows]);
}
