import { describe, expect, it } from "vitest";
import { addressLinesFrom, carrierInfo, formatEuro, renderOrderEmail, type OrderEmailData } from "../../supabase/functions/_shared/orderEmails.ts";
import { CARRIERS, trackingLink } from "@/lib/orders";

const data: OrderEmailData = {
  siteUrl: "https://calcioclassics.de/",
  jerseyTitle: "Hamburger SV 1983/84",
  jerseyName: "Heimtrikot",
  size: "L",
  amountCents: 20000,
  buyerName: "Anna",
  sellerName: "Guido",
  addressLines: ["Anna Muster", "Hauptstr. 1", "20095 Hamburg"],
  carrierLabel: "DHL",
  trackingNumber: "00340434161234567890",
  trackingUrl: "https://www.dhl.de/x",
};

describe("renderOrderEmail", () => {
  it("Kaufbestätigung an den Käufer mit Preis, Adresse und Link", () => {
    const m = renderOrderEmail("paid_buyer", data);
    expect(m.subject).toBe("Dein Kauf: Hamburger SV 1983/84");
    expect(m.html).toContain("200,00 €");
    expect(m.html).toContain("20095 Hamburg");
    expect(m.html).toContain("https://calcioclassics.de/orders?tab=bought");
    expect(m.text).toContain("Zu deinen Käufen: https://calcioclassics.de/orders?tab=bought");
  });

  it("Verkäufer bekommt die Adresse — oder einen Hinweis, wenn sie fehlt", () => {
    expect(renderOrderEmail("paid_seller", data).html).toContain("Hauptstr. 1");
    const noAddress = renderOrderEmail("paid_seller", { ...data, addressLines: [] });
    expect(noAddress.html).toContain("keine Lieferadresse vor");
    expect(noAddress.html).not.toContain("Lieferadresse</p>");
  });

  it("Versandmail verlinkt die Sendungsverfolgung, ohne Link die Käufe", () => {
    expect(renderOrderEmail("shipped_buyer", data).html).toContain("https://www.dhl.de/x");
    expect(renderOrderEmail("shipped_buyer", { ...data, trackingUrl: null }).html).toContain("/orders?tab=bought");
  });

  it("Erhalt-Mail an den Verkäufer", () => {
    const m = renderOrderEmail("received_seller", data);
    expect(m.subject).toBe("Angekommen: Hamburger SV 1983/84");
    expect(m.html).toContain("Anna hat den Erhalt");
  });

  it("maskiert Nutzertexte", () => {
    const m = renderOrderEmail("received_seller", { ...data, buyerName: '<img src=x onerror="alert(1)">' });
    expect(m.html).not.toContain("<img src=x");
    expect(m.html).toContain("&lt;img src=x");
  });
});

describe("Hilfsfunktionen", () => {
  it("Tracking-Links sind identisch mit der Seite", () => {
    for (const c of CARRIERS) {
      expect(carrierInfo(c.id, "123 456").url).toBe(trackingLink(c.id, "123 456"));
    }
  });

  it("Adresse und Preis", () => {
    expect(addressLinesFrom("Anna", { line1: "A 1", line2: "", postal_code: "1", city: "B", country: "AT" })).toEqual(["Anna", "A 1", "1 B", "AT"]);
    expect(addressLinesFrom(null, null)).toEqual([]);
    expect(formatEuro(12345)).toBe("123,45 €");
  });
});
