import { useState, type ReactNode } from "react";
import { ChevronDown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEuros } from "@/utils/currency";
import { getImageUrl } from "@/utils/imageUrl";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import PriceIntelligence from "@/components/PriceIntelligence";
import PriceSpectrum from "@/components/price/PriceSpectrum";
import { usePriceIntelligence } from "@/hooks/usePriceIntelligence";
import { getAgeTier, getPriceVerdict, type PriceVerdict } from "@/utils/priceIntelligence";
import { CONDITION_LABELS as conditionLabels } from "@/data/condition";
import { cn } from "@/lib/utils";

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
  /** "card" = Figurina (Raster), "row" = kompakte Zeile (Listenansicht) */
  layout?: "card" | "row";
}

// Rahmenfarbe rotiert rein dekorativ, stabil pro Trikot (Skill cc-design §2)
const FRAME_COLORS = ["border-verde", "border-azzurro", "border-giallo", "border-rosso"] as const;
const frameColorFor = (id: string) =>
  FRAME_COLORS[[...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % FRAME_COLORS.length];

const TAG = "inline-flex items-center border px-[7px] py-1 font-body text-[10px] font-medium uppercase leading-none tracking-[0.14em]";

/** Kompaktes Preisurteil: Mini-Skala + Urteilswort. */
const VerdictInline = ({ verdict, mini }: { verdict: PriceVerdict; mini: ReactNode }) => (
  <span className="flex items-center gap-2">
    {mini}
    <span
      className={cn(
        "cap whitespace-nowrap text-[10px]",
        verdict.tone === "ueber" ? "text-nero" : verdict.color,
      )}
    >
      {verdict.label}
    </span>
  </span>
);

/**
 * Figurina — die Trikot-Karte (Skill cc-design §6). Zeigt alle Informationen der bisherigen Karte:
 * Prüfstatus, Merkliste, Größe, Alters-Stufe, Tausch/Kaufen/Verkauft, Smart Buy, Preisurteil mit Skala
 * und Marktwert-Spanne (nur mit verlässlichen Daten), Gebot/Angebot, Sofort kaufen.
 */
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
  layout = "card",
}: JerseyCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { user } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();

  const isSold = listing_type === "sold";
  const isTradeOnly = listing_type === "trade_only";
  const isOwner = user?.id === user_id;
  const canBuyNow = (listing_type === "buy_now" || listing_type === "both") && !isOwner && !!sale_price_cents && !isSold;
  const isVerified = verification_status ? verification_status === "verified" : verified;
  const isPending = verification_status === "pending";
  const favorited = isFavorited(id);

  // Angezeigter Preis = Verkaufspreis, sonst Preisangabe. Urteil und Skala beziehen sich auf genau diesen Preis.
  const shownPriceCents = sale_price_cents || price_cents || 0;

  // Marktwert aus get_price_intelligence, nur über den gemeinsamen Guard (VINA-PRICE-SANITY):
  // ohne verlässliche Vergleichsdaten kein Marktwert, keine Skala, kein Urteil.
  const { data: rpcData, reliability } = usePriceIntelligence({
    team,
    year: parseInt(year) || 0,
    condition: String(condition),
    size,
  });
  const reliable = reliability.reliable && !!rpcData;

  const verdict: PriceVerdict | null =
    reliable && !isTradeOnly && !isSold && shownPriceCents > 0
      ? getPriceVerdict(
          shownPriceCents / 100,
          rpcData.fair_value_min_cents / 100,
          rpcData.fair_value_max_cents / 100,
          rpcData.fair_value_mid_cents / 100,
        )
      : null;

  const ageTier = getAgeTier(year);
  const yearNum = parseInt(year, 10);
  const age = Number.isNaN(yearNum) ? null : new Date().getFullYear() - yearNum;
  const image = getImageUrl(imageUrl);

  const headBlock = (
    <>
      {/* 1 · Kopfzeile */}
      <div className="cap flex items-center justify-between gap-2 text-[10px] md:text-[11px]">
        <span className="truncate">{league}</span>
        {isVerified ? (
          <span className="shrink-0 text-verde">● Verificato</span>
        ) : isPending ? (
          <span className="shrink-0 text-muted-foreground">In Prüfung</span>
        ) : null}
      </div>

    </>
  );

  const imageBlock = (
    <>
      {/* 2 · Bild mit farbigem Rahmen */}
      <div className={cn("grain grain-photo relative aspect-[4/5] overflow-hidden border-[4px] bg-sabbia md:border-[6px]", frameColorFor(id))}>
        {image ? (
          <img
            src={image}
            alt={`${team} ${name}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="display text-6xl text-nero/25">{team.charAt(0)}</span>
          </div>
        )}

        <button
          type="button"
          className={cn(
            "absolute right-1.5 top-1.5 z-[2] flex h-8 w-8 items-center justify-center border border-nero bg-card transition-colors hover:bg-nero hover:text-avorio",
            favorited && "bg-nero text-avorio",
          )}
          aria-label={favorited ? "Von der Merkliste entfernen" : "Auf die Merkliste"}
          aria-pressed={favorited}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite.mutate(id);
          }}
        >
          <Heart className="h-4 w-4" fill={favorited ? "currentColor" : "none"} />
        </button>

        <div className="absolute bottom-1.5 left-1.5 z-[2] flex flex-wrap gap-1">
          {size && <span className={cn(TAG, "border-nero bg-card text-nero")}>{size}</span>}
          {ageTier && <span className={cn(TAG, "border-nero bg-card text-nero")}>{ageTier}</span>}
        </div>
      </div>

    </>
  );

  const restBlock = (
    <>
      {/* 3 · Titel */}
      <div>
        <h3 className="font-display text-[15px] font-semibold normal-case leading-tight tracking-[-0.02em] md:text-[17px]">{team}</h3>
        {name && <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground md:text-sm">{name}</p>}
      </div>

      {/* 4 · Meta, zwei feste Zeilen */}
      <div className="cap text-[10px] leading-relaxed text-muted-foreground md:text-[10px]">
        <div className="truncate">{[year && `Saison ${year}`, size && `Größe ${size}`].filter(Boolean).join(" · ")}</div>
        <div className="truncate">Zustand: {conditionLabels[condition]}</div>
      </div>

      {/* 5 · Status-Tags */}
      <div className="flex flex-wrap gap-1">
        {isSold && <span className={cn(TAG, "border-nero bg-nero text-avorio")}>Verkauft</span>}
        {isTradeOnly && <span className={cn(TAG, "border-rosso text-rosso")}>Nur Tausch</span>}
        {available_for_trade && !isTradeOnly && !isSold && <span className={cn(TAG, "border-rosso text-rosso")}>Tausch möglich</span>}
        {!!sale_price_cents && !isSold && <span className={cn(TAG, "border-nero text-nero")}>Sofort kaufen</span>}
        {!!sale_price_cents && !isSold && (
          <PriceIntelligence
            team={team}
            year={parseInt(year) || 0}
            condition={String(condition)}
            size={size}
            listingPriceCents={sale_price_cents}
            compact
          />
        )}
      </div>

      {/* 6 · Preiszeile, unten angepinnt */}
      <div className="mt-auto border-t border-nero pt-2">
        <div className="cap text-[10px] text-muted-foreground md:text-[10px]">
          {sale_price_cents ? "Verkaufspreis" : isTradeOnly ? "Status" : "Preis"}
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className="num text-[20px] leading-none md:text-[24px]">
            {isTradeOnly && !sale_price_cents ? "Nur Tausch" : shownPriceCents > 0 ? formatEuros(shownPriceCents) : "–"}
          </span>
          {verdict && rpcData && (
            <VerdictInline
              verdict={verdict}
              mini={
                <PriceSpectrum
                  size="mini"
                  minCents={rpcData.fair_value_min_cents}
                  midCents={rpcData.fair_value_mid_cents}
                  maxCents={rpcData.fair_value_max_cents}
                  priceCents={shownPriceCents}
                  className="hidden md:inline-block"
                />
              }
            />
          )}
        </div>
      </div>

      {/* 7 · Marktwert-Details (nur verlässlich) / ruhiger Hinweis */}
      {reliable && rpcData && !isTradeOnly ? (
        <div>
          <button
            type="button"
            className="cap flex w-full items-center justify-between gap-2 text-left text-[10px] text-muted-foreground hover:text-nero md:text-[10px]"
            aria-expanded={detailsOpen}
            onClick={(e) => {
              e.stopPropagation();
              setDetailsOpen((open) => !open);
            }}
          >
            <span>
              Marktwert €{Math.round(rpcData.fair_value_mid_cents * 0.009)}–{Math.round(rpcData.fair_value_mid_cents * 0.011)} · {rpcData.comparable_count} Vergleiche
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", detailsOpen && "rotate-180")} />
          </button>
          {detailsOpen && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <PriceSpectrum
                minCents={rpcData.fair_value_min_cents}
                midCents={rpcData.fair_value_mid_cents}
                maxCents={rpcData.fair_value_max_cents}
                priceCents={shownPriceCents > 0 ? shownPriceCents : undefined}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Zustand {condition}/5 ({conditionLabels[condition]}){age !== null ? ` · ${age} Jahre alt` : ""}. Der umrahmte Bereich ist die faire Preisspanne.
              </p>
            </div>
          )}
        </div>
      ) : !reliability.reliable && reliability.reason !== "no-data" && !isTradeOnly ? (
        <div className="cap text-[10px] text-muted-foreground md:text-[10px]">Zu wenige Vergleichsdaten</div>
      ) : null}

      {/* 8 · Gebot / Angebot */}
      {(lowestAsk !== undefined || highestBid !== undefined) && (
        <div className="flex gap-4 border-t border-nero/25 pt-2">
          {lowestAsk !== undefined && (
            <div className="flex-1">
              <div className="cap text-[10px] text-muted-foreground md:text-[10px]">Niedrigstes Angebot</div>
              <div className="num text-base">{lowestAsk !== null ? formatEuros(lowestAsk) : "–"}</div>
            </div>
          )}
          {highestBid !== undefined && (
            <div className="flex-1">
              <div className="cap text-[10px] text-muted-foreground md:text-[10px]">Höchstes Gebot</div>
              <div className="num text-base text-verde">{highestBid !== null ? formatEuros(highestBid) : "–"}</div>
            </div>
          )}
        </div>
      )}

      {/* 9 · Sofort kaufen */}
      {canBuyNow && onQuickBuy && (
        <Button
          variant="dark"
          size="sm"
          className="w-full px-2 text-[10px] md:text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onQuickBuy();
          }}
        >
          Sofort kaufen — {formatEuros(sale_price_cents!)}
        </Button>
      )}
    </>
  );

  if (layout === "row") {
    // Listenansicht: Bild links, alle Infos rechts (gleicher Inhalt wie die Karte)
    return (
      <article
        className="group grid cursor-pointer grid-cols-[112px_minmax(0,1fr)] gap-3 border-2 border-nero bg-card p-2 md:grid-cols-[180px_minmax(0,1fr)] md:gap-5 md:p-3"
        onClick={onClick}
      >
        <div className="self-start">{imageBlock}</div>
        <div className="flex min-w-0 flex-col gap-2.5">
          {headBlock}
          {restBlock}
        </div>
      </article>
    );
  }

  return (
    <article
      className="group flex h-full cursor-pointer flex-col gap-2.5 border-2 border-nero bg-card p-2 md:p-3"
      onClick={onClick}
    >
      {headBlock}
      {imageBlock}
      {restBlock}
    </article>
  );
};

export default JerseyCard;
