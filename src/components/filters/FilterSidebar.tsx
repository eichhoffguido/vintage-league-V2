import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { PriceRangeSlider } from "@/components/filters/PriceRangeSlider";
import { FilterState, ERA_PRESETS } from "@/hooks/useFilterState";

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
}

// Constants for filter options
const LEAGUES = [
  { id: "bundesliga", label: "Bundesliga" },
  { id: "premier-league", label: "Premier League" },
  { id: "la-liga", label: "La Liga" },
  { id: "serie-a", label: "Serie A" },
  { id: "nationalteam", label: "Nationalteams" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL"];

const CONDITIONS = [
  { id: "5", label: "Neuwertig" },
  { id: "4", label: "Sehr gut" },
  { id: "3", label: "Gut erhalten" },
  { id: "2", label: "Gebraucht" },
  { id: "1", label: "Sammlerstück" },
];

// Era presets from useFilterState
const ERA_PRESET_LIST = Object.entries(ERA_PRESETS).map(([key]) => ({
  id: key,
  label: `${key}`,
}));

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border py-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
};

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onChange,
  className = "",
}) => {
  const handlePriceChange = (min: number | null, max: number | null) => {
    const newFilters = { ...filters, priceMin: min, priceMax: max };
    onChange(newFilters);
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onChange({ ...filters, sizes: newSizes });
  };

  const handleConditionToggle = (condition: string) => {
    const newConditions = filters.conditions.includes(condition)
      ? filters.conditions.filter((c) => c !== condition)
      : [...filters.conditions, condition];
    onChange({ ...filters, conditions: newConditions });
  };

  const handleLeagueToggle = (league: string) => {
    const newLeagues = filters.leagues.includes(league)
      ? filters.leagues.filter((l) => l !== league)
      : [...filters.leagues, league];
    onChange({ ...filters, leagues: newLeagues });
  };

  const handleEraPresetChange = (preset: string) => {
    if (filters.eraPreset === preset) {
      onChange({ ...filters, eraPreset: null });
    } else {
      onChange({ ...filters, eraPreset: preset });
    }
  };

  const handleListingTypeChange = (value: string) => {
    // "all" means no filter (empty array)
    const newTypes = value === "all" ? [] : [value];
    onChange({ ...filters, listingType: newTypes });
  };

  const handleVerifiedChange = (checked: boolean) => {
    onChange({ ...filters, verified: checked });
  };

  const handleResetFilters = () => {
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
      sortBy: "newest",
    });
  };

  // Count active filters (excluding sortBy)
  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.leagues.length +
    filters.sizes.length +
    filters.conditions.length +
    (filters.priceMin !== null || filters.priceMax !== null ? 1 : 0) +
    (filters.eraPreset ? 1 : 0) +
    filters.listingType.length +
    (filters.verified ? 1 : 0);

  return (
    <aside
      className={`hidden md:block sticky top-20 self-start w-64 shrink-0 border-r border-border bg-background/50 ${className}`}
    >
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm uppercase tracking-wider">
            Filter
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </h3>
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Zurücksetzen
            </button>
          )}
        </div>

        {/* Price Range */}
        <CollapsibleSection title="Preis">
          <PriceRangeSlider
            min={0}
            max={10000}
            priceMin={filters.priceMin}
            priceMax={filters.priceMax}
            onChange={handlePriceChange}
          />
        </CollapsibleSection>

        {/* Sizes */}
        <CollapsibleSection title="Größe">
          <div className="grid grid-cols-3 gap-2">
            {SIZES.map((size) => (
              <Button
                key={size}
                variant={filters.sizes.includes(size) ? "default" : "outline"}
                size="sm"
                onClick={() => handleSizeToggle(size)}
                className="w-full text-xs"
              >
                {size}
              </Button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Conditions */}
        <CollapsibleSection title="Zustand">
          <div className="space-y-2">
            {CONDITIONS.map((condition) => (
              <div key={condition.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`condition-${condition.id}`}
                  checked={filters.conditions.includes(condition.id)}
                  onCheckedChange={() => handleConditionToggle(condition.id)}
                />
                <Label
                  htmlFor={`condition-${condition.id}`}
                  className="cursor-pointer text-sm flex-1"
                >
                  {condition.label}
                </Label>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Leagues */}
        <CollapsibleSection title="Liga">
          <div className="space-y-2">
            {LEAGUES.map((league) => (
              <div key={league.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`league-${league.id}`}
                  checked={filters.leagues.includes(league.id)}
                  onCheckedChange={() => handleLeagueToggle(league.id)}
                />
                <Label
                  htmlFor={`league-${league.id}`}
                  className="cursor-pointer text-sm flex-1"
                >
                  {league.label}
                </Label>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Era Presets */}
        <CollapsibleSection title="Ära">
          <div className="grid grid-cols-3 gap-2">
            {ERA_PRESET_LIST.map((era) => (
              <Button
                key={era.id}
                variant={filters.eraPreset === era.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleEraPresetChange(era.id)}
                className="w-full text-xs"
              >
                {era.label}
              </Button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Listing Type */}
        <CollapsibleSection title="Listentyp">
          <RadioGroup
            value={filters.listingType.length === 0 ? "all" : filters.listingType[0]}
            onValueChange={handleListingTypeChange}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="listing-all" />
              <Label htmlFor="listing-all" className="cursor-pointer text-sm">
                Alle
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="buy_now" id="listing-buy" />
              <Label htmlFor="listing-buy" className="cursor-pointer text-sm">
                Nur Kaufen
              </Label>
            </div>
          </RadioGroup>
        </CollapsibleSection>

        {/* Verified */}
        <CollapsibleSection title="Verifiziert">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified"
              checked={filters.verified}
              onCheckedChange={handleVerifiedChange}
            />
            <Label htmlFor="verified" className="cursor-pointer text-sm flex-1">
              Nur verifizierte Trikots
            </Label>
          </div>
        </CollapsibleSection>
      </div>
    </aside>
  );
};

export default FilterSidebar;
