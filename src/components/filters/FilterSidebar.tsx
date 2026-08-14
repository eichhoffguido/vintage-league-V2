import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { PriceRangeSlider } from "@/components/filters/PriceRangeSlider";
import { PRICE_RANGE_MIN_CENTS, PRICE_RANGE_MAX_CENTS } from "@/components/filters/priceRangeConfig";
import { FilterState, ERA_PRESETS } from "@/hooks/useFilterState";
import { CONDITION_OPTIONS as CONDITIONS } from "@/data/condition";

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
}

const LEAGUES = [
  { id: "bundesliga", label: "Bundesliga" },
  { id: "premier-league", label: "Premier League" },
  { id: "la-liga", label: "La Liga" },
  { id: "serie-a", label: "Serie A" },
  { id: "nationalteam", label: "Nationalteams" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL"];

const ERA_PRESET_LIST = Object.entries(ERA_PRESETS).map(([key]) => ({
  id: key,
  label: key,
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
    onChange({ ...filters, priceMin: min, priceMax: max });
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
    onChange({
      ...filters,
      eraPreset: filters.eraPreset === preset ? null : preset,
    });
  };

  const handleListingTypeChange = (value: string) => {
    onChange({ ...filters, listingType: value === "all" ? [] : [value] });
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
    <aside className={`w-64 shrink-0 ${className}`}>
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

        <CollapsibleSection title="Preis">
          <PriceRangeSlider
            min={PRICE_RANGE_MIN_CENTS}
            max={PRICE_RANGE_MAX_CENTS}
            priceMin={filters.priceMin}
            priceMax={filters.priceMax}
            onChange={handlePriceChange}
          />
        </CollapsibleSection>

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

        <CollapsibleSection title="Zustand">
          <div className="space-y-2">
            {CONDITIONS.map((condition) => (
              <div key={condition.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`sidebar-condition-${condition.id}`}
                  checked={filters.conditions.includes(condition.id)}
                  onCheckedChange={() => handleConditionToggle(condition.id)}
                />
                <Label htmlFor={`sidebar-condition-${condition.id}`} className="cursor-pointer text-sm flex-1">
                  {condition.label}
                </Label>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Liga">
          <div className="space-y-2">
            {LEAGUES.map((league) => (
              <div key={league.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`sidebar-league-${league.id}`}
                  checked={filters.leagues.includes(league.id)}
                  onCheckedChange={() => handleLeagueToggle(league.id)}
                />
                <Label htmlFor={`sidebar-league-${league.id}`} className="cursor-pointer text-sm flex-1">
                  {league.label}
                </Label>
              </div>
            ))}
          </div>
        </CollapsibleSection>

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

        <CollapsibleSection title="Listentyp">
          <RadioGroup
            value={filters.listingType.length === 0 ? "all" : filters.listingType[0]}
            onValueChange={handleListingTypeChange}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="sidebar-listing-all" />
              <Label htmlFor="sidebar-listing-all" className="cursor-pointer text-sm">
                Alle
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="buy_now" id="sidebar-listing-buy" />
              <Label htmlFor="sidebar-listing-buy" className="cursor-pointer text-sm">
                Nur Kaufen
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="exchange" id="sidebar-listing-exchange" />
              <Label htmlFor="sidebar-listing-exchange" className="cursor-pointer text-sm">
                Nur Tauschen
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="sidebar-listing-both" />
              <Label htmlFor="sidebar-listing-both" className="cursor-pointer text-sm">
                Kaufen & Tauschen
              </Label>
            </div>
          </RadioGroup>
        </CollapsibleSection>

        <CollapsibleSection title="Verifiziert">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sidebar-verified"
              checked={filters.verified}
              onCheckedChange={handleVerifiedChange}
            />
            <Label htmlFor="sidebar-verified" className="cursor-pointer text-sm flex-1">
              Nur verifizierte Trikots
            </Label>
          </div>
        </CollapsibleSection>
      </div>
    </aside>
  );
};

export default FilterSidebar;
