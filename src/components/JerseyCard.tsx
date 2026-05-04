import { ShieldCheck, Gem, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatEuros } from "@/utils/currency";
import { useWatchlist } from "@/hooks/useWatchlist";

interface JerseyCardProps {
  id: string;
  name: string;
  team: string;
  league: string;
  year: string;
  price_cents: number;
  lowestAsk?: number;
  highestBid?: number;
  imageUrl: string;
  verified?: boolean;
  condition: 1 | 2 | 3 | 4 | 5;
  size: string;
  estimatedValue?: number;
  isFavorited?: boolean;
  onFavoriteToggle?: (jerseyId: string) => void;
  onClick?: () => void;
  is_for_sale?: boolean;
  sale_price_cents?: number;
  available_for_trade?: boolean;
}

const conditionLabels: Record<number, string> = {
  5: "Neuwertig",
  4: "Sehr gut",
  3: "Gut erhalten",
  2: "Gebraucht",
  1: "Sammlerstück",
};

const conditionMultiplier: Record<number, number> = {
  5: 1.0,
  4: 0.85,
  3: 0.7,
  2: 0.5,
  1: 0.35,
};

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

const getPriceVerdict = (price: number, minVal: number, maxVal: number, fairVal: number) => {
  const range = maxVal - minVal;
  if (range === 0) return { label: "Fairer Preis", color: "text-green-500", bg: "bg-green-500" };


  if (price <= fairVal * 0.85) return { label: "Schnäppchen 🔥", color: "text-primary", bg: "bg-primary" };
  if (price <= fairVal * 1.05) return { label: "Fairer Preis", color: "text-green-500", bg: "bg-green-500" };
  if (price <= fairVal * 1.2) return { label: "Über Marktwert", color: "text-green-500", bg: "bg-green-500" };
  return { label: "Premium-Preis", color: "text-orange-400", bg: "bg-orange-400" };
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
  condition,
  size,
  estimatedValue: estimatedValueProp,
  isFavorited = false,
  onFavoriteToggle,
  onClick,
  is_for_sale = false,
  sale_price_cents,
  available_for_trade = false,
}: JerseyCardProps) => {
  const { isFavorited, toggleFavorite } = useWatchlist();
  const vintageBonus = getVintageBonus(year);
  const condMult = conditionMultiplier[condition] ?? 0.5;
  const priceCents = price_cents ?? 0;
  const price = priceCents / 100;

  // Calculate price spectrum
  const baseValue = estimatedValueProp ?? price;
  const topValue = Math.round(baseValue * 1.0 * vintageBonus); // "Neu" value
  const bottomValue = Math.round(baseValue * 0.35 * vintageBonus); // below "Akzeptabel"
  const fairValue = Math.round(baseValue * condMult * vintageBonus);

  // Spectrum range
  const spectrumMin = Math.round(bottomValue * 0.9);
  const spectrumMax = Math.round(topValue * 1.15);
  const range = spectrumMax - spectrumMin;

  // Positions as percentages on the bar

  const pricePos = range > 0 ? Math.max(2, Math.min(98, ((price - spectrumMin) / range) * 100)) : 50;

  // Fair zone (±10% of fair value)
  const fairZoneLeft = range > 0 ? Math.max(0, ((fairValue * 0.9 - spectrumMin) / range) * 100) : 40;
  const fairZoneRight = range > 0 ? Math.min(100, ((fairValue * 1.1 - spectrumMin) / range) * 100) : 60;

  const verdict = getPriceVerdict(price, spectrumMin, spectrumMax, fairValue);

  return (
    <div className="group card-hover cursor-pointer overflow-hidden rounded-sm border border-border bg-card vintage-border animate-fade-in" onClick={onClick}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={imageUrl}
          alt={`${team} ${name}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {verified && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-sm bg-primary px-2 py-1 animate-slide-down">
            <ShieldCheck className="h-3 w-3 text-primary-foreground" />
            <span className="font-display text-[10px] font-bold uppercase tracking-wider text-primary-foreground">Zertifiziert</span>
          </div>
        )}
<<<<<<< HEAD
        <div className="absolute right-3 top-3 flex flex-col gap-2 animate-slide-down" style={{ animationDelay: "100ms" }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-sm bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(id);
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
          {is_for_sale && (
            <Badge variant="default" className="rounded-sm font-display text-[10px] uppercase tracking-wider animate-slide-down" style={{ animationDelay: "150ms" }}>
              Kaufen
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
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{league} · {year}</p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-tight">{team}</h3>
        <p className="text-sm text-muted-foreground">{name}</p>

        {/* Price + Verdict */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            {is_for_sale && sale_price_cents ? (
              <>
                <p className="text-xs text-muted-foreground">Verkaufspreis</p>
                <p className="font-display text-xl font-bold text-primary">{formatEuros(sale_price_cents)}</p>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Preis</p>
                <p className="font-display text-xl font-bold text-foreground">{priceCents > 0 ? formatEuros(priceCents) : '–'}</p>
              </>
            )}
          </div>
          {!is_for_sale && (
            <Badge
              variant="outline"
              className={`text-xs font-bold ${verdict.color} border-current`}
            >
              {verdict.label}
            </Badge>
          )}
        </div>

        {/* Price Spectrum */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-3 rounded-lg border border-border bg-secondary/50 p-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                  <span>Bewertung: {condition}/5 · {conditionLabels[condition]}</span>
                  <span>Marktwert: {Number.isFinite(fairValue) ? `€${Math.round(fairValue * 0.9)}–€${Math.round(fairValue * 1.1)}` : '–'}</span>
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
                    <span className={`text-[9px] font-bold ${verdict.color} whitespace-nowrap`}>{Number.isFinite(price) ? `€${price}` : '–'}</span>
                  </div>
                </div>

                {/* Scale labels */}
                <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                  <span>{Number.isFinite(spectrumMin) ? `€${spectrumMin}` : '–'}</span>
                  <span className="text-green-500 font-medium">{Number.isFinite(fairValue) ? `€${Math.round(fairValue * 0.9)}–€${Math.round(fairValue * 1.1)}` : '–'}</span>
                  <span>{Number.isFinite(spectrumMax) ? `€${spectrumMax}` : '–'}</span>
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
      </div>
    </div>
  );
};

export default JerseyCard;
