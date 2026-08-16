import { ShieldCheck, Gem, Heart, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatEuros } from "@/utils/currency";
import { getImageUrl } from "@/utils/imageUrl";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import PriceIntelligence from "@/components/PriceIntelligence";
import { usePriceIntelligence } from "@/hooks/usePriceIntelligence";
import { getPriceVerdict, type PriceVerdict } from "@/utils/priceIntelligence";
import { CONDITION_LABELS as conditionLabels } from "@/data/condition";

interface JerseyCardProps {
  id: string;
  name: string;
  team: string;
  league: string;
  year: string;
  price_cents: number;
  lowestAsk?: number;
  highestBid?: number;
  imageUrl?: string;
  verified?: boolean;
  verification_status?: "pending" | "verified" | "rejected";
  condition: 1 | 2 | 3 | 4 | 5;
  size: string;
  estimatedValue?: number;
  onClick?: () => void;
  sale_price_cents?: number;
  available_for_trade?: boolean;
  listing_type?: string;
  user_id?: string;
  onQuickBuy?: () => void;
}

const getVintageBonus = (year: string): number => {
  if (!year || year.trim() === "") return 1.0;
  const yearNum = parseInt(year, 10);
  if (Number.isNaN(yearNum)) return 1.0;
  const age = new Date().getFullYear() - yearNum;
  if (age >= 25) return 1.8;
  if (age >= 15) return 1.4;
  if (age >= 5) return 1.1;
  return 1.0;
};

