import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilterState, ERA_PRESETS } from "@/hooks/useFilterState";

interface FilterDrawerProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onReset: () => void;
}

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

const LISTING_TYPES = [
  { id: "buy_now", label: "Nur Kaufen" },
  { id: "exchange", label: "Nur Tauschen" },
  { id: "both", label: "Kaufen & Tauschen" },
];

const ERA_PRESET_LIST = Object.entries(ERA_PRESETS).map(([key]) => ({
  id: key,
  label: `${key}`,
}));

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const [open, setOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceMin || 0,
    filters.priceMax || 10000,
  ]);

  const handlePriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
  };

  const applyPriceFilter = () => {
    onFilterChange("priceMin", priceRange[0] || null);
    onFilterChange("priceMax", priceRange[1] || null);
  };

  const handleLeagueToggle = (league: string) => {
    const newLeagues = filters.leagues.includes(league)
      ? filters.leagues.filter((l) => l !== league)
      : [...filters.leagues, league];
    onFilterChange("leagues", newLeagues);
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFilterChange("sizes", newSizes);
  };

  const handleConditionToggle = (condition: string) => {
    const newConditions = filters.conditions.includes(condition)
      ? filters.conditions.filter((c) => c !== condition)
      : [...filters.conditions, condition];
    onFilterChange("conditions", newConditions);
  };

  const handleListingTypeToggle = (type: string) => {
    const newTypes = filters.listingType.includes(type)
      ? filters.listingType.filter((t) => t !== type)
      : [...filters.listingType, type];
    onFilterChange("listingType", newTypes);
  };

  const handleEraPresetToggle = (preset: string) => {
    if (filters.eraPreset === preset) {
      onFilterChange("eraPreset", null);
    } else {
      onFilterChange("eraPreset", preset);
    }
  };

  const activeFilterCount = Object.values(filters).filter((v) => {
    if (v === null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "boolean") return v;
    return true;
  }).length;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Filter className="h-4 w-4" />
        {activeFilterCount > 0 && (
          <span className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </Button>

      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex items-center justify-between border-b">
          <DrawerTitle>Filter</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="space-y-6 px-4 py-4">
            {/* Leagues */}
            <div>
              <h3 className="mb-3 font-semibold text-sm">Ligen</h3>
              <div className="space-y-2">
                {LEAGUES.map((league) => (
                  <div key={league.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`league-${league.id}`}
                      checked={filters.leagues.includes(league.id)}
                      onCheckedChange={() => handleLeagueToggle(league.id)}
                    />
                    <Label htmlFor={`league-${league.id}`} className="cursor-pointer text-sm">
                      {league.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="mb-3 font-semibold text-sm">Größe</h3>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((size) => (
                  <div key={size} className="flex items-center space-x-2">
                    <Checkbox
                      id={`size-${size}`}
                      checked={filters.sizes.includes(size)}
                      onCheckedChange={() => handleSizeToggle(size)}
                    />
                    <Label htmlFor={`size-${size}`} className="cursor-pointer text-sm">
                      {size}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div>
              <h3 className="mb-3 font-semibold text-sm">Zustand</h3>
              <div className="space-y-2">
                {CONDITIONS.map((condition) => (
                  <div key={condition.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`condition-${condition.id}`}
                      checked={filters.conditions.includes(condition.id)}
                      onCheckedChange={() => handleConditionToggle(condition.id)}
                    />
                    <Label htmlFor={`condition-${condition.id}`} className="cursor-pointer text-sm">
                      {condition.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="mb-3 font-semibold text-sm">Preis (€)</h3>
              <div className="space-y-3">
                <Slider
                  min={0}
                  max={10000}
                  step={100}
                  value={priceRange}
                  onValueChange={handlePriceChange}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Min</Label>
                    <div className="text-sm font-semibold">€{priceRange[0]}</div>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Max</Label>
                    <div className="text-sm font-semibold">€{priceRange[1]}</div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={applyPriceFilter}
                  className="w-full"
                >
                  Preis anwenden
                </Button>
              </div>
            </div>

            {/* Era Presets */}
            <div>
              <h3 className="mb-3 font-semibold text-sm">Ära</h3>
              <div className="grid grid-cols-3 gap-2">
                {ERA_PRESET_LIST.map((era) => (
                  <Button
                    key={era.id}
                    variant={filters.eraPreset === era.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleEraPresetToggle(era.id)}
                    className="w-full"
                  >
                    {era.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Listing Type */}
            <div>
              <h3 className="mb-3 font-semibold text-sm">Listentyp</h3>
              <div className="space-y-2">
                {LISTING_TYPES.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`listing-${type.id}`}
                      checked={filters.listingType.includes(type.id)}
                      onCheckedChange={() => handleListingTypeToggle(type.id)}
                    />
                    <Label htmlFor={`listing-${type.id}`} className="cursor-pointer text-sm">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified */}
            <div className="flex items-center justify-between">
              <Label htmlFor="verified" className="text-sm font-semibold">
                Nur verifizierte Angebote
              </Label>
              <Switch
                id="verified"
                checked={filters.verified}
                onCheckedChange={(checked) => onFilterChange("verified", checked)}
              />
            </div>
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t">
          <Button
            variant="outline"
            onClick={() => {
              onReset();
              setOpen(false);
            }}
            className="w-full"
          >
            Filter zurücksetzen
          </Button>
          <Button
            onClick={() => setOpen(false)}
            className="w-full"
          >
            Fertig
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FilterDrawer;
