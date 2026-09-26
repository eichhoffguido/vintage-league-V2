// CC-S2 — create-checkout-session (hardened)
//
// - Caller must be logged in (bearer token validated via supabase.auth.getUser).
//   The buyer is ALWAYS the authenticated user; body.buyer_id is accepted for
//   backwards compatibility with existing callers but never trusted.
// - Reserves the jersey: after creating the Stripe Checkout Session (expires in
//   ~30 min) a 'pending' transactions row is inserted. The partial unique index
//   transactions_one_active_sale_per_jersey (CC-S1) guarantees at most one
//   pending/completed sale per jersey; on conflict the session is expired and 409
//   is returned.
// - Still NO Stripe Connect / transfer (that is CC-S3).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient, createStripe, getAuthenticatedUser } from "../_shared/clients.ts";
import { errorResponse, jsonResponse, preflightResponse } from "../_shared/http.ts";
import {
  calculatePlatformFeeCents,
  type CheckoutFlow,
  checkoutExpiresAtUnix,
  ONE_ACTIVE_SALE_INDEX,
  PG_UNIQUE_VIOLATION,
  resolveSiteUrl,
} from "../_shared/payments.ts";

interface CheckoutRequestBody {
  jersey_id?: unknown;
  match_id?: unknown;
  buyer_id?: unknown;
}

interface CheckoutPlan {
  flow: CheckoutFlow;
  jerseyId: string;
  jerseyName: string;
  sellerId: string;
  amountCents: number;
  matchId?: string;
  bidId?: string;
  askId?: string;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const MSG_RESERVED = "Dieses Trikot ist gerade reserviert oder bereits verkauft.";

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return preflightResponse(req);
  if (req.method !== "POST") return errorResponse(req, "Methode nicht erlaubt.", 405);

  const supabase = createServiceClient();

  // ── 1. Authentication ──────────────────────────────────────────────────────
  const user = await getAuthenticatedUser(req, supabase);
  if (!user) {
    return errorResponse(req, "Bitte melde dich an, um ein Trikot zu kaufen.", 401);
  }

  // ── 2. Body ────────────────────────────────────────────────────────────────
  let body: CheckoutRequestBody;
  try {
    body = (await req.json()) as CheckoutRequestBody;
  } catch {
    return errorResponse(req, "Ungültige Anfrage.", 400);
  }
  const jerseyIdInput = asOptionalString(body.jersey_id);
  const matchIdInput = asOptionalString(body.match_id);
  const bodyBuyerId = asOptionalString(body.buyer_id);

  if (bodyBuyerId && bodyBuyerId !== user.id) {
    return errorResponse(req, "Du kannst nur für dich selbst kaufen.", 403);
  }
  if (!jerseyIdInput && !matchIdInput) {
    return errorResponse(req, "Es fehlt das Trikot (jersey_id) oder das Match (match_id).", 400);
  }

  // ── 3. Redirect base URL ───────────────────────────────────────────────────
  const siteUrl = resolveSiteUrl(Deno.env.get("SITE_URL"), req.headers.get("Origin"));
  if (!siteUrl) {
    console.error(
      "[create-checkout-session] SITE_URL secret is not set and the request Origin is not on the allowlist — cannot build success/cancel URLs.",
    );
    return errorResponse(req, "Der Bezahlvorgang ist gerade nicht verfügbar (Server-Konfiguration).", 500);
  }

  // ── 4. Validate the purchase ───────────────────────────────────────────────
  let plan: CheckoutPlan;
  try {
    plan = matchIdInput
      ? await planBidAskCheckout(supabase, matchIdInput, user.id)
      : await planDirectBuy(supabase, jerseyIdInput!, user.id);
  } catch (err) {
    if (err instanceof HttpError) return errorResponse(req, err.message, err.status);
    console.error("[create-checkout-session] validation failed:", err);
    return errorResponse(req, "Der Bezahlvorgang konnte nicht gestartet werden.", 500);
  }

  // ── 5. Sweep stale reservations of this jersey, then pre-check ─────────────
  const nowIso = new Date().toISOString();
  const { error: sweepError } = await supabase
    .from("transactions")
    .update({ status: "expired" })
    .eq("jersey_id", plan.jerseyId)
    .eq("status", "pending")
    .lt("checkout_expires_at", nowIso);
  if (sweepError) {
    console.error("[create-checkout-session] expiry sweep failed:", sweepError);
    // Non-fatal: the unique index below is still the authoritative guard.
  }

  const { data: activeTx, error: activeTxError } = await supabase
    .from("transactions")
    .select("id")
    .eq("jersey_id", plan.jerseyId)
    .in("status", ["pending", "completed"])
    .limit(1);
  if (activeTxError) {
    console.error("[create-checkout-session] active transaction lookup failed:", activeTxError);
    return errorResponse(req, "Der Bezahlvorgang konnte nicht gestartet werden.", 500);
  }
  if (activeTx && activeTx.length > 0) {
    return errorResponse(req, MSG_RESERVED, 409);
  }

  // ── 6. Create the Stripe Checkout Session ──────────────────────────────────
  const platformFeeCents = calculatePlatformFeeCents(plan.amountCents);
  const metadata: Record<string, string> = {
    flow: plan.flow,
    jersey_id: plan.jerseyId,
    buyer_id: user.id,
    seller_id: plan.sellerId,
    platform_fee_cents: String(platformFeeCents),
  };
  if (plan.matchId) metadata.match_id = plan.matchId;
  if (plan.bidId) metadata.bid_id = plan.bidId;
  if (plan.askId) metadata.ask_id = plan.askId;