const JerseyCard = ({
  id,
  name,
  team,
  league,
  year,
  price_cents,
  lowestAsk,
  highestBid,
  imageUrl,
  verified = false,
  verification_status,
  condition,
  size,
  onClick,
  sale_price_cents,
  available_for_trade = false,
  listing_type,
  user_id,
  onQuickBuy,
}: JerseyCardProps) => {
  const isSold = listing_type === "sold";
  const { user } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const isOwner = user?.id === user_id;
  const canBuyNow = (listing_type === "buy_now" || listing_type === "both") && !isOwner && sale_price_cents;
  // Use verification_status if provided, otherwise fall back to verified prop
  const isVerified = verification_status ? verification_status === "verified" : verified;
  const priceCents = price_cents ?? 0;

  // Real market-value data (get_price_intelligence RPC), gated by the shared
  // reliability guard (VINA-PRICE-SANITY) — no Marktwert line, spectrum bar,
  // or price badge unless there's enough non-outlier comparable data. Below
  // that threshold the card just shows the sale price, honestly, with
  // nothing invented on top of it.
  const { data: rpcData, reliability } = usePriceIntelligence({
    team,
    year: parseInt(year) || 0,
    condition: String(condition),
    size,
  });
  const priceDataReliable = reliability.reliable;

  const vintageBonus = getVintageBonus(year);
  const price = priceCents / 100;
  const spectrumMin = priceDataReliable ? rpcData!.fair_value_min_cents / 100 : 0;
  const spectrumMax = priceDataReliable ? rpcData!.fair_value_max_cents / 100 : 0;
  const fairValue = priceDataReliable ? rpcData!.fair_value_mid_cents / 100 : 0;
  const range = spectrumMax - spectrumMin;

  // Positions as percentages on the bar
  const pricePos = priceDataReliable && range > 0
    ? Math.max(2, Math.min(98, ((price - spectrumMin) / range) * 100))
    : 50;

  // Fair zone (±10% of fair value)
  const fairZoneLeft = priceDataReliable && range > 0 ? Math.max(0, ((fairValue * 0.9 - spectrumMin) / range) * 100) : 40;
  const fairZoneRight = priceDataReliable && range > 0 ? Math.min(100, ((fairValue * 1.1 - spectrumMin) / range) * 100) : 60;

  const verdict: PriceVerdict | null = priceDataReliable
    ? getPriceVerdict(price, spectrumMin, spectrumMax, fairValue)
    : null;

  return (
    <div className="group card-hover cursor-pointer rounded-sm border border-border bg-card vintage-border animate-fade-in" onClick={onClick}>
      {/* Image */}
       <div className="relative aspect-square overflow-hidden bg-secondary">
        {getImageUrl(imageUrl) ? (
          <img
            src={getImageUrl(imageUrl)!}
            alt={`${team} ${name}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-6xl text-muted-foreground/30">{team.charAt(0)}</span>
          </div>
        )}
        {isVerified && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-sm bg-primary px-2 py-1 animate-slide-down">
            <ShieldCheck className="h-3 w-3 text-primary-foreground" />
            <span className="font-display text-[10px] font-bold uppercase tracking-wider text-primary-foreground">Zertifiziert</span>
          </div>
        )}
        <div className="absolute right-3 top-3 flex flex-col gap-2 animate-slide-down" style={{ animationDelay: "100ms" }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-sm bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite.mutate(id);
            }}
          >
            <Heart
              className="h-4 w-4"
              fill={isFavorited(id) ? "currentColor" : "none"}
              color={isFavorited(id) ? "currentColor" : "currentColor"}
            />
          </Button>
          <Badge variant="secondary" className="rounded-sm font-display text-[10px] uppercase tracking-wider text-center">
            {size}
          </Badge>
          {available_for_trade && (
            <Badge
              variant="outline"
              className="rounded-sm font-display text-[10px] uppercase tracking-wider animate-slide-down bg-background/80 backdrop-blur-sm"
              style={{ animationDelay: "100ms" }}
            >
              Tausch möglich
            </Badge>
          )}
          {!sale_price_cents && listing_type !== "trade_only" && verdict && (
            <Badge
              className={`rounded-sm font-display text-[10px] uppercase tracking-wider animate-slide-down ${verdict.bg} text-white`}
              style={{ animationDelay: "100ms" }}
            >
              {verdict.label}
            </Badge>
          )}
          {!!sale_price_cents && !isSold && (
            <Badge variant="default" className="rounded-sm font-display text-[10px] uppercase tracking-wider animate-slide-down" style={{ animationDelay: "150ms" }}>
              Kaufen
            </Badge>
          )}
          {isSold && (
            <Badge variant="secondary" className="rounded-sm font-display text-[10px] uppercase tracking-wider animate-slide-down" style={{ animationDelay: "150ms" }}>
              Verkauft
            </Badge>
          )}
        </div>
        {vintageBonus > 1.0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-sm bg-background/90 border border-primary/30 px-2 py-1 backdrop-blur-sm animate-slide-up">
            <Gem className="h-3 w-3 text-primary" />
            <span className="font-display text-[10px] font-bold uppercase tracking-wider text-primary">
              {vintageBonus >= 1.8 ? "Klassiker" : vintageBonus >= 1.4 ? "Retro" : "Vintage"}
            </span>
          </div>
        )}
        <div className="absolute bottom-3 right-3 animate-slide-up" style={{ animationDelay: "200ms" }}>
          {sale_price_cents ? (
            <PriceIntelligence
              team={team}
              year={parseInt(year) || 0}
              condition={condition}
              size={size}
              listingPriceCents={sale_price_cents}
              compact={true}
            />
          ) : null}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{league} · {year}</p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-tight">{team}</h3>
        <p className="text-sm text-muted-foreground">{name}</p>

        {/* Price + Verdict */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            {!!sale_price_cents ? (
              <>
                <p className="text-xs text-muted-foreground">Verkaufspreis</p>
                <p className="font-display text-xl font-bold text-primary">{formatEuros(sale_price_cents)}</p>
              </>
            ) : listing_type === "trade_only" ? (
              <>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-display text-xl font-bold text-foreground">Nur Tausch</p>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Preis</p>
                <p className="font-display text-xl font-bold text-foreground">{priceCents > 0 ? formatEuros(priceCents) : '–'}</p>
              </>
            )}
          </div>
          {!sale_price_cents && listing_type !== "trade_only" && verdict && (
            <Badge
              variant="outline"
              className={`text-xs font-bold ${verdict.color} border-current`}
            >
              {verdict.label}
            </Badge>
          )}
        </div>

        {/* Price Spectrum — only with enough reliable comparable data (VINA-PRICE-SANITY).
            Without it the card just shows the sale price, honestly, with nothing invented. */}
        {priceDataReliable && verdict && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-3 rounded-lg border border-border bg-secondary/50 p-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                    <span>Bewertung: {condition}/5 · {conditionLabels[condition]}</span>
                    <span>Marktwert: €{Math.round(fairValue * 0.9)}–€{Math.round(fairValue * 1.1)}</span>
                  </div>

                  {/* The spectrum bar */}
                  <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-primary/80 via-green-500/60 via-50% to-red-500/80 overflow-hidden">
                    {/* Fair zone highlight */}
                    <div
                      className="absolute top-0 h-full bg-green-500/30 border-x border-green-500/50"
                      style={{ left: `${fairZoneLeft}%`, width: `${fairZoneRight - fairZoneLeft}%` }}
                    />
                  </div>

                  {/* Price indicator (triangle below bar) */}
                  <div className="relative h-4 mt-0.5">
                    <div
                      className="absolute -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${pricePos}%` }}
                    >
                      <div className={`w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent ${verdict.bg.replace('bg-', 'border-b-')}`}
                        style={{ borderBottomColor: 'currentColor' }}
                      />
                      <span className={`text-[9px] font-bold ${verdict.color} whitespace-nowrap`}>€{price}</span>
                    </div>
                  </div>

                  {/* Scale labels */}
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                    <span>€{spectrumMin}</span>
                    <span className="text-green-500 font-medium">€{Math.round(fairValue * 0.9)}–€{Math.round(fairValue * 1.1)}</span>
                    <span>€{spectrumMax}</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px]">
                <p className="text-xs">
                  Bewertung {condition}/5 ({conditionLabels[condition]}).
                  Alter: {(() => {
                    const yearNum = parseInt(year, 10);
                    return Number.isNaN(yearNum) ? '—' : new Date().getFullYear() - yearNum;
                  })()} Jahre.
                  Der grüne Bereich markiert die faire Preisspanne (€{Math.round(fairValue * 0.9)}–€{Math.round(fairValue * 1.1)}).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Bid/Ask row */}
        {(lowestAsk !== undefined || highestBid !== undefined) && (
          <div className="mt-3 flex gap-4 border-t border-border pt-3">
            {lowestAsk !== undefined && (
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Niedrigstes Angebot</p>
                <p className="text-sm font-semibold">{lowestAsk !== null ? formatEuros(lowestAsk) : '–'}</p>
              </div>
            )}
            {highestBid !== undefined && (
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Höchstes Gebot</p>
                <p className="text-sm font-semibold text-primary">{highestBid !== null ? formatEuros(highestBid) : '–'}</p>
              </div>
            )}
          </div>
        )}

        {/* Sofort kaufen button */}
        {canBuyNow && onQuickBuy && (
          <Button
            variant="hero"
            size="sm"
            className="w-full mt-3 uppercase tracking-wider font-display"
            onClick={(e) => {
              e.stopPropagation();
              onQuickBuy();
            }}
          >
            Sofort kaufen — {formatEuros(sale_price_cents)}
          </Button>
        )}
      </div>
    </div>
  );
};

export default JerseyCard;
