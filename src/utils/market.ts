import { supabase } from "@/integrations/supabase/client";

export interface MarketDepthRow {
  price_cents: number;
  count: number;
}

export interface MarketDepthData {
  bids: MarketDepthRow[];
  asks: MarketDepthRow[];
}

/**
 * Returns the lowest active ask price (in cents) for a jersey, or null if none.
 */
export const getLowestAsk = async (jerseyId: string): Promise<number | null> => {
  const { data, error } = await supabase
    .from("asks")
    .select("price_cents")
    .eq("jersey_id", jerseyId)
    .eq("status", "active")
    .order("price_cents", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.price_cents;
};

/**
 * Returns the highest active bid price (in cents) for a jersey, or null if none.
 */
export const getHighestBid = async (jerseyId: string): Promise<number | null> => {
  const { data, error } = await supabase
    .from("bids")
    .select("price_cents")
    .eq("jersey_id", jerseyId)
    .eq("status", "active")
    .order("price_cents", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.price_cents;
};

/**
 * Returns aggregated market depth for a jersey:
 * - Top 5 bids grouped by price (descending)
 * - Top 5 asks grouped by price (ascending)
 */
export const getMarketDepth = async (jerseyId: string): Promise<MarketDepthData> => {
  const [bidsResult, asksResult] = await Promise.all([
    supabase
      .from("bids")
      .select("price_cents")
      .eq("jersey_id", jerseyId)
      .eq("status", "active"),
    supabase
      .from("asks")
      .select("price_cents")
      .eq("jersey_id", jerseyId)
      .eq("status", "active"),
  ]);

  const aggregateRows = (rows: { price_cents: number }[] | null, ascending: boolean): MarketDepthRow[] => {
    if (!rows || rows.length === 0) return [];
    const counts = new Map<number, number>();
    for (const row of rows) {
      counts.set(row.price_cents, (counts.get(row.price_cents) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries())
      .sort((a, b) => ascending ? a[0] - b[0] : b[0] - a[0])
      .slice(0, 5);
    return sorted.map(([price_cents, count]) => ({ price_cents, count }));
  };

  return {
    bids: aggregateRows(bidsResult.data, false),
    asks: aggregateRows(asksResult.data, true),
  };
};
