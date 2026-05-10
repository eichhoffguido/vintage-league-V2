import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// Temporary FilterState type definition (until VINA-358 is merged)
// This will be imported from useFilterState.ts after VINA-358
export interface FilterState {
  search: string | null;
  leagues: string[];
  sizes: string[];
  conditions: string[];
  priceMin: number | null;
  priceMax: number | null;
  eraFrom: number | null;
  eraTo: number | null;
  eraPreset: string | null; // e.g., "70er", "80er", "90er", "00er", "10er"
  listingType: string[]; // e.g., ["buy_now"], ["exchange"], ["buy_now", "exchange"]
  verified: boolean;
}

// Temporary ERA_PRESETS (until VINA-358 is merged)
export const ERA_PRESETS = {
  "70er": { from: 1970, to: 1979 },
  "80er": { from: 1980, to: 1989 },
  "90er": { from: 1990, to: 1999 },
  "00er": { from: 2000, to: 2009 },
  "10er": { from: 2010, to: 2019 },
  "20er": { from: 2020, to: 2029 },
};

interface ActiveFilterChipsProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  onChange,
  className = "",
}) => {
  // Helper function to remove a filter
  const removeFilter = (type: string, value?: string) => {
    const newFilters = { ...filters };

    switch (type) {
      case "search":
        newFilters.search = null;
        break;
      case "league":
        newFilters.leagues = newFilters.leagues.filter((l) => l !== value);
        break;
      case "size":
        newFilters.sizes = newFilters.sizes.filter((s) => s !== value);
        break;
      case "condition":
        newFilters.conditions = newFilters.conditions.filter((c) => c !== value);
        break;
      case "price":
        newFilters.priceMin = null;
        newFilters.priceMax = null;
        break;
      case "era":
        newFilters.eraPreset = null;
        newFilters.eraFrom = null;
        newFilters.eraTo = null;
        break;
      case "listing":
        newFilters.listingType = newFilters.listingType.filter((t) => t !== value);
        break;
      case "verified":
        newFilters.verified = false;
        break;
    }

    onChange(newFilters);
  };

  // Helper function to reset all filters
  const resetAllFilters = () => {
    onChange({
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
    });
  };

  // Count active filters
  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.leagues.length +
    filters.sizes.length +
    filters.conditions.length +
    (filters.priceMin || filters.priceMax ? 1 : 0) +
    (filters.eraPreset ? 1 : 0) +
    filters.listingType.length +
    (filters.verified ? 1 : 0);

  if (activeFilterCount === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Search chip */}
      {filters.search && (
        <Badge variant="secondary" className="pl-3 pr-2">
          <span className="mr-1">🔍</span>
          <span className="truncate max-w-xs">&quot;{filters.search}&quot;</span>
          <button
            onClick={() => removeFilter("search")}
            className="ml-1.5 hover:text-foreground transition-colors"
            aria-label="Remove search filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* League chips */}
      {filters.leagues.map((league) => (
        <Badge key={league} variant="secondary" className="pl-3 pr-2">
          <span className="text-xs">Liga:</span>
          <span className="ml-1 truncate">{league}</span>
          <button
            onClick={() => removeFilter("league", league)}
            className="ml-1.5 hover:text-foreground transition-colors"
            aria-label={`Remove ${league} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Size chips */}
      {filters.sizes.map((size) => (
        <Badge key={size} variant="secondary" className="pl-3 pr-2">
          <span className="text-xs">Größe:</span>
          <span className="ml-1">{size}</span>
          <button
            onClick={() => removeFilter("size", size)}
            className="ml-1.5 hover:text-foreground transition-colors"
            aria-label={`Remove size ${size} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Condition chips */}
      {filters.conditions.map((condition) => (
        <Badge key={condition} variant="secondary" className="pl-3 pr-2">
          <span className="text-xs">Zustand:</span>
          <span className="ml-1 truncate">{condition}</span>
          <button
            onClick={() => removeFilter("condition", condition)}
            className="ml-1.5 hover:text-foreground transition-colors"
            aria-label={`Remove ${condition} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Price chip */}
      {(filters.priceMin !== null || filters.priceMax !== null) && (
        <Badge variant="secondary" className="pl-3 pr-2">
          <span>€{filters.priceMin ?? 0}–€{filters.priceMax ?? "∞"}</span>
          <button
            onClick={() => removeFilter("price")}
            className="ml-1.5 hover:text-foreground transition-colors"
            aria-label="Remove price filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Era chip */}
      {filters.eraPreset && (
        <Badge variant="secondary" className="pl-3 pr-2">
          <span className="text-xs">Ära:</span>
          <span className="ml-1">{filters.eraPreset}</span>
          <button
            onClick={() => removeFilter("era")}
            className="ml-1.5 hover:text-foreground transition-colors"
            aria-label="Remove era filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Listing type chips */}
      {filters.listingType.map((type) => {
        const labels: Record<string, string> = {
          buy_now: "Nur Kaufen",
          exchange: "Nur Tauschen",
          both: "Kaufen & Tauschen",
        };
        return (
          <Badge key={type} variant="secondary" className="pl-3 pr-2">
            <span>{labels[type] || type}</span>
            <button
              onClick={() => removeFilter("listing", type)}
              className="ml-1.5 hover:text-foreground transition-colors"
              aria-label={`Remove ${type} filter`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}

      {/* Verified chip */}
      {filters.verified && (
        <Badge variant="secondary" className="pl-3 pr-2">
          <span>✓ Nur Verifiziert</span>
          <button
            onClick={() => removeFilter("verified")}
            className="ml-1.5 hover:text-foreground transition-colors"
            aria-label="Remove verified filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Reset all filters button */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetAllFilters}
          className="ml-2 text-xs"
        >
          Filter zurücksetzen
        </Button>
      )}
    </div>
  );
};
