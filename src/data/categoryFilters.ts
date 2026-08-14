export const CATEGORY_TO_FILTERS: Record<string, Partial<{
  leagues: string[];
  eraPreset: string | null;
  priceMin: number | null;
}>> = {
  bundesliga: { leagues: ["bundesliga"] },
  "premier-league": { leagues: ["premier-league"] },
  "la-liga": { leagues: ["la-liga"] },
  "serie-a": { leagues: ["serie-a"] },
  nationalteam: { leagues: ["nationalteam"] },
  klassiker: { eraPreset: null, leagues: [] },
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
  if (config.eraPreset) {
    params.set("era", config.eraPreset);
  }
  if (config.priceMin !== null && config.priceMin !== undefined) {
    params.set("priceMin", String(config.priceMin));
  }

  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}
