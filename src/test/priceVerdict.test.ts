import { describe, expect, it } from "vitest";
import { getAgeTier, getPriceVerdict } from "@/utils/priceIntelligence";

describe("getPriceVerdict (CC-R3)", () => {
  const min = 50;
  const max = 250;
  const fair = 100;

  it("≤ 85 % des Marktwerts → Schnäppchen (verde)", () => {
    const v = getPriceVerdict(85, min, max, fair);
    expect(v.tone).toBe("schnaeppchen");
    expect(v.label).toBe("Schnäppchen");
    expect(v.bg).toBe("bg-verde");
  });

  it("bis 105 % → Fairer Preis (verde)", () => {
    expect(getPriceVerdict(105, min, max, fair).tone).toBe("fair");
  });

  it("bis 120 % → Über Marktwert (giallo) — nicht mehr gleiche Farbe wie fair", () => {
    const v = getPriceVerdict(120, min, max, fair);
    expect(v.tone).toBe("ueber");
    expect(v.bg).toBe("bg-giallo");
    expect(v.bg).not.toBe(getPriceVerdict(100, min, max, fair).bg);
  });

  it("darüber → Premium-Preis (rosso)", () => {
    const v = getPriceVerdict(121, min, max, fair);
    expect(v.tone).toBe("premium");
    expect(v.color).toBe("text-rosso");
  });

  it("leere Spanne → Fairer Preis", () => {
    expect(getPriceVerdict(100, 100, 100, 100).tone).toBe("fair");
  });

  it("nutzt nur Design-Tokens, keine Tailwind-Palette", () => {
    for (const price of [50, 100, 115, 200]) {
      const v = getPriceVerdict(price, min, max, fair);
      expect(`${v.color} ${v.bg}`).not.toMatch(/green|orange|red-|slate|amber/);
    }
  });
});

describe("getAgeTier", () => {
  const y = new Date().getFullYear();
  it.each([
    [String(y - 30), "Klassiker"],
    [String(y - 25), "Klassiker"],
    [String(y - 15), "Retro"],
    [String(y - 5), "Vintage"],
    [String(y - 2), null],
    ["", null],
    ["abc", null],
  ])("%s → %s", (year, tier) => {
    expect(getAgeTier(year)).toBe(tier);
  });
});
