// CC-C5 — Dynamische Sitemap: öffentliche Seiten + alle angebotenen Trikots. /sitemap.xml wird per vercel.json
// hierher umgeleitet. Community, Tauschbörse und Konto sind nur für Mitglieder und deshalb nicht enthalten.
import { sitemapXml } from "../src/lib/seo";
import { rest } from "./_supabase";

export const config = { runtime: "edge" };

export default async function handler(): Promise<Response> {
  let jerseys: { id: string; updated_at: string }[] = [];
  let includeTerms = false;

  try {
    jerseys = await rest<{ id: string; updated_at: string }[]>(
      "user_jerseys?select=id,updated_at&deleted_at=is.null&listing_type=in.(buy_now,both,trade_only)&order=updated_at.desc&limit=5000",
    );
  } catch {
    // Ohne Datenbank wenigstens die festen Seiten ausliefern
  }
  try {
    const [terms] = await rest<{ value: { html?: string } | null }[]>("site_content?select=value&key=eq.legal.terms");
    includeTerms = typeof terms?.value?.html === "string" && terms.value.html.trim() !== "";
  } catch {
    // AGB-Link bleibt dann weg
  }

  return new Response(sitemapXml(jerseys, includeTerms), {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=3600" },
  });
}
