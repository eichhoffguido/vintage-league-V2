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

  const title = (
    <>
      <div className="cap text-rosso">Mercato · Markttiefe</div>
      <h2 className="display mt-2.5 text-[32px] md:text-[44px]">
        Gebote &amp; <span className="hollow-dark">Angebote.</span>
      </h2>
    </>
  );

  if (isEmpty) {
    return (
      <div>
        {title}
        <div className="mt-6 border-2 border-nero bg-card p-6 text-center">
          <p className="cap text-[11px] text-muted-foreground">Noch keine Gebote oder Angebote</p>
        </div>
      </div>
    );
  }

  const maxRows = Math.max(data!.bids.length, data!.asks.length);

  return (
    <div>
      {title}
      {spread !== null && (
        <div className="cap mt-4 text-[11px] text-muted-foreground">
          Spread <span className="num ml-1 text-base text-nero">{formatEuros(spread)}</span>
        </div>
      )}
      <table className="mt-6 w-full border-t border-nero text-sm">
        <thead>
          <tr className="cap border-b border-nero text-[10px] md:text-[11px]">
            <th className="py-2 text-left font-medium text-verde">Gebot</th>
            <th className="py-2 pr-4 text-right font-medium text-verde">Anz.</th>
            <th className="border-l border-nero py-2 pl-4 text-left font-medium text-muted-foreground">Angebot</th>
            <th className="py-2 text-right font-medium text-muted-foreground">Anz.</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, i) => {
            const bid = data!.bids[i];
            const ask = data!.asks[i];
            return (
              <tr key={i} className="border-b border-nero/25">
                <td className={`num py-2 text-base ${i === 0 && bid ? "text-verde" : ""}`}>{bid ? formatEuros(bid.price_cents) : "—"}</td>
                <td className="py-2 pr-4 text-right text-muted-foreground">{bid ? bid.count : ""}</td>
                <td className={`num border-l border-nero py-2 pl-4 text-base ${i === 0 && ask ? "" : "text-muted-foreground"}`}>{ask ? formatEuros(ask.price_cents) : "—"}</td>
                <td className="py-2 text-right text-muted-foreground">{ask ? ask.count : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MarketDepth;
