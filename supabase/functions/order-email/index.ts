// CC-ORDER-MAILS — order-email
//
// POST { transaction_id, event: "shipped" | "received" } (angemeldet) → verschickt die Mail des Schritts.
// Aufgerufen von „Käufe & Verkäufe“ direkt nach mark_order_shipped / confirm_order_received.
// Sicherheit: „shipped“ nur durch den Verkäufer, „received“ durch Käufer oder Admin; notifyOrder prüft zusätzlich,
// dass der Schritt in der Datenbank wirklich erreicht ist, und verschickt jede Mail nur einmal.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient, getAuthenticatedUser } from "../_shared/clients.ts";
import { errorResponse, jsonResponse, preflightResponse } from "../_shared/http.ts";
import { notifyOrder } from "../_shared/orderNotify.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return preflightResponse(req);
  if (req.method !== "POST") return errorResponse(req, "Methode nicht erlaubt.", 405);

  const supabase = createServiceClient();
  const user = await getAuthenticatedUser(req, supabase);
  if (!user) return errorResponse(req, "Bitte melde dich an.", 401);

  let transactionId = "";
  let event = "";
  try {
    const body = (await req.json()) as { transaction_id?: unknown; event?: unknown };
    transactionId = typeof body.transaction_id === "string" ? body.transaction_id : "";
    event = typeof body.event === "string" ? body.event : "";
  } catch {
    return errorResponse(req, "Ungültige Anfrage.", 400);
  }
  if (!/^[0-9a-f-]{36}$/i.test(transactionId) || (event !== "shipped" && event !== "received")) {
    return errorResponse(req, "Ungültige Anfrage.", 400);
  }

  const { data: tx, error } = await supabase
    .from("transactions")
    .select("buyer_id, seller_id")
    .eq("id", transactionId)
    .maybeSingle();
  if (error) {
    console.error("[order-email] lookup failed:", error);
    return errorResponse(req, "Mail konnte nicht verschickt werden.", 500);
  }

  let allowed = false;
  if (tx && event === "shipped") allowed = tx.seller_id === user.id;
  if (tx && event === "received") {
    if (tx.buyer_id === user.id) allowed = true;
    else {
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      allowed = profile?.is_admin === true;
    }
  }
  if (!allowed) return errorResponse(req, "Diese Bestellung gibt es nicht.", 404);

  const sent = await notifyOrder(supabase, transactionId, event);
  return jsonResponse(req, { sent }, 200);
});
