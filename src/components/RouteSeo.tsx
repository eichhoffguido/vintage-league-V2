import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/useSiteContent";
import { jerseyIdFromPath, jerseyMeta, pageMeta, type JerseyForSeo, type PageMeta } from "@/lib/seo";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "";
const JERSEY_FIELDS = "id, team, name, year, size, condition, league, sale_price_cents, price_cents, listing_type, image_urls, image_url";

/** Setzt ein Tag im <head> (legt es an, falls es fehlt) oder entfernt es bei content = null. */
function setHeadTag(selector: string, create: () => HTMLElement, attr: "content" | "href", value: string | null) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (value === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

const meta = (attr: "name" | "property", key: string) => () => {
  const el = document.createElement("meta");
  el.setAttribute(attr, key);
  return el;
};

function applyMeta(m: PageMeta) {
  document.title = m.title;
  setHeadTag('meta[name="description"]', meta("name", "description"), "content", m.description);
  setHeadTag('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }), "href", m.url);
  setHeadTag('meta[name="robots"]', meta("name", "robots"), "content", m.noindex ? "noindex" : null);
  setHeadTag('meta[property="og:title"]', meta("property", "og:title"), "content", m.title);
  setHeadTag('meta[property="og:description"]', meta("property", "og:description"), "content", m.description);
  setHeadTag('meta[property="og:url"]', meta("property", "og:url"), "content", m.url);
  setHeadTag('meta[property="og:image"]', meta("property", "og:image"), "content", m.image);
}

/**
 * CC-C5 — Titel, Beschreibung, Canonical und noindex beim Seitenwechsel (Browser-Tab, Google rendert die App).
 * Link-Vorschau-Bots ohne JavaScript bekommen dieselben Werte serverseitig aus middleware.ts.
 */
const RouteSeo = () => {
  const { pathname } = useLocation();
  const content = useSiteContent("seo");
  const jerseyId = jerseyIdFromPath(pathname);

  const { data: jersey } = useQuery({
    queryKey: ["jersey-seo", jerseyId],
    queryFn: async (): Promise<JerseyForSeo | null> => {
      const { data } = await supabase.from("user_jerseys").select(JERSEY_FIELDS).eq("id", jerseyId!).is("deleted_at", null).maybeSingle();
      return (data as JerseyForSeo | null) ?? null;
    },
    enabled: !!jerseyId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    applyMeta(jerseyId && jersey ? jerseyMeta(jersey, content, SUPABASE_URL) : pageMeta(pathname, content, SUPABASE_URL));
  }, [pathname, content, jerseyId, jersey]);

  return null;
};

export default RouteSeo;
