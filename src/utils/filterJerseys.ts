import { FilterState, ERA_PRESETS } from "@/hooks/useFilterState";

interface Jersey {
  id: string;
  name: string;
  team: string;
  league: string;
  year: string;
  price_cents: number | null;
  sale_price_cents: number | null;
  size: string;
  condition: number;
  listing_type: string;
  verification_status: string;
  [key: string]: unknown;
}

export function filterJerseys(jerseys: Jersey[], filters: FilterState): Jersey[] {
  return jerseys.filter((jersey) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const nameMatch = jersey.name?.toLowerCase().includes(q);
      const teamMatch = jersey.team?.toLowerCase().includes(q);
      if (!nameMatch && !teamMatch) return false;
    }

    if (filters.leagues.length > 0) {
      const league = jersey.league?.toLowerCase() || "";
      const matches = filters.leagues.some(
        (l) => league === l.toLowerCase() || league.replace(" ", "-") === l.toLowerCase(),
      );
      if (!matches) return false;
    }

    if (filters.sizes.length > 0) {
      if (!filters.sizes.includes(jersey.size)) return false;
    }

    if (filters.conditions.length > 0) {
      const conditionStr = String(jersey.condition);
      if (!filters.conditions.includes(conditionStr)) return false;
    }

    if (filters.priceMin !== null) {
      const price = jersey.sale_price_cents ?? jersey.price_cents ?? 0;
      if (price < filters.priceMin) return false;
    }
    if (filters.priceMax !== null) {
      const price = jersey.sale_price_cents ?? jersey.price_cents ?? 0;
      if (price > filters.priceMax) return false;
    }

    if (filters.eraFrom !== null) {
      const year = parseInt(jersey.year, 10);
      if (isNaN(year) || year < filters.eraFrom) return false;
    }
    if (filters.eraTo !== null) {
      const year = parseInt(jersey.year, 10);
      if (isNaN(year) || year > filters.eraTo) return false;
    }

    if (filters.listingType.length > 0) {
      if (!filters.listingType.includes(jersey.listing_type)) return false;
    }

    if (filters.verified) {
      if (jersey.verification_status !== "verified") return false;
    }

    if (filters.tradeable) {
      if (jersey.listing_type !== "both" && jersey.listing_type !== "trade_only") return false;
    }

    return true;
  });
}

export function sortJerseys(jerseys: Jersey[], sortBy: string): Jersey[] {
  const sorted = [...jerseys];

  switch (sortBy) {
    case "price-asc":
      sorted.sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0));
      break;
    case "price-desc":
      sorted.sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0));
      break;
    case "year-desc": {
      sorted.sort((a, b) => {
        const aYear = parseInt(a.year, 10) || 0;
        const bYear = parseInt(b.year, 10) || 0;
        return bYear - aYear;
      });
      break;
    }
    default:
      break;
  }

  return sorted;
}
