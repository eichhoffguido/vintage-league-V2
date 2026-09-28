// CC-ORDER-MAILS — Bestell-Mails verschicken (Resend-API). Aufgerufen vom stripe-webhook (bezahlt) und von der
// Edge Function order-email (versendet, erhalten). Jede Mail genau einmal: Protokoll public.order_emails.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { addressLinesFrom, carrierInfo, type OrderEmailEvent, renderOrderEmail } from "./orderEmails.ts";

export type OrderStep = "paid" | "shipped" | "received";

const EVENTS: Record<OrderStep, { event: OrderEmailEvent; to: "buyer" | "seller" }[]> = {
  paid: [
    { event: "paid_buyer", to: "buyer" },
    { event: "paid_seller", to: "seller" },
  ],
  shipped: [{ event: "shipped_buyer", to: "buyer" }],
  received: [{ event: "received_seller", to: "seller" }],
};

const FROM = "Calcio Classics <noreply@calcioclassics.de>";
const REPLY_TO = "kontakt@calcioclassics.de";

interface TxForMail {
  id: string;
  status: string;
  buyer_id: string | null;
  seller_id: string | null;
  amount_cents: number;
  shipped_at: string | null;
  received_at: string | null;
  shipping_name: string | null;
  shipping_address: unknown;
  shipping_carrier: string | null;
  tracking_number: string | null;
  jersey_snapshot: Record<string, unknown> | null;
}

/** Passt der Bestellstatus zum Schritt? (Schutz gegen verfrühte oder erfundene Aufrufe) */
function stepReached(tx: TxForMail, step: OrderStep): boolean {
  if (tx.status !== "completed") return false;
  if (step === "shipped") return !!tx.shipped_at;
  if (step === "received") return !!tx.received_at;
  return true;
}

async function sendViaResend(to: string, subject: string, html: string, text: string, idempotencyKey: string): Promise<string> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY fehlt");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html, text }),
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) throw new Error(`Resend ${res.status}: ${body.message ?? "unbekannter Fehler"}`);
  return body.id ?? "";
}

/**
 * Verschickt die Mails eines Bestellschritts. Wirft nie: Fehler werden geloggt (eine fehlende Mail darf weder
 * den Webhook noch den Versand-Knopf scheitern lassen). Gibt die Anzahl verschickter Mails zurück.
 */
export async function notifyOrder(supabase: SupabaseClient, transactionId: string, step: OrderStep): Promise<number> {
  let sent = 0;
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, status, buyer_id, seller_id, amount_cents, shipped_at, received_at, shipping_name, shipping_address, shipping_carrier, tracking_number, jersey_snapshot")
      .eq("id", transactionId)
      .maybeSingle();
    if (error) throw error;
    const tx = data as TxForMail | null;
    if (!tx || !stepReached(tx, step)) {
      console.warn(`[order-mail] ${transactionId}: Schritt ${step} nicht erreicht — keine Mail.`);
      return 0;
    }

    const ids = [tx.buyer_id, tx.seller_id].filter((id): id is string => !!id);
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", ids);
    const nameOf = (id: string | null) => profiles?.find((p) => p.id === id)?.display_name?.trim() || "Ein Mitglied";

    const snap = tx.jersey_snapshot ?? {};
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const carrier = carrierInfo(tx.shipping_carrier, tx.tracking_number);
    const mailData = {
      siteUrl: Deno.env.get("SITE_URL") ?? "https://calcioclassics.de",
      jerseyTitle: [str(snap.team), str(snap.year)].filter(Boolean).join(" ") || "dein Trikot",
      jerseyName: str(snap.name),
      size: str(snap.size),
      amountCents: tx.amount_cents,
      buyerName: nameOf(tx.buyer_id),
      sellerName: nameOf(tx.seller_id),
      addressLines: addressLinesFrom(tx.shipping_name, tx.shipping_address),
      carrierLabel: carrier.label,
      trackingNumber: tx.tracking_number ?? "",
      trackingUrl: carrier.url,
    };

    for (const { event, to } of EVENTS[step]) {
      const recipientId = to === "buyer" ? tx.buyer_id : tx.seller_id;
      if (!recipientId) continue; // Konto gelöscht

      // Erst protokollieren — existiert die Zeile schon, ging diese Mail bereits raus.
      const { data: claimed, error: claimError } = await supabase
        .from("order_emails")
        .upsert({ transaction_id: tx.id, event, recipient_id: recipientId }, { onConflict: "transaction_id,event", ignoreDuplicates: true })
        .select("id");
      if (claimError) throw claimError;
      if (!claimed || claimed.length === 0) continue;

      try {
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(recipientId);
        if (userError || !user?.user?.email) throw new Error(userError?.message ?? "keine E-Mail-Adresse");
        const mail = renderOrderEmail(event, mailData);
        const resendId = await sendViaResend(user.user.email, mail.subject, mail.html, mail.text, `${tx.id}-${event}`);
        await supabase.from("order_emails").update({ resend_id: resendId }).eq("id", claimed[0].id);
        sent++;
      } catch (err) {
        // Freigeben, damit ein späterer Aufruf es erneut versuchen kann
        await supabase.from("order_emails").delete().eq("id", claimed[0].id);
        console.error(`[order-mail] ${tx.id} ${event} fehlgeschlagen:`, err instanceof Error ? err.message : err);
      }
    }
  } catch (err) {
    console.error(`[order-mail] ${transactionId} ${step}:`, err instanceof Error ? err.message : err);
  }
  return sent;
}
