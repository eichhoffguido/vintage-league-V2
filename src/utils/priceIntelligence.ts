/**
 * Price Intelligence utilities for calculating fair value estimates,
 * price verdicts, and market position indicators.
 */

export interface PriceIntelligence {
  fairValue: number;
  verdict: PriceVerdict;
  spectrum: {
    min: number;
    max: number;
    fair: number;
  };
  position: {
    percentile: number;
    isGoodDeal: boolean;
    isExpensive: boolean;
  };
}

export type PriceVerdictTone = "schnaeppchen" | "fair" | "ueber" | "premium";

export interface PriceVerdict {
  label: string;
  /** Textfarbe (Design-Token, Skill cc-design §6) */
  color: string;
  /** Flächenfarbe (Design-Token) */
  bg: string;
  tone: PriceVerdictTone;
  icon?: string;
}

export type AgeTier = "Klassiker" | "Retro" | "Vintage";

/** Alters-Stufe aus dem Jahr (≥25 Klassiker, ≥15 Retro, ≥5 Vintage) — eine Quelle für alle Anzeigen. */
export const getAgeTier = (year: string): AgeTier | null => {
  const bonus = getVintageBonus(year);
  if (bonus >= 1.8) return "Klassiker";
  if (bonus >= 1.4) return "Retro";
  if (bonus > 1.0) return "Vintage";
  return null;
};

const conditionMultiplier: Record<number, number> = {
  5: 1.0,
  4: 0.85,
  3: 0.7,
  2: 0.5,
  1: 0.35,
};

/**
 * Calculate vintage bonus based on jersey age
 */
export const getVintageBonus = (year: string): number => {
  if (!year || year.trim() === "") return 1.0;
  const yearNum = parseInt(year, 10);
  if (Number.isNaN(yearNum)) return 1.0;
  const age = new Date().getFullYear() - yearNum;
  if (age >= 25) return 1.8;
  if (age >= 15) return 1.4;
  if (age >= 5) return 1.1;
  return 1.0;
};

/**
 * Calculate price verdict based on current price vs fair value
 */
export const getPriceVerdict = (
  price: number,
  minVal: number,
  maxVal: number,
  fairVal: number
): PriceVerdict => {
  const range = maxVal - minVal;
  if (range === 0) {
    return { label: "Fairer Preis", color: "text-verde", bg: "bg-verde", tone: "fair" };
  }
  if (price <= fairVal * 0.85) {
    return { label: "Schnäppchen", color: "text-verde", bg: "bg-verde", tone: "schnaeppchen" };
  }
  if (price <= fairVal * 1.05) {
    return { label: "Fairer Preis", color: "text-verde", bg: "bg-verde", tone: "fair" };
  }
  if (price <= fairVal * 1.2) {
    return { label: "Über Marktwert", color: "text-nero", bg: "bg-giallo", tone: "ueber" };
  }
  return { label: "Premium-Preis", color: "text-rosso", bg: "bg-rosso", tone: "premium" };
};

/**
 * Calculate comprehensive price intelligence for a jersey
 */
export const calculatePriceIntelligence = (options: {
  priceCents: number;
  estimatedValue?: number;
  condition: number;
  year: string;
}): PriceIntelligence => {
  const { priceCents, estimatedValue, condition, year } = options;

  const price = priceCents / 100;
  const vintageBonus = getVintageBonus(year);
  const condMult = conditionMultiplier[condition] ?? 0.5;

  // Calculate price spectrum
  const baseValue = estimatedValue ?? price;
  const topValue = Math.round(baseValue * 1.0 * vintageBonus);
  const bottomValue = Math.round(baseValue * 0.35 * vintageBonus);
  const fairValue = Math.round(baseValue * condMult * vintageBonus);

  // Spectrum range
  const spectrumMin = Math.round(bottomValue * 0.9);
  const spectrumMax = Math.round(topValue * 1.15);
  const range = spectrumMax - spectrumMin;

  // Price position as percentile
  const percentile = range > 0 ? ((price - spectrumMin) / range) * 100 : 50;

  // Verdict
  const verdict = getPriceVerdict(price, spectrumMin, spectrumMax, fairValue);

  return {
    fairValue,
    verdict,
    spectrum: {
      min: spectrumMin,
      max: spectrumMax,
      fair: fairValue,
    },
    position: {
      percentile: Math.max(2, Math.min(98, percentile)),
      isGoodDeal: price <= fairValue * 0.85,
      isExpensive: price > fairValue * 1.2,
    },
  };
};

/**
 * Get color/styling for price position indicator
 */
export const getPositionColor = (percentile: number): string => {
  if (percentile < 33) return "text-primary"; // Good deals
  if (percentile < 66) return "text-verde"; // Fair price
  return "text-rosso"; // Expensive
};
