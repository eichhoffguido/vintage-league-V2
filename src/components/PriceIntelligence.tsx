import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PriceIntelligenceProps {
  team: string;
  year: number;
  condition?: string;
  size?: string;
  listingPriceCents?: number;
  compact?: boolean;
}

interface PriceIntelligenceData {
  fair_value_mid_cents: number;
  fair_value_min_cents: number;
  fair_value_max_cents: number;
  comparable_count: number;
  smart_buy_discount_pct?: number;
}

const PriceIntelligence = ({
  team,
  year,
  condition,
  size,
  listingPriceCents,
  compact = false,
}: PriceIntelligenceProps) => {
  const [data, setData] = useState<PriceIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceIntelligence = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: result, error: rpcError } = await supabase.rpc(
          "get_price_intelligence",
          {
            p_team: team,
            p_year: year,
            p_condition: condition || null,
            p_size: size || null,
          }
        );

        if (rpcError) {
          setError(rpcError.message);
          setData(null);
          return;
        }

        if (
          !result ||
          result.comparable_count < 3 ||
          !result.fair_value_mid_cents ||
          !result.fair_value_min_cents ||
          !result.fair_value_max_cents
        ) {
          setData(null);
          return;
        }

        let processedData = { ...result };
        if (
          listingPriceCents !== undefined &&
          result.fair_value_mid_cents &&
          !isNaN(result.fair_value_mid_cents)
        ) {
          const discountPct = Math.round(
            ((result.fair_value_mid_cents - listingPriceCents) /
              result.fair_value_mid_cents) *
              100
          );
          processedData.smart_buy_discount_pct =
            !isNaN(discountPct) && discountPct > 0 ? discountPct : undefined;
        }

        setData(processedData);
      } catch (err) {
        setError(null);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceIntelligence();
  }, [team, year, condition, size, listingPriceCents]);

  if (loading) {
    return compact ? null : <div className="h-16 animate-pulse rounded bg-secondary/30" />;
  }

  if (error || !data || !data.fair_value_mid_cents || !data.fair_value_min_cents || !data.fair_value_max_cents) {
    return null;
  }

  // Empty state: < 3 comparables
  if (data.comparable_count < 3) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50 p-3">
        <div className="text-sm text-slate-700">
          Noch keine Vergleichsdaten verfügbar
        </div>
      </div>
    );
  }

  const getPriceStatus = (): "smart_buy" | "fair" | "overpriced" => {
    if (!listingPriceCents) return "fair";
    const percentDiff =
      ((listingPriceCents - data.fair_value_mid_cents) /
        data.fair_value_mid_cents) *
      100;
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

  return (
    <div className={cn("rounded border p-3", displayStatusColor)}>
      {hasPrice && data.smart_buy_discount_pct && (
        <div className={cn("mb-2 flex items-center gap-2 font-semibold", displayTextColor)}>
          <TrendingUp className="h-4 w-4" />
          Smart Buy -{data.smart_buy_discount_pct}%
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
    </div>
  );
};

export default PriceIntelligence;