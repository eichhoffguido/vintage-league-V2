export function eurosToCents(euros: string | number): number {
  return Math.round(parseFloat(String(euros)) * 100);
}
export function centsToEuros(cents: number): number {
  return cents / 100;
}
export function formatEuros(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}
