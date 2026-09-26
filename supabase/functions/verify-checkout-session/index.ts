// CC-S2 — verify-checkout-session
//
// POST { session_id } (logged-in buyer) → { status, jersey_id, amount_cents }
//   status: 'paid' | 'pending' | 'failed' | 'expired'
// Returns 404 unless the transaction belongs to the caller. Read-only: never
// changes the database (the webhook is the only writer of payment state).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient, createStripe, getAuthenticatedUser } from "../_shared/clients.ts";
import { errorResponse, jsonResponse, preflightResponse } from "../_shared/http.ts";
import { type PublicCheckoutStatus, toPublicCheckoutStatus } from "../_shared/payments.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return preflightResponse(req);
  if (req.method !== "POST") return errorResponse(req, "Methode nicht erlaubt.", 405);

  const supabase = createServiceClient();
  const user = await getAuthenticatedUser(req, supabase);
  if (!user) return errorResponse(req, "Bitte melde dich an.", 401);

  let sessionId: string | undefined;
  try {
    const body = (await req.json()) as { session_id?: unknown };
    sessionId = typeof body.session_id === "string" ? body.session_id.trim() : undefined;
  } catch {
    return errorResponse(req, "Ungültige Anfrage.", 400);
  }
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return errorResponse(req, "Ungültige Session-ID.", 400);
  }

  const { data: tx, error } = await supabase
    .from("transactions")
    .select("status, jersey_id, amount_cents, buyer_id, checkout_expires_at")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (error) {
    console.error("[verify-checkout-session] lookup failed:", error);
    return errorResponse(req, "Status konnte nicht geladen werden.", 500);
  }
  if (!tx || tx.buyer_id !== user.id) {
    return errorResponse(req, "Kauf nicht gefunden.", 404);
  }

  let status: PublicCheckoutStatus = toPublicCheckoutStatus(
    tx.status as string,
    (tx.checkout_expires_at as string | null) ?? null,
  );

  // The webhook may arrive a few seconds after the redirect: ask Stripe directly
  // so a paid card payment is shown as paid right away.
  if (status === "pending") {
    try {
      const session = await createStripe().checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") status = "paid";
      else if (session.status === "expired") status = "expired";
    } catch (err) {
      console.warn("[verify-checkout-session] Stripe lookup failed, reporting DB status:", err);
    }
  }

  return jsonResponse(req, {
    status,
    jersey_id: tx.jersey_id as string,
    amount_cents: tx.amount_cents as number,
  });
});
