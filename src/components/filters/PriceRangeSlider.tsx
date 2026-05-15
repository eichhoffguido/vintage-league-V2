import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  priceMin: number | null;
  priceMax: number | null;
  onChange: (min: number | null, max: number | null) => void;
  className?: string;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min,
  max,
  priceMin,
  priceMax,
  onChange,
  className = "",
}) => {
  const [sliderValues, setSliderValues] = useState<[number, number]>([
    priceMin ?? min,
    priceMax ?? max,
  ]);

  useEffect(() => {
    setSliderValues([priceMin ?? min, priceMax ?? max]);
  }, [priceMin, priceMax, min, max]);

  const handleSliderChange = (values: number[]) => {
    const [newMin, newMax] = values as [number, number];
    setSliderValues([newMin, newMax]);
  };

  const handleApply = () => {
    const [newMin, newMax] = sliderValues;
    onChange(
      newMin === min && newMax === max ? null : newMin,
      newMax === max ? null : newMax,
    );
  };

  const handleReset = () => {
    setSliderValues([min, max]);
    onChange(null, null);
  };

  const isActive = priceMin !== null || priceMax !== null;
  const displayMin = priceMin ?? min;
  const displayMax = priceMax ?? max;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Preis</span>
        {isActive && (
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      <Slider
        min={min}
        max={max}
        step={1}
        value={sliderValues}
        onValueChange={handleSliderChange}
        onValueCommit={handleApply}
        className="w-full"
      />

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          {isActive
            ? `€${(displayMin / 100).toFixed(2)} — €${(displayMax / 100).toFixed(2)}`
            : "Alle Preise"}
        </div>
        {isActive && (
          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
