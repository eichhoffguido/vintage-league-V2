import { FilterState } from "@/hooks/useFilterState";

export const CATEGORY_TO_FILTERS: Record<string, Partial<{
  leagues: string[];
  eraFrom: number | null;
  eraTo: number | null;
  priceMin: number | null;
}>> = {
  bundesliga: { leagues: ["bundesliga"] },
  "premier-league": { leagues: ["premier-league"] },
  "la-liga": { leagues: ["la-liga"] },
  "serie-a": { leagues: ["serie-a"] },
  nationalteam: { leagues: ["nationalteam"] },
  // "Klassiker" = 70er bis 90er Jahre (kein einzelnes ERA_PRESETS-Jahrzehnt).
  klassiker: { eraFrom: 1970, eraTo: 1999 },
  rarities: { priceMin: 20000 },
};

export const HEADER_CATEGORY_CHIPS: { label: string; key: string }[] = [
  { label: "Bundesliga", key: "bundesliga" },
  { label: "Premier League", key: "premier-league" },
  { label: "La Liga", key: "la-liga" },
  { label: "Serie A", key: "serie-a" },
  { label: "Nationalteams", key: "nationalteam" },
  { label: "Klassiker", key: "klassiker" },
  { label: "Raritäten", key: "rarities" },
];

export function categoryToShopUrl(categoryKey: string): string {
  const config = CATEGORY_TO_FILTERS[categoryKey];
  if (!config) return "/shop";

  const params = new URLSearchParams();
  if (config.leagues && config.leagues.length > 0) {
    params.set("leagues", config.leagues.join(","));
  }
  if (config.eraFrom !== null && config.eraFrom !== undefined) {
    params.set("eraFrom", String(config.eraFrom));
  }
  if (config.eraTo !== null && config.eraTo !== undefined) {
    params.set("eraTo", String(config.eraTo));
  }
  if (config.priceMin !== null && config.priceMin !== undefined) {
    params.set("priceMin", String(config.priceMin));
  }

  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}

// A category chip counts as active when the current /shop filters match
// exactly what that chip's link sets (same leagues/era/price dimensions).
export function isCategoryChipActive(categoryKey: string, filters: FilterState): boolean {
  const config = CATEGORY_TO_FILTERS[categoryKey];
  if (!config) return false;

  const targetLeagues = config.leagues ?? [];
  const leaguesMatch =
    filters.leagues.length === targetLeagues.length &&
    targetLeagues.every((league) => filters.leagues.includes(league));

  const eraFromMatch = (config.eraFrom ?? null) === filters.eraFrom;
  const eraToMatch = (config.eraTo ?? null) === filters.eraTo;
  const priceMinMatch = (config.priceMin ?? null) === filters.priceMin;

  return leaguesMatch && eraFromMatch && eraToMatch && priceMinMatch;
}

// "Just Dropped" is active on /shop when sorted by newest and no
// category-chip filter (league/era/price) is applied.
export function isJustDroppedActive(filters: FilterState): boolean {
  return (
    filters.sortBy === "newest" &&
    filters.leagues.length === 0 &&
    filters.eraFrom === null &&
    filters.eraTo === null &&
    filters.priceMin === null
  );
}