  const stripe = createStripe();
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Calcio Classics – ${plan.jerseyName}` },
            unit_amount: plan.amountCents,
          },
          quantity: 1,
        },
      ],
      client_reference_id: user.id,
      metadata,
      payment_intent_data: { metadata },
      expires_at: checkoutExpiresAtUnix(),
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/jersey/${plan.jerseyId}`,
    });
  } catch (err) {
    console.error("[create-checkout-session] Stripe session creation failed:", err);
    return errorResponse(req, "Der Bezahlvorgang konnte nicht gestartet werden.", 502);
  }

  // ── 7. Reserve: insert the pending transaction ─────────────────────────────
  const { error: insertError } = await supabase.from("transactions").insert({
    jersey_id: plan.jerseyId,
    buyer_id: user.id,
    seller_id: plan.sellerId,
    amount_cents: plan.amountCents,
    platform_fee_cents: platformFeeCents,
    stripe_session_id: session.id,
    status: "pending",
    checkout_expires_at: new Date(session.expires_at * 1000).toISOString(),
    livemode: session.livemode,
  });

  if (insertError) {
    // Whatever went wrong, the session must not stay payable without a reservation.
    try {
      await stripe.checkout.sessions.expire(session.id);
    } catch (expireErr) {
      console.error(`[create-checkout-session] could not expire session ${session.id}:`, expireErr);
    }
    // stripe_session_id is brand-new, so a unique violation here can only come from
    // transactions_one_active_sale_per_jersey (someone else reserved/bought it meanwhile).
    if (insertError.code === PG_UNIQUE_VIOLATION) {
      console.warn(
        `[create-checkout-session] ${ONE_ACTIVE_SALE_INDEX} conflict for jersey ${plan.jerseyId}; session ${session.id} expired.`,
      );
      return errorResponse(req, MSG_RESERVED, 409);
    }
    console.error("[create-checkout-session] reservation insert failed:", insertError);
    return errorResponse(req, "Der Bezahlvorgang konnte nicht gestartet werden.", 500);
  }

  return jsonResponse(req, { url: session.url }, 200);
});

// ── Validation: direct buy ───────────────────────────────────────────────────
async function planDirectBuy(
  supabase: ReturnType<typeof createServiceClient>,
  jerseyId: string,
  buyerId: string,
): Promise<CheckoutPlan> {
  const { data: jersey, error } = await supabase
    .from("user_jerseys")
    .select("id, name, sale_price_cents, user_id, listing_type")
    .eq("id", jerseyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!jersey) throw new HttpError(404, "Dieses Trikot wurde nicht gefunden.");

  const price = jersey.sale_price_cents as number | null;
  const listingType = jersey.listing_type as string | null;
  if (
    !listingType || !["buy_now", "both"].includes(listingType) ||
    price === null || !Number.isInteger(price) || price <= 0
  ) {
    throw new HttpError(409, "Dieses Trikot steht nicht (mehr) zum Sofortkauf.");
  }
  if (jersey.user_id === buyerId) {
    throw new HttpError(403, "Du kannst dein eigenes Trikot nicht kaufen.");
  }

  return {
    flow: "direct_buy",
    jerseyId: jersey.id as string,
    jerseyName: (jersey.name as string | null) ?? "Trikot",
    sellerId: jersey.user_id as string,
    amountCents: price,
  };
}

// ── Validation: bid/ask match ────────────────────────────────────────────────
async function planBidAskCheckout(
  supabase: ReturnType<typeof createServiceClient>,
  matchId: string,
  buyerId: string,
): Promise<CheckoutPlan> {
  const { data: match, error: matchError } = await supabase
    .from("bid_ask_matches")
    .select("id, bid_id, ask_id, jersey_id, matched_price_cents, status")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) throw matchError;
  if (!match) throw new HttpError(404, "Dieses Match wurde nicht gefunden.");
  if (match.status !== "pending") {
    throw new HttpError(409, "Dieses Match ist nicht mehr offen.");
  }

  // bid_ask_matches has no buyer_id column — the buyer is the bid's owner.
  const [{ data: bid, error: bidError }, { data: ask, error: askError }] = await Promise.all([
    supabase.from("bids").select("id, user_id").eq("id", match.bid_id).maybeSingle(),
    supabase.from("asks").select("id, user_id").eq("id", match.ask_id).maybeSingle(),
  ]);
  if (bidError) throw bidError;
  if (askError) throw askError;
  if (!bid || !ask) throw new Error(`match ${matchId}: bid or ask missing`);

  if (bid.user_id !== buyerId) {
    throw new HttpError(403, "Dieses Match gehört nicht zu deinem Gebot.");
  }
  if (ask.user_id === buyerId) {
    throw new HttpError(403, "Du kannst dein eigenes Trikot nicht kaufen.");
  }

  const amount = match.matched_price_cents as number;
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`match ${matchId}: invalid matched_price_cents ${amount}`);
  }

  const { data: jersey } = await supabase
    .from("user_jerseys")
    .select("name")
    .eq("id", match.jersey_id)
    .maybeSingle();

  return {
    flow: "bid_ask_match",
    jerseyId: match.jersey_id as string,
    jerseyName: (jersey?.name as string | undefined) ?? "Trikot",
    sellerId: ask.user_id as string,
    amountCents: amount,
    matchId: match.id as string,
    bidId: match.bid_id as string,
    askId: match.ask_id as string,
  };
}
