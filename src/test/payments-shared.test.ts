import { describe, it, expect } from "vitest";
import {
  calculatePlatformFeeCents,
  checkoutExpiresAtUnix,
  isAllowedOrigin,
  PLATFORM_FEE_BPS,
  resolveSiteUrl,
  toPublicCheckoutStatus,
} from "../../supabase/functions/_shared/payments.ts";

describe("calculatePlatformFeeCents", () => {
  it("uses 5 % (500 bps)", () => {
    expect(PLATFORM_FEE_BPS).toBe(500);
    expect(calculatePlatformFeeCents(10000)).toBe(500);
    expect(calculatePlatformFeeCents(0)).toBe(0);
  });

  it("rounds to integer cents", () => {
    expect(calculatePlatformFeeCents(4999)).toBe(250); // 249.95
    expect(calculatePlatformFeeCents(4990)).toBe(250); // 249.5
    expect(calculatePlatformFeeCents(4989)).toBe(249); // 249.45
    expect(calculatePlatformFeeCents(1)).toBe(0);
  });

  it("rejects non-integer or negative amounts", () => {
    expect(() => calculatePlatformFeeCents(10.5)).toThrow();
    expect(() => calculatePlatformFeeCents(-1)).toThrow();
  });
});

describe("checkoutExpiresAtUnix", () => {
  it("is at least 30 minutes in the future", () => {
    const now = Date.UTC(2026, 8, 26, 12, 0, 0);
    expect(checkoutExpiresAtUnix(now) - now / 1000).toBeGreaterThanOrEqual(30 * 60);
    expect(checkoutExpiresAtUnix(now) - now / 1000).toBeLessThanOrEqual(32 * 60);
  });
});

describe("isAllowedOrigin", () => {
  it.each([
    "https://calcioclassics.de",
    "https://www.calcioclassics.de",
    "https://vintage-league-v2.vercel.app",
    "https://vintage-league-v2-git-feature-cc-s2-guido-eichhoffs-projects.vercel.app",
    "https://vintage-league-v2-abc123xyz-guido-eichhoffs-projects.vercel.app",
    "http://localhost:8080",
    "http://localhost:5173",
  ])("allows %s", (origin) => {
    expect(isAllowedOrigin(origin)).toBe(true);
  });

  it.each([
    null,
    "",
    "https://evil.example",
    "http://calcioclassics.de",
    "https://calcioclassics.de.evil.example",
    "https://vintage-league-v2-x-guido-eichhoffs-projects.vercel.app.evil.example",
    "https://other-app-guido-eichhoffs-projects.vercel.app",
    "http://localhost:3000",
  ])("rejects %s", (origin) => {
    expect(isAllowedOrigin(origin)).toBe(false);
  });
});

describe("resolveSiteUrl", () => {
  it("prefers SITE_URL and strips trailing slashes", () => {
    expect(resolveSiteUrl("https://calcioclassics.de/", "http://localhost:8080")).toBe("https://calcioclassics.de");
  });
  it("falls back to an allowlisted Origin", () => {
    expect(resolveSiteUrl(undefined, "http://localhost:8080")).toBe("http://localhost:8080");
  });
  it("returns null for a foreign Origin without SITE_URL", () => {
    expect(resolveSiteUrl("", "https://evil.example")).toBeNull();
    expect(resolveSiteUrl(undefined, null)).toBeNull();
  });
});

describe("toPublicCheckoutStatus", () => {
  const now = Date.UTC(2026, 8, 26, 12, 0, 0);
  it("maps DB states", () => {
    expect(toPublicCheckoutStatus("completed", null, now)).toBe("paid");
    expect(toPublicCheckoutStatus("expired", null, now)).toBe("expired");
    expect(toPublicCheckoutStatus("failed", null, now)).toBe("failed");
    expect(toPublicCheckoutStatus("refunded", null, now)).toBe("failed");
  });
  it("treats a pending row past its reservation as expired", () => {
    expect(toPublicCheckoutStatus("pending", new Date(now + 60_000).toISOString(), now)).toBe("pending");
    expect(toPublicCheckoutStatus("pending", new Date(now - 60_000).toISOString(), now)).toBe("expired");
  });
});
