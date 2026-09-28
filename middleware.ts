// CC-C5 — Vercel Routing Middleware: Link-Vorschau-Dienste (WhatsApp, iMessage, Facebook, Slack …) führen kein
// JavaScript aus und sähen sonst auf jeder Seite dieselben Tags aus index.html. Sie bekommen hier eine Mini-Seite
// mit den passenden Tags (CMS „SEO & Link-Vorschau“, Trikot-Seiten automatisch).
// Alle anderen Anfragen (Menschen, Google) laufen unverändert weiter; bei Fehlern ebenfalls.
import { isPreviewBot, jerseyIdFromPath, jerseyMeta, mergeSeoContent, pageMeta, renderPreviewPage, type JerseyForSeo } from "./src/lib/seo";
import { rest, supabaseUrl } from "./api/_supabase";

export const config = {
  // Nur Seiten: keine Dateien (mit Endung), keine API, keine gebauten Assets
  matcher: ["/((?!api/|assets/|.*\\.[a-zA-Z0-9]+$).*)"],
};

const JERSEY_FIELDS = "id,team,name,year,size,condition,league,sale_price_cents,price_cents,listing_type,image_urls,image_url";

export default async function middleware(request: Request): Promise<Response | undefined> {
  if (!isPreviewBot(request.headers.get("user-agent"))) return undefined;

  try {
    const { pathname } = new URL(request.url);
    const base = supabaseUrl();
    const content = mergeSeoContent(await rest<{ key: string; value: unknown }[]>("site_content?select=key,value&key=like.seo.*"));
    let meta = pageMeta(pathname, content, base);

    const jerseyId = jerseyIdFromPath(pathname);
    if (jerseyId) {
      const [jersey] = await rest<JerseyForSeo[]>(`user_jerseys?select=${JERSEY_FIELDS}&id=eq.${jerseyId}&deleted_at=is.null&limit=1`);
      if (jersey) meta = jerseyMeta(jersey, content, base);
    }

    return new Response(renderPreviewPage(meta), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" },
    });
  } catch {
    return undefined;
  }
}
