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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PriceRangeSlider } from "@/components/filters/PriceRangeSlider";
import { FilterState, ERA_PRESETS } from "@/hooks/useFilterState";

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
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
  { id: "all", label: "Alle" },
  { id: "buy_now", label: "Nur Kaufen" },
  { id: "exchange", label: "Nur Tauschen" },
  { id: "both", label: "Kaufen & Tauschen" },
];

const ERA_PRESET_LIST = Object.entries(ERA_PRESETS).map(([key]) => ({
  id: key,
  label: key,
}));

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onOpenChange,
  filters,
  onChange,
}) => {
  const handleLeagueToggle = (league: string) => {
    const newLeagues = filters.leagues.includes(league)
      ? filters.leagues.filter((l) => l !== league)
      : [...filters.leagues, league];
    onChange({ ...filters, leagues: newLeagues });
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

  const handlePriceChange = (min: number | null, max: number | null) => {
    onChange({ ...filters, priceMin: min, priceMax: max });
  };

  const handleListingTypeChange = (value: string) => {
    onChange({ ...filters, listingType: value === "all" ? [] : [value] });
  };

  const handleEraPresetToggle = (preset: string) => {
    onChange({
      ...filters,
      eraPreset: filters.eraPreset === preset ? null : preset,
    });
  };

  const handleVerifiedChange = (checked: boolean) => {
    onChange({ ...filters, verified: checked });
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
    <Drawer open={open} onOpenChange={onOpenChange}>
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
            <div>
              <h3 className="mb-3 font-semibold text-sm">Ligen</h3>
              <div className="space-y-2">
                {LEAGUES.map((league) => (
                  <div key={league.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`drawer-league-${league.id}`}
                      checked={filters.leagues.includes(league.id)}
                      onCheckedChange={() => handleLeagueToggle(league.id)}
                    />
                    <Label htmlFor={`drawer-league-${league.id}`} className="cursor-pointer text-sm">
                      {league.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-sm">Größe</h3>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((size) => (
                  <div key={size} className="flex items-center space-x-2">
                    <Checkbox
                      id={`drawer-size-${size}`}
                      checked={filters.sizes.includes(size)}
                      onCheckedChange={() => handleSizeToggle(size)}
                    />
                    <Label htmlFor={`drawer-size-${size}`} className="cursor-pointer text-sm">
                      {size}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-sm">Zustand</h3>
              <div className="space-y-2">
                {CONDITIONS.map((condition) => (
                  <div key={condition.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`drawer-condition-${condition.id}`}
                      checked={filters.conditions.includes(condition.id)}
                      onCheckedChange={() => handleConditionToggle(condition.id)}
                    />
                    <Label htmlFor={`drawer-condition-${condition.id}`} className="cursor-pointer text-sm">
                      {condition.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <PriceRangeSlider
              min={0}
              max={50000}
              priceMin={filters.priceMin}
              priceMax={filters.priceMax}
              onChange={handlePriceChange}
            />

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

            <div>
              <h3 className="mb-3 font-semibold text-sm">Listentyp</h3>
              <RadioGroup
                value={filters.listingType.length === 0 ? "all" : filters.listingType[0]}
                onValueChange={handleListingTypeChange}
              >
                {LISTING_TYPES.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.id} id={`drawer-listing-${type.id}`} />
                    <Label htmlFor={`drawer-listing-${type.id}`} className="cursor-pointer text-sm">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="drawer-verified" className="text-sm font-semibold">
                Nur verifizierte Angebote
              </Label>
              <Switch
                id="drawer-verified"
                checked={filters.verified}
                onCheckedChange={handleVerifiedChange}
              />
            </div>
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Filter anwenden{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FilterDrawer;
