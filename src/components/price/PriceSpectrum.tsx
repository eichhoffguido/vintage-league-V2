import { cn } from "@/lib/utils";

interface PriceSpectrumProps {
  minCents: number;
  midCents: number;
  maxCents: number;
  /** Preis, der eingeordnet wird. Ohne Preis nur die Skala. */
  priceCents?: number;
  size?: "mini" | "full";
  className?: string;
}

const euro = (cents: number) => `€${Math.round(cents / 100)}`;

/**
 * Preisskala (Skill cc-design §6 „Figurina“): Spanne min→max aus den Vergleichsdaten,
 * Zonen verde (bis Marktwert +5 %) | giallo (bis +20 %) | rosso (darüber),
 * faire Spanne (Marktwert ±10 %) schwarz umrahmt, schwarze Markierung am Preis.
 * Nur mit verlässlichen Daten verwenden (priceIntelligenceGuard).
 */
const PriceSpectrum = ({ minCents, midCents, maxCents, priceCents, size = "full", className }: PriceSpectrumProps) => {
  const range = maxCents - minCents;
  if (range <= 0) return null;

  const pct = (cents: number) => Math.max(0, Math.min(100, ((cents - minCents) / range) * 100));
  const greenEnd = pct(midCents * 1.05);
  const yellowEnd = Math.max(greenEnd, pct(midCents * 1.2));
  const fairLeft = pct(midCents * 0.9);
  const fairRight = pct(midCents * 1.1);
  const markerPos = priceCents !== undefined ? Math.max(2, Math.min(98, pct(priceCents))) : null;

  const zones = (
    <>
      <div className="absolute inset-y-0 left-0 bg-verde" style={{ width: `${greenEnd}%` }} />
      <div className="absolute inset-y-0 bg-giallo" style={{ left: `${greenEnd}%`, width: `${yellowEnd - greenEnd}%` }} />
      <div className="absolute inset-y-0 right-0 bg-rosso" style={{ left: `${yellowEnd}%` }} />
    </>
  );

  if (size === "mini") {
    return (
      <span className={cn("relative inline-block h-1 w-[54px] shrink-0", className)} aria-hidden>
        {zones}
        {markerPos !== null && (
          <i className="absolute -top-1 block h-3 w-0.5 -translate-x-1/2 bg-nero" style={{ left: `${markerPos}%` }} />
        )}
      </span>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-2.5 w-full">
        {zones}
        {/* faire Spanne */}
        <div
          className="absolute -inset-y-[3px] border border-nero"
          style={{ left: `${fairLeft}%`, width: `${Math.max(1, fairRight - fairLeft)}%` }}
          aria-hidden
        />
      </div>
      {markerPos !== null && priceCents !== undefined && (
        <div className="relative mt-1 h-5">
          <div className="absolute flex -translate-x-1/2 flex-col items-center" style={{ left: `${markerPos}%` }}>
            <span className="h-0 w-0 border-x-[5px] border-b-[6px] border-x-transparent border-b-nero" aria-hidden />
            <span className="num whitespace-nowrap text-xs leading-none">{euro(priceCents)}</span>
          </div>
        </div>
      )}
      <div className="cap mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{euro(minCents)}</span>
        <span className="text-nero">Fair {euro(midCents * 0.9)}–{euro(midCents * 1.1)}</span>
        <span>{euro(maxCents)}</span>
      </div>
    </div>
  );
};

export default PriceSpectrum;
