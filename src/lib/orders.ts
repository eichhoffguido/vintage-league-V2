// CC-ORDERS — „Käufe & Verkäufe“: Status, Versanddienste, offene Aufgaben. Reine Funktionen (getestet).
import type { Json } from "@/integrations/supabase/types";

export type CarrierId = "dhl" | "deutsche_post" | "hermes" | "dpd" | "gls" | "ups" | "other";

export interface Carrier {
  id: CarrierId;
  label: string;
  /** Link zur Sendungsverfolgung; null = kein öffentlicher Link */
  trackingUrl: ((trackingNumber: string) => string) | null;
}

const enc = encodeURIComponent;

/** Gleiche Liste wie der CHECK in der Migration 20260930100000_cc_orders_shipping.sql */
export const CARRIERS: Carrier[] = [
  { id: "dhl", label: "DHL", trackingUrl: (n) => `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${enc(n)}` },
  { id: "deutsche_post", label: "Deutsche Post (Warenpost / Einschreiben)", trackingUrl: (n) => `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${enc(n)}` },
  { id: "hermes", label: "Hermes", trackingUrl: (n) => `https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation/#${enc(n)}` },
  { id: "dpd", label: "DPD", trackingUrl: (n) => `https://tracking.dpd.de/status/de_DE/parcel/${enc(n)}` },
  { id: "gls", label: "GLS", trackingUrl: (n) => `https://gls-group.com/DE/de/paketverfolgung?match=${enc(n)}` },
  { id: "ups", label: "UPS", trackingUrl: (n) => `https://www.ups.com/track?loc=de_DE&tracknum=${enc(n)}` },
  { id: "other", label: "Anderer Versanddienst", trackingUrl: null },
];

export const carrierById = (id: string | null | undefined): Carrier | undefined => CARRIERS.find((c) => c.id === id);

export function trackingLink(carrier: string | null | undefined, trackingNumber: string | null | undefined): string | null {
  const c = carrierById(carrier);
  const n = trackingNumber?.trim();
  return c?.trackingUrl && n ? c.trackingUrl(n) : null;
}

/** Sendungsnummer wie in der Datenbank geprüft: 5–64 Zeichen nach dem Trimmen. */
export const isValidTrackingNumber = (value: string) => {
  const n = value.trim();
  return n.length >= 5 && n.length <= 64;
};

export interface OrderRow {
  id: string;
  status: string;
  buyer_id: string | null;
  seller_id: string | null;
  jersey_id: string | null;
  amount_cents: number;
  paid_at: string | null;
  created_at: string;
  shipped_at: string | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  received_at: string | null;
  shipping_name: string | null;
  shipping_address: Json | null;
  jersey_snapshot: Json | null;
}

export type OrderStage = "awaiting_shipment" | "shipped" | "received" | "refunded";

export function orderStage(order: Pick<OrderRow, "status" | "shipped_at" | "received_at">): OrderStage {
  if (order.status === "refunded") return "refunded";
  if (order.received_at) return "received";
  if (order.shipped_at) return "shipped";
  return "awaiting_shipment";
}

/** Muss dieser Nutzer bei der Bestellung etwas tun? Verkäufer: versenden. Käufer: Erhalt bestätigen. */
export function needsAction(order: OrderRow, userId: string): boolean {
  if (order.status !== "completed") return false;
  const stage = orderStage(order);
  if (order.seller_id === userId) return stage === "awaiting_shipment";
  if (order.buyer_id === userId) return stage === "shipped";
  return false;
}

export interface JerseySnapshot {
  team: string;
  name: string;
  league: string;
  year: string;
  size: string;
  condition: number | null;
  image: string | null;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : "");

export function parseSnapshot(value: Json | null): JerseySnapshot | null {
  if (!isRecord(value)) return null;
  return {
    team: str(value.team),
    name: str(value.name),
    league: str(value.league),
    year: str(value.year),
    size: str(value.size),
    condition: typeof value.condition === "number" ? value.condition : null,
    image: typeof value.image === "string" && value.image ? value.image : null,
  };
}

/** Lieferadresse als Zeilen: Name, Straße, (Zusatz), PLZ Ort, Land (nur wenn nicht DE). */
export function addressLines(name: string | null, address: Json | null): string[] {
  if (!isRecord(address)) return name ? [name] : [];
  const cityLine = [str(address.postal_code), str(address.city)].filter(Boolean).join(" ");
  const country = str(address.country);
  return [name ?? "", str(address.line1), str(address.line2), cityLine, country && country !== "DE" ? country : ""].filter(Boolean);
}

/** Stößt die Bestell-Mail eines Schritts an (Edge Function order-email). Wartet nicht und wirft nie. */
export function sendOrderEmail(invoke: (name: string, options: { body: Record<string, string> }) => Promise<{ error: unknown }>, transactionId: string, event: "shipped" | "received"): void {
  invoke("order-email", { body: { transaction_id: transactionId, event } })
    .then(({ error }) => {
      if (error) console.warn("[order-email] Mail nicht verschickt:", error);
    })
    .catch((err) => console.warn("[order-email] Mail nicht verschickt:", err));
}
