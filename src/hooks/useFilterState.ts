import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export interface FilterState {
  search: string | null;
  leagues: string[];
  sizes: string[];
  conditions: string[];
  priceMin: number | null;
  priceMax: number | null;
  eraFrom: number | null;
  eraTo: number | null;
  eraPreset: string | null;
  listingType: string[];
  verified: boolean;
  sortBy: string;
}

export const ERA_PRESETS: Record<string, { from: number; to: number }> = {
  "70er": { from: 1970, to: 1979 },
  "80er": { from: 1980, to: 1989 },
  "90er": { from: 1990, to: 1999 },
  "00er": { from: 2000, to: 2009 },
  "10er": { from: 2010, to: 2019 },
  "20er": { from: 2020, to: 2029 },
};

export const DEFAULT_FILTERS: FilterState = {
  search: null,
  leagues: [],
  sizes: [],
  conditions: [],
  priceMin: null,
  priceMax: null,
  eraFrom: null,
  eraTo: null,
  eraPreset: null,
  listingType: [],
  verified: false,
  sortBy: "newest",
};

function parseCommaParam(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

function parseFiltersFromParams(searchParams: URLSearchParams): FilterState {
  const eraPreset = searchParams.get("era");

  let eraFrom: number | null = null;
  let eraTo: number | null = null;

  if (eraPreset && ERA_PRESETS[eraPreset]) {
    eraFrom = ERA_PRESETS[eraPreset].from;
    eraTo = ERA_PRESETS[eraPreset].to;
  } else {
    const rawEraFrom = searchParams.get("eraFrom");
    const rawEraTo = searchParams.get("eraTo");
    eraFrom = rawEraFrom ? parseInt(rawEraFrom, 10) : null;
    eraTo = rawEraTo ? parseInt(rawEraTo, 10) : null;
  }

  return {
    search: searchParams.get("q") || null,
    leagues: parseCommaParam(searchParams.get("leagues")),
    sizes: parseCommaParam(searchParams.get("sizes")),
    conditions: parseCommaParam(searchParams.get("conditions")),
    priceMin: searchParams.get("priceMin") ? parseInt(searchParams.get("priceMin")!, 10) : null,
    priceMax: searchParams.get("priceMax") ? parseInt(searchParams.get("priceMax")!, 10) : null,
    eraFrom,
    eraTo,
    eraPreset,
    listingType: parseCommaParam(searchParams.get("listing")),
    verified: searchParams.get("verified") === "true",
    sortBy: searchParams.get("sort") || "newest",
  };
}

function serializeFiltersToParams(filters: FilterState): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.search) params.q = filters.search;
  if (filters.leagues.length > 0) params.leagues = filters.leagues.join(",");
  if (filters.sizes.length > 0) params.sizes = filters.sizes.join(",");
  if (filters.conditions.length > 0) params.conditions = filters.conditions.join(",");
  if (filters.priceMin !== null) params.priceMin = String(filters.priceMin);
  if (filters.priceMax !== null) params.priceMax = String(filters.priceMax);
  if (filters.eraPreset) {
    params.era = filters.eraPreset;
  } else {
    if (filters.eraFrom !== null) params.eraFrom = String(filters.eraFrom);
    if (filters.eraTo !== null) params.eraTo = String(filters.eraTo);
  }
  if (filters.listingType.length > 0) params.listing = filters.listingType.join(",");
  if (filters.verified) params.verified = "true";
  if (filters.sortBy && filters.sortBy !== "newest") params.sort = filters.sortBy;

  return params;
}

export function useFilterState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );

  const setFilters = useCallback(
    (newFilters: FilterState) => {
      const params = serializeFiltersToParams(newFilters);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      const current = parseFiltersFromParams(new URLSearchParams(searchParams));

      if (key === "eraPreset") {
        const preset = value as string | null;
        current.eraPreset = preset;
        if (preset && ERA_PRESETS[preset]) {
          current.eraFrom = ERA_PRESETS[preset].from;
          current.eraTo = ERA_PRESETS[preset].to;
        } else {
          current.eraFrom = null;
          current.eraTo = null;
        }
      } else {
        (current as FilterState)[key] = value;
      }

      setFilters(current);
    },
    [searchParams, setFilters],
  );

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    count += filters.leagues.length;
    count += filters.sizes.length;
    count += filters.conditions.length;
    if (filters.priceMin !== null || filters.priceMax !== null) count++;
    if (filters.eraPreset) count++;
    count += filters.listingType.length;
    if (filters.verified) count++;
    return count;
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    activeFilterCount,
  };
}
