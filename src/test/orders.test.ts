import { describe, expect, it } from "vitest";
import { addressLines, CARRIERS, isValidTrackingNumber, needsAction, orderStage, parseSnapshot, trackingLink, type OrderRow } from "@/lib/orders";

const base: OrderRow = {
  id: "t1",
  status: "completed",
  buyer_id: "buyer",
  seller_id: "seller",
  jersey_id: "j1",
  amount_cents: 12000,
  paid_at: "2026-09-28T10:00:00Z",
  created_at: "2026-09-28T09:55:00Z",
  shipped_at: null,
  shipping_carrier: null,
  tracking_number: null,
  received_at: null,
  shipping_name: "Anna Muster",
  shipping_address: { line1: "Hauptstr. 1", line2: "", postal_code: "20095", city: "Hamburg", country: "DE" },
  jersey_snapshot: { team: "HSV", name: "Heimtrikot", league: "Bundesliga", year: "1983", size: "L", condition: 4, image: "u/a.jpg" },
};

describe("orderStage", () => {
  it("leitet den Status ab", () => {
    expect(orderStage(base)).toBe("awaiting_shipment");
    expect(orderStage({ ...base, shipped_at: "x" })).toBe("shipped");
    expect(orderStage({ ...base, shipped_at: "x", received_at: "y" })).toBe("received");
    expect(orderStage({ ...base, status: "refunded", shipped_at: "x" })).toBe("refunded");
  });
});

describe("needsAction", () => {
  it("Verkäufer muss versenden, Käufer muss nach Versand bestätigen", () => {
    expect(needsAction(base, "seller")).toBe(true);
    expect(needsAction(base, "buyer")).toBe(false);
    const shipped = { ...base, shipped_at: "x" };
    expect(needsAction(shipped, "seller")).toBe(false);
    expect(needsAction(shipped, "buyer")).toBe(true);
    expect(needsAction({ ...shipped, received_at: "y" }, "buyer")).toBe(false);
    expect(needsAction({ ...base, status: "refunded" }, "seller")).toBe(false);
    expect(needsAction(base, "fremd")).toBe(false);
  });
});

describe("Versand", () => {
  it("prüft die Sendungsnummer wie die Datenbank", () => {
    expect(isValidTrackingNumber("  1234 ")).toBe(false);
    expect(isValidTrackingNumber("00340434161234567890")).toBe(true);
    expect(isValidTrackingNumber("x".repeat(65))).toBe(false);
  });

  it("baut Tracking-Links nur für bekannte Dienste", () => {
    expect(trackingLink("dhl", "0034 0434")).toContain("piececode=0034%200434");
    expect(trackingLink("other", "12345")).toBeNull();
    expect(trackingLink("dhl", "")).toBeNull();
    expect(trackingLink(null, "12345")).toBeNull();
  });

  it("hat dieselben Dienste wie der CHECK der Migration", () => {
    expect(CARRIERS.map((c) => c.id)).toEqual(["dhl", "deutsche_post", "hermes", "dpd", "gls", "ups", "other"]);
  });
});

describe("Anzeige", () => {
  it("formatiert die Lieferadresse ohne leere Zeilen und ohne Land DE", () => {
    expect(addressLines(base.shipping_name, base.shipping_address)).toEqual(["Anna Muster", "Hauptstr. 1", "20095 Hamburg"]);
    expect(addressLines(null, null)).toEqual([]);
  });

  it("liest den Trikot-Schnappschuss robust", () => {
    expect(parseSnapshot(base.jersey_snapshot)?.team).toBe("HSV");
    expect(parseSnapshot({ team: "X" })?.image).toBeNull();
    expect(parseSnapshot(null)).toBeNull();
  });
});
