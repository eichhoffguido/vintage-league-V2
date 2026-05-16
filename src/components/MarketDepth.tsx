import { useEffect, useState } from "react";
import { getMarketDepth, type MarketDepthData } from "@/utils/market";
import { formatEuros } from "@/utils/currency";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketDepthProps {
  jerseyId: string;
}

const MarketDepth = ({ jerseyId }: MarketDepthProps) => {
  const [data, setData] = useState<MarketDepthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMarketDepth(jerseyId).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [jerseyId]);

  const lowestAsk = data?.asks[0]?.price_cents ?? null;
  const highestBid = data?.bids[0]?.price_cents ?? null;
  const spread =
    lowestAsk !== null && highestBid !== null ? lowestAsk - highestBid : null;

  const isEmpty =
    !loading && data && data.bids.length === 0 && data.asks.length === 0;

  if (loading) {
    return (
      <div className="rounded-sm border border-border p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-sm border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">Noch keine Gebote oder Angebote</p>
      </div>
    );
  }

  const maxRows = Math.max(data!.bids.length, data!.asks.length);

  return (
    <div className="rounded-sm border border-border p-6">
      <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
        Markttiefe
      </p>

      {/* Spread */}
      {spread !== null && (
        <div className="mb-4 flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">
            Spread: {formatEuros(spread)}
          </span>
        </div>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div className="grid grid-cols-2 gap-2">
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Gebot (Preis)</p>
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold text-right">Anz.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Angebot (Preis)</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">Anz.</p>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {Array.from({ length: maxRows }).map((_, i) => {
          const bid = data!.bids[i];
          const ask = data!.asks[i];
          const isBestBid = i === 0 && bid !== undefined;
          const isBestAsk = i === 0 && ask !== undefined;

          return (
            <div key={i} className="grid grid-cols-2 gap-4">
              {/* Bid side */}
              <div className="grid grid-cols-2 gap-2">
                {bid ? (
                  <>
                    <p className={`text-sm font-medium ${isBestBid ? "text-primary font-bold" : "text-foreground"}`}>
                      {formatEuros(bid.price_cents)}
                    </p>
                    <p className="text-sm text-right text-muted-foreground">{bid.count}</p>
                  </>
                ) : (
                  <p className="col-span-2 text-sm text-muted-foreground">—</p>
                )}
              </div>

              {/* Ask side */}
              <div className="grid grid-cols-2 gap-2">
                {ask ? (
                  <>
                    <p className={`text-sm font-medium ${isBestAsk ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                      {formatEuros(ask.price_cents)}
                    </p>
                    <p className="text-sm text-right text-muted-foreground">{ask.count}</p>
                  </>
                ) : (
                  <p className="col-span-2 text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketDepth;
