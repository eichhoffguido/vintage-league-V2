/**
 * Currency conversion utilities for euro/cents handling.
 * Database stores prices as integer cents.
 * UI displays and accepts prices in euros.
 */

export const eurosToCents = (euros: number | string | null | undefined): number | null => {
  if (euros === null || euros === undefined || euros === "") return null;
  const amount = typeof euros === "string" ? parseFloat(euros) : euros;
  if (Number.isNaN(amount)) return null;
  return Math.round(amount * 100);
};

export const centsToEuros = (cents: number | null | undefined): number | null => {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return null;
  return Math.round((cents / 100) * 100) / 100;
};

// Deutsches Format: „1.234,50 €“ (Calcio Classics ist eine deutsche Seite)
const EURO_FORMAT = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export const formatEuros = (cents: number | null | undefined): string => {
  const euros = centsToEuros(cents);
  if (euros === null) return "";
  return EURO_FORMAT.format(euros);
};
