import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePriceIntelligence } from "@/hooks/usePriceIntelligence";
import PriceSpectrum from "@/components/price/PriceSpectrum";

export interface PriceIntelligenceProps {
  team: string;
  year: number;
  condition?: string;
  size?: string;
  listingPriceCents?: number;
  compact?: boolean;
}

type PriceStatus = "smart_buy" | "fair" | "overpriced";

// Status-Farben nur aus Design-Tokens (Skill cc-design §2)
const STATUS_ACCENT: Record<PriceStatus, string> = {
  smart_buy: "border-l-verde",
  fair: "border-l-nero",
  overpriced: "border-l-rosso",
};

const formatPrice = (cents: number) => `€${(cents / 100).toFixed(0)}`;

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
    return compact ? null : <div className="h-16 animate-pulse bg-sabbia" />;
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
      <div className="border border-nero bg-card p-3">
        <div className="cap text-[11px]">{message}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Basierend auf {data.comparable_count} {data.comparable_count === 1 ? "Vergleich" : "Vergleichen"}
        </div>
      </div>
    );
  }

  const smartBuyDiscountPct = (() => {
    if (listingPriceCents === undefined) return undefined;
    const discountPct = Math.round(((data.fair_value_mid_cents - listingPriceCents) / data.fair_value_mid_cents) * 100);
    return !isNaN(discountPct) && discountPct > 0 ? discountPct : undefined;
  })();

  const priceStatus: PriceStatus = (() => {
    if (!listingPriceCents) return "fair";
    const percentDiff = ((listingPriceCents - data.fair_value_mid_cents) / data.fair_value_mid_cents) * 100;
    if (percentDiff < -15) return "smart_buy";
    if (percentDiff > 15) return "overpriced";
    return "fair";
  })();

  if (compact) {
    if (priceStatus !== "smart_buy") return null;
    return (
      <span className="inline-flex items-center gap-1 border border-verde bg-verde px-[7px] py-1 font-body text-[10px] font-medium uppercase leading-none tracking-[0.14em] text-avorio">
        <TrendingUp className="h-3 w-3" />
        Smart Buy
      </span>
    );
  }

  const hasPrice = listingPriceCents !== undefined;

  return (
    <div className={cn("border border-nero border-l-4 bg-card p-4", hasPrice ? STATUS_ACCENT[priceStatus] : "border-l-nero")}>
      {hasPrice && smartBuyDiscountPct && (
        <div className="cap mb-2 flex items-center gap-2 text-xs text-verde">
          <TrendingUp className="h-4 w-4" />
          Smart Buy −{smartBuyDiscountPct}%
        </div>
      )}
      <div className="cap text-[11px] text-muted-foreground">Fairer Marktwert</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="num text-[28px] leading-none">~{formatPrice(data.fair_value_mid_cents)}</span>
        <span className="text-sm text-muted-foreground">
          ({formatPrice(data.fair_value_min_cents)}–{formatPrice(data.fair_value_max_cents)})
        </span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        Basierend auf {data.comparable_count} vergleichbaren Verkäufen
      </div>

      <PriceSpectrum
        className="mt-4"
        minCents={data.fair_value_min_cents}
        midCents={data.fair_value_mid_cents}
        maxCents={data.fair_value_max_cents}
        priceCents={hasPrice ? listingPriceCents : undefined}
      />
    </div>
  );
};

export default PriceIntelligence;
