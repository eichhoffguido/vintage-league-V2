/**
 * Shared reliability guard for get_price_intelligence() results (VINA-PRICE-SANITY).
 * With too few comparables, or a max far above the median, the RPC's
 * fuzzy-tier expansion can produce an unreliable band. Every place that
 * displays a market-value estimate, spectrum bar, or price badge derived
 * from this RPC must go through this single guard so the rules stay
 * consistent everywhere (jersey detail, add-jersey dialog, marketplace
 * grid cards).
 */

export const MIN_COMPARABLES = 5;
export const OUTLIER_MAX_TO_MID_RATIO = 3;

export interface PriceIntelligenceRpcData {
  fair_value_mid_cents: number;
  fair_value_min_cents: number;
  fair_value_max_cents: number;
  comparable_count: number;
}

export type PriceReliability =
  | { reliable: true }
  | { reliable: false; reason: "no-data" | "insufficient" | "outlier" };

export function assessPriceReliability(
  data: PriceIntelligenceRpcData | null | undefined
): PriceReliability {
  if (!data) return { reliable: false, reason: "no-data" };

  if (!data.comparable_count || data.comparable_count < MIN_COMPARABLES) {
    return { reliable: false, reason: "insufficient" };
  }

  if (!data.fair_value_mid_cents || !data.fair_value_min_cents || !data.fair_value_max_cents) {
    return { reliable: false, reason: "insufficient" };
  }

  if (data.fair_value_max_cents > OUTLIER_MAX_TO_MID_RATIO * data.fair_value_mid_cents) {
    return { reliable: false, reason: "outlier" };
  }

  return { reliable: true };
}

export function isPriceDataReliable(data: PriceIntelligenceRpcData | null | undefined): boolean {
  return assessPriceReliability(data).reliable;
}
