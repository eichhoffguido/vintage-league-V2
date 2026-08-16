import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePriceIntelligence } from "@/hooks/usePriceIntelligence";

export interface PriceIntelligenceProps {
  team: string;
  year: number;
  condition?: string;
  size?: string;
  listingPriceCents?: number;
  compact?: boolean;
}

const PriceIntelligence = ({
  team,
  year,
  condition,
  size,
  listingPriceCents,
  compact = false,
}: PriceIntelligenceProps) => {
  const { data, loading, reliability } = usePriceIntelligence({ team, year, condition, size });

  if (loading) {
    return compact ? null : <div className="h-16 animate-pulse rounded bg-secondary/30" />;
  }

  if (!data) return null;

  if (!reliability.reliable) {
    if (compact) return null;
    if (reliability.reason === "no-data") return null;

    const message =
      reliability.reason === "insufficient"
        ? "Noch zu wenige Vergleichsdaten"
        : "Geringe Datenlage — Preisspanne unzuverlässig";

    return (
      <div className="rounded border border-slate-200 bg-slate-50 p-3">
        <div className="text-sm text-slate-700">{message}</div>
        <div className="mt-1 text-xs text-slate-500">
          Basierend auf {data.comparable_count} {data.comparable_count === 1 ? "Vergleich" : "Vergleichen"}
        </div>
      </div>
    );
  }

  const smartBuyDiscountPct = (() => {
    if (listingPriceCents === undefined) return undefined;
    const discountPct = Math.round(
      ((data.fair_value_mid_cents - listingPriceCents) / data.fair_value_mid_cents) * 100
    );
    return !isNaN(discountPct) && discountPct > 0 ? discountPct : undefined;
  })();

  const getPriceStatus = (): "smart_buy" | "fair" | "overpriced" => {
    if (!listingPriceCents) return "fair";
    const percentDiff =
      ((listingPriceCents - data.fair_value_mid_cents) / data.fair_value_mid_cents) * 100;
    if (percentDiff < -15) return "smart_buy";
    if (percentDiff > 15) return "overpriced";
    return "fair";
  };

  const priceStatus = getPriceStatus();

  if (compact) {
    if (priceStatus !== "smart_buy") return null;
    return (
      <div className="inline-flex items-center gap-1 rounded-sm bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
        <TrendingUp className="h-3 w-3" />
        Smart Buy
      </div>
    );
  }

  const statusColors = {
    smart_buy: "bg-green-50 border-green-200",
    fair: "bg-slate-50 border-slate-200",
    overpriced: "bg-orange-50 border-orange-200",
  };

  const textColors = {
    smart_buy: "text-green-700",
    fair: "text-slate-700",
    overpriced: "text-orange-700",
  };

  // When price not entered, use neutral styling
  const hasPrice = listingPriceCents !== undefined;
  const displayStatusColor = hasPrice ? statusColors[priceStatus] : "bg-slate-50 border-slate-200";
  const displayTextColor = hasPrice ? textColors[priceStatus] : "text-slate-700";

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(0)}`;
  };

  // Calculate spectrum bar metrics
  const spectrumMin = data.fair_value_min_cents / 100;
  const spectrumMid = data.fair_value_mid_cents / 100;
  const spectrumMax = data.fair_value_max_cents / 100;
  const range = spectrumMax - spectrumMin;

  // Calculate fair zone position (mid ±10%)
  const fairZoneLeft = range === 0 ? 0 : Math.max(0, ((spectrumMid * 0.9 - spectrumMin) / range) * 100);
  const fairZoneRight = range === 0 ? 100 : Math.min(100, ((spectrumMid * 1.1 - spectrumMin) / range) * 100);

  // Calculate price indicator position
  const price = listingPriceCents ? listingPriceCents / 100 : undefined;
  const pricePos = price && range > 0
    ? Math.max(2, Math.min(98, ((price - spectrumMin) / range) * 100))
    : 50;

  return (
    <div className={cn("rounded border p-3", displayStatusColor)}>
      {hasPrice && smartBuyDiscountPct && (
        <div className={cn("mb-2 flex items-center gap-2 font-semibold", displayTextColor)}>
          <TrendingUp className="h-4 w-4" />
          Smart Buy -{smartBuyDiscountPct}%
        </div>
      )}
      <div className={cn("text-sm", displayTextColor)}>
        <div className="mb-1">
          Fairer Marktwert ~{formatPrice(data.fair_value_mid_cents)} (
          {formatPrice(data.fair_value_min_cents)}–{formatPrice(data.fair_value_max_cents)})
        </div>
        <div className="text-xs opacity-75">
          Basierend auf {data.comparable_count} vergleichbaren Verkäufen
        </div>
      </div>

      {/* Price Spectrum Bar */}
      {range > 0 && (
        <div className="mt-3">
          {/* The spectrum bar */}
          <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-primary/80 via-green-500/60 via-50% to-red-500/80 overflow-hidden">
            {/* Fair zone highlight */}
            <div
              className="absolute top-0 h-full bg-green-500/30 border-x border-green-500/50"
              style={{ left: `${fairZoneLeft}%`, width: `${fairZoneRight - fairZoneLeft}%` }}
            />
          </div>

          {/* Price indicator (triangle below bar) */}
          {hasPrice && (
            <div className="relative h-4 mt-0.5">
              <div
                className="absolute -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${pricePos}%` }}
              >
                <div
                  className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent"
                  style={{
                    borderBottomColor:
                      priceStatus === "smart_buy"
                        ? "rgb(34, 197, 94)"
                        : priceStatus === "overpriced"
                          ? "rgb(234, 88, 12)"
                          : "rgb(100, 116, 139)",
                  }}
                />
                <span
                  className="text-[9px] font-bold whitespace-nowrap"
                  style={{
                    color:
                      priceStatus === "smart_buy"
                        ? "rgb(34, 197, 94)"
                        : priceStatus === "overpriced"
                          ? "rgb(234, 88, 12)"
                          : "rgb(100, 116, 139)",
                  }}
                >
                  {formatPrice(listingPriceCents || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Scale labels */}
          <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
            <span>{formatPrice(data.fair_value_min_cents)}</span>
            <span className="text-green-500 font-medium">
              {formatPrice(Math.round(data.fair_value_mid_cents * 0.9))}–
              {formatPrice(Math.round(data.fair_value_mid_cents * 1.1))}
            </span>
            <span>{formatPrice(data.fair_value_max_cents)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceIntelligence;
