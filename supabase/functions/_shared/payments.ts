// CC-S2 — Pure payment helpers shared by the Edge Functions.
//
// IMPORTANT: this file must stay free of Deno globals and URL imports so it can
// also be imported by the Node/Vitest test suite (src/test/payments-shared.test.ts).

/** Platform fee in basis points (500 bps = 5 %). Single source of truth. */
export const PLATFORM_FEE_BPS = 500;

/**
 * How long a Checkout Session reserves a jersey. Stripe requires expires_at to be
 * at least 30 minutes after session creation, so we add a small safety buffer to
 * avoid "expires_at too early" errors caused by clock skew / request latency.
 */
export const CHECKOUT_RESERVATION_SECONDS = 30 * 60;
export const CHECKOUT_EXPIRY_BUFFER_SECONDS = 60;

/** Platform fee in integer cents for an amount in integer cents. */
export function calculatePlatformFeeCents(amountCents: number): number {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error(`amountCents must be a non-negative integer, got ${amountCents}`);
  }
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
}

/** Unix timestamp (seconds) for the Checkout Session's expires_at. */
export function checkoutExpiresAtUnix(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / 1000) + CHECKOUT_RESERVATION_SECONDS + CHECKOUT_EXPIRY_BUFFER_SECONDS;
}

// ── CORS origin allowlist ──────────────────────────────────────────────────────
export const ALLOWED_ORIGINS: readonly string[] = [
  "https://calcioclassics.de",
  "https://www.calcioclassics.de",
  "https://vintage-league-v2.vercel.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

/** Vercel preview deployments, e.g. https://vintage-league-v2-abc123-guido-eichhoffs-projects.vercel.app */
export const PREVIEW_ORIGIN_PATTERN =
  /^https:\/\/vintage-league-v2-[a-z0-9-]+-guido-eichhoffs-projects\.vercel\.app$/;

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin) || PREVIEW_ORIGIN_PATTERN.test(origin);
}

/**
 * Base URL for Stripe success/cancel redirects.
 * Prefers the SITE_URL secret; otherwise falls back to the request Origin, but
 * only if it is on the allowlist. Returns null if neither is usable.
 */
export function resolveSiteUrl(
  siteUrlEnv: string | null | undefined,
  origin: string | null | undefined,
): string | null {
  const fromEnv = siteUrlEnv?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (origin && isAllowedOrigin(origin)) return origin;
  return null;
}

// ── Transaction / checkout status ─────────────────────────────────────────────
export type TransactionStatus = "pending" | "completed" | "refunded" | "expired" | "failed";
export type CheckoutFlow = "direct_buy" | "bid_ask_match";
export type PublicCheckoutStatus = "paid" | "pending" | "failed" | "expired";

/**
 * Status shown to the buyer on the success page, derived from the DB row only.
 * "refunded" is reported as "failed" (purchase not completed, money returned).
 * A pending row whose reservation already ran out is reported as "expired".
 */
export function toPublicCheckoutStatus(
  status: string,
  checkoutExpiresAt: string | null,
  nowMs: number = Date.now(),
): PublicCheckoutStatus {
  switch (status) {
    case "completed":
      return "paid";
    case "expired":
      return "expired";
    case "failed":
    case "refunded":
      return "failed";
    case "pending":
    default:
      if (checkoutExpiresAt && new Date(checkoutExpiresAt).getTime() < nowMs) {
        return "expired";
      }
      return "pending";
  }
}

/**
 * Meldung, wenn ein Trikot nicht gekauft werden kann, weil schon ein Kauf läuft oder abgeschlossen ist.
 * Bei einer Reservierung nennt sie die Uhrzeit (Berlin), zu der das Trikot spätestens wieder frei ist.
 */
export function reservedMessage(status: string, checkoutExpiresAt: string | null): string {
  if (status === "completed") return "Dieses Trikot ist bereits verkauft.";
  if (!checkoutExpiresAt) return "Dieses Trikot ist gerade im Bezahlvorgang eines anderen Käufers.";
  const time = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(
    new Date(checkoutExpiresAt),
  );
  return `Dieses Trikot ist gerade im Bezahlvorgang eines anderen Käufers. Kommt der Kauf nicht zustande, ist es spätestens um ${time} Uhr wieder frei.`;
}

/**
 * Darf ein Käufer seinen eigenen, noch offenen Bezahlvorgang fortsetzen? Nur wenn die Stripe-Sitzung offen ist
 * und der Betrag noch stimmt (sonst wird sie beendet und eine neue angelegt).
 */
export function canResumeCheckout(
  session: { status: string | null; url: string | null; amount_total: number | null },
  amountCents: number,
): boolean {
  return session.status === "open" && !!session.url && session.amount_total === amountCents;
}

/** Postgres unique_violation error code. */
export const PG_UNIQUE_VIOLATION = "23505";
export const ONE_ACTIVE_SALE_INDEX = "transactions_one_active_sale_per_jersey";
