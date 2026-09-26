import { HOME_CONTENT, type HomeContent } from "@/content/home";

type SiteContentMap = { home: HomeContent };

const DEFAULTS: SiteContentMap = { home: HOME_CONTENT };

/**
 * Liefert die pflegbaren Inhalte einer Seite.
 * Heute: Standardwerte aus src/content/*. Ab CC-C2: Werte aus dem CMS (Supabase), gemischt über diese Standards —
 * die Seite kann dadurch nie leer werden. Aufrufer ändern sich dabei nicht.
 */
export function useSiteContent<K extends keyof SiteContentMap>(page: K): SiteContentMap[K] {
  return DEFAULTS[page];
}
