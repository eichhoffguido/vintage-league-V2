import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { centsToEuros } from "@/utils/currency";
import { X } from "lucide-react";

interface PriceRangeSliderProps {
  min: number; // absolute minimum (e.g., 0)
  max: number; // absolute maximum (e.g., 500)
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
    onChange(newMin === min && newMax === max ? null : newMin, newMax === max ? null : newMax);
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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Preis</span>
          {isActive && (
            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Reset price filter"
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
          className="w-full"
        />

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            {isActive
              ? `€${displayMin.toFixed(0)} — €${displayMax.toFixed(0)}`
              : "Alle Preise"}
          </div>
          {isActive && (
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-secondary transition-colors"
              aria-label="Clear price filter"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
