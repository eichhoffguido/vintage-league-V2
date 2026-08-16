import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  assessPriceReliability,
  type PriceIntelligenceRpcData,
} from "@/utils/priceIntelligenceGuard";

interface UsePriceIntelligenceParams {
  team: string;
  year: number;
  condition?: string;
  size?: string;
}

/**
 * Single fetch implementation for get_price_intelligence(), shared by every
 * consumer (jersey detail, add-jersey dialog, marketplace grid cards) so
 * there is exactly one place that talks to the RPC and one reliability
 * guard (see priceIntelligenceGuard.ts) applied consistently everywhere.
 */
export function usePriceIntelligence({ team, year, condition, size }: UsePriceIntelligenceParams) {
  const [data, setData] = useState<PriceIntelligenceRpcData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    supabase
      .rpc("get_price_intelligence", {
        p_team: team,
        p_year: year,
        p_condition: condition || null,
        p_size: size || null,
      })
      .then(({ data: result, error }) => {
        if (cancelled) return;
        if (error) {
          console.debug("[usePriceIntelligence] RPC error", { team, year, condition, size, error });
          setData(null);
        } else {
          // RPC returns an array (SETOF type) — unwrap the first element.
          const item = Array.isArray(result) ? result[0] : result;
          console.debug("[usePriceIntelligence] raw values", {
            team,
            year,
            condition,
            size,
            comparable_count: item?.comparable_count,
            fair_value_min_cents: item?.fair_value_min_cents,
            fair_value_mid_cents: item?.fair_value_mid_cents,
            fair_value_max_cents: item?.fair_value_max_cents,
          });
          setData(item ?? null);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [team, year, condition, size]);

  return {
    data,
    loading,
    reliability: assessPriceReliability(data),
    reliable: assessPriceReliability(data).reliable,
  };
}
