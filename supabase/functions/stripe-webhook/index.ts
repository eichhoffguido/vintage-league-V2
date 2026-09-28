// CC-S2 — stripe-webhook (hardened)
//
// - Signature verified on the raw body (async SubtleCrypto variant — the sync
//   constructEvent does not work in the Deno runtime).
// - Idempotency: every event is logged in public.stripe_events (CC-S1). An event
//   whose processed_at is already set is acknowledged immediately. All state
//   transitions are additionally conditional (e.g. only pending → completed), so
//   concurrent duplicate deliveries cannot complete a sale twice.
// - Returns 500 only for genuine processing failures (Stripe retries); everything
//   that can never succeed on retry (unknown event, missing data) is logged + 200.
//
// Deploy with --no-verify-jwt (Stripe does not send a Supabase JWT); see
// supabase/config.toml [functions.stripe-webhook] and docs/payments-deploy-howto.md.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createServiceClient, createStripe, Stripe } from "../_shared/clients.ts";
import { PG_UNIQUE_VIOLATION } from "../_shared/payments.ts";
import { notifyOrder } from "../_shared/orderNotify.ts";

type StripeClient = ReturnType<typeof createStripe>;

interface TransactionRow {
  id: string;
  jersey_id: string;
  buyer_id: string;
  seller_id: string;
  amount_cents: number;
  status: string;
  stripe_session_id: string;
  stripe_payment_intent_id: string | null;
}

const TX_COLUMNS =
  "id, jersey_id, buyer_id, seller_id, amount_cents, status, stripe_session_id, stripe_payment_intent_id";

const cryptoProvider = Stripe.createSubtleCryptoProvider();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const signature = req.headers.get("stripe-signature");
  if (!signature) return json({ error: "Missing stripe-signature header" }, 400);

  const stripe = createStripe();
  const rawBody = await req.text(); // raw body — never req.json() before verification

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", errorMessage(err));
    return json({ error: "Webhook signature verification failed" }, 400);
  }

  const supabase = createServiceClient();

  // ── Idempotency log ────────────────────────────────────────────────────────
  const { error: logError } = await supabase
    .from("stripe_events")
    .upsert(
      { id: event.id, type: event.type, livemode: event.livemode },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (logError) {
    console.error("[stripe-webhook] could not log event:", event.id, logError);
    return json({ error: "Event log unavailable" }, 500);
  }

  const { data: logged, error: readLogError } = await supabase
    .from("stripe_events")
    .select("processed_at")
    .eq("id", event.id)
    .maybeSingle();
  if (readLogError) {
    console.error("[stripe-webhook] could not read event log:", event.id, readLogError);
    return json({ error: "Event log unavailable" }, 500);
  }
  if (logged?.processed_at) {
    return json({ received: true, duplicate: true });
  }

  // ── Process ────────────────────────────────────────────────────────────────
  try {
    await handleEvent(event, stripe, supabase);
  } catch (err) {
    const message = errorMessage(err);
    console.error(`[stripe-webhook] processing ${event.type} ${event.id} failed:`, message);
    await supabase.from("stripe_events").update({ error: message.slice(0, 2000) }).eq("id", event.id);
    return json({ error: "Processing failed" }, 500);
  }

  const { error: doneError } = await supabase
    .from("stripe_events")
    .update({ processed_at: new Date().toISOString(), error: null })
    .eq("id", event.id);
  if (doneError) {
    // Processing succeeded and is idempotent; a retry would be harmless.
    console.error("[stripe-webhook] could not mark event processed:", event.id, doneError);
  }

  return json({ received: true });
});

async function handleEvent(event: Stripe.Event, stripe: StripeClient, supabase: SupabaseClient): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
        await completePaidSession(session, stripe, supabase);
      } else {
        // Async payment method (e.g. SEPA): money not there yet. Keep the reservation
        // (status stays pending) and remember the PaymentIntent; completion follows via
        // checkout.session.async_payment_succeeded / _failed.
        await attachPaymentIntent(supabase, session.id, paymentIntentId(session));
        console.log(`[stripe-webhook] session ${session.id} completed with payment_status=${session.payment_status}; waiting for async result.`);
      }
      return;
    }
    case "checkout.session.async_payment_succeeded":
      await completePaidSession(event.data.object as Stripe.Checkout.Session, stripe, supabase);
      return;
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await transitionBySession(supabase, session.id, ["pending"], "failed");
      return;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await transitionBySession(supabase, session.id, ["pending"], "expired");
      return;
    }
    case "payment_intent.succeeded":
      // Completion (incl. bid/ask matches) is handled exclusively via
      // checkout.session.completed / async_payment_succeeded, so it happens exactly once.
      await storePaymentIntentFromIntent(event.data.object as Stripe.PaymentIntent, stripe, supabase);
      return;
    case "payment_intent.payment_failed": {
      // Only mark failed when the PaymentIntent is already linked to our transaction
      // (async methods after checkout completion). A declined card INSIDE an open
      // Checkout Session is not linked yet — the buyer can still retry with another
      // card, so the reservation must stay.
      const pi = event.data.object as Stripe.PaymentIntent;
      const { error } = await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", pi.id)
        .eq("status", "pending");
      if (error) throw error;
      return;
    }
    case "charge.refunded":
      await handleRefund(event.data.object as Stripe.Charge, supabase);
      return;
    default:
      // Unknown / unsubscribed event types are acknowledged.
      return;
  }
}

type ShippingFields = { shipping_name?: string; shipping_address?: Record<string, string> };

interface ShippingDetailsLike {
  name?: string | null;
  address?: Stripe.Address | null;
}

/**
 * CC-ORDERS: Lieferadresse aus Stripe Checkout (shipping_address_collection) für den Verkäufer.
 * Neuere Stripe-API-Versionen (Webhook-Events kommen in der Version des Endpoints!) liefern sie unter
 * collected_information.shipping_details statt shipping_details — beide Stellen lesen.
 */
function shippingFields(session: Stripe.Checkout.Session): ShippingFields {
  const collected = (session as Stripe.Checkout.Session & {
    collected_information?: { shipping_details?: ShippingDetailsLike | null } | null;
  }).collected_information?.shipping_details;
  const details: ShippingDetailsLike | null | undefined = collected ?? session.shipping_details;
  if (!details?.address) return {};
  const a = details.address;
  return {
    shipping_name: details.name ?? session.customer_details?.name ?? undefined,
    shipping_address: {
      line1: a.line1 ?? "",
      line2: a.line2 ?? "",
      postal_code: a.postal_code ?? "",
      city: a.city ?? "",
      country: a.country ?? "",
    },
  };
}

/** Adresse aus dem Event; fehlt sie dort, die Sitzung mit unserer festen API-Version direkt abfragen. */
async function resolveShipping(session: Stripe.Checkout.Session, stripe: StripeClient): Promise<ShippingFields> {
  const fromEvent = shippingFields(session);
  if (fromEvent.shipping_address) return fromEvent;
  try {
    return shippingFields(await stripe.checkout.sessions.retrieve(session.id));
  } catch (err) {
    console.error(`[stripe-webhook] could not load shipping details for ${session.id}:`, errorMessage(err));
    return {};
  }
}

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  if (!pi) return null;
  return typeof pi === "string" ? pi : pi.id;
}

async function findTransactionBySession(supabase: SupabaseClient, sessionId: string): Promise<TransactionRow | null> {
  const { data, error } = await supabase
    .from("transactions")
    .select(TX_COLUMNS)
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return (data as TransactionRow | null) ?? null;
}

async function attachPaymentIntent(supabase: SupabaseClient, sessionId: string, piId: string | null): Promise<void> {
  if (!piId) return;
  const { error } = await supabase
    .from("transactions")
    .update({ stripe_payment_intent_id: piId })
    .eq("stripe_session_id", sessionId)
    .is("stripe_payment_intent_id", null);
  if (error) throw error;
}

async function transitionBySession(
  supabase: SupabaseClient,
  sessionId: string,
  from: string[],
  to: "failed" | "expired",
): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .update({ status: to })
    .eq("stripe_session_id", sessionId)
    .in("status", from);
  if (error) throw error;
}

// ── Paid checkout → completed sale ───────────────────────────────────────────
async function completePaidSession(
  session: Stripe.Checkout.Session,
  stripe: StripeClient,
  supabase: SupabaseClient,
): Promise<void> {
  const piId = paymentIntentId(session);
  let meta: Record<string, string> = { ...(session.metadata ?? {}) };

  // Legacy bid/ask sessions (created before CC-S2) only carried metadata on the PaymentIntent.
  if (!meta.jersey_id && piId) {
    const pi = await stripe.paymentIntents.retrieve(piId);
    meta = { ...(pi.metadata ?? {}) };
  }

  let tx = await findTransactionBySession(supabase, session.id);
  const shipping = await resolveShipping(session, stripe);

  if (!tx) {
    // Legacy session created before CC-S2 (no pending reservation row) → insert idempotently.
    const { jersey_id, buyer_id, seller_id } = meta;
    if (!jersey_id || !buyer_id || !seller_id) {
      console.error(`[stripe-webhook] paid session ${session.id} without transaction and without metadata — manual check needed.`);
      return; // retrying can never fix this
    }
    const amountCents = session.amount_total ?? 0;
    const { data: inserted, error } = await supabase
      .from("transactions")
      .upsert(
        {
          jersey_id,
          buyer_id,
          seller_id,
          amount_cents: amountCents,
          platform_fee_cents: meta.platform_fee_cents ? parseInt(meta.platform_fee_cents, 10) : 0,
          stripe_session_id: session.id,
          stripe_payment_intent_id: piId,
          status: "completed",
          paid_at: new Date().toISOString(),
          ...shipping,
          livemode: session.livemode,
        },
        { onConflict: "stripe_session_id", ignoreDuplicates: true },
      )
      .select(TX_COLUMNS);

    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        await refundDoubleSale(session, piId, stripe, supabase, jersey_id, null);
        return;
      }
      throw error;
    }
    if (!inserted || inserted.length === 0) {
      // Inserted concurrently by a duplicate delivery → make sure follow-ups ran.
      tx = await findTransactionBySession(supabase, session.id);
      if (tx) await applySoldSideEffects(tx, meta, supabase, piId, false);
      return;
    }
    await applySoldSideEffects(inserted[0] as TransactionRow, meta, supabase, piId, true);
    return;
  }

  if (tx.status === "refunded") {
    console.warn(`[stripe-webhook] session ${session.id} paid but transaction ${tx.id} is already refunded — ignoring.`);
    return;
  }

  if (tx.status === "completed") {
    // Already completed (earlier delivery). Re-apply the idempotent follow-ups in case
    // a previous attempt failed half-way; notifications are not re-sent.
    if (shipping.shipping_address) {
      await supabase.from("transactions").update(shipping).eq("id", tx.id).is("shipping_address", null);
    }
    await applySoldSideEffects(tx, meta, supabase, piId, false);
    return;
  }

  // pending (normal), or expired/failed (paid right at the reservation deadline)
  const { data: updated, error: updateError } = await supabase
    .from("transactions")
    // paid_at nur beim Übergang auf completed — Wiederholungen des Webhooks ändern ihn nicht mehr.
    .update({
      status: "completed",
      paid_at: new Date().toISOString(),
      ...shipping,
      stripe_payment_intent_id: piId ?? tx.stripe_payment_intent_id,
    })
    .eq("id", tx.id)
    .in("status", ["pending", "expired", "failed"])
    .select(TX_COLUMNS);

  if (updateError) {
    if (updateError.code === PG_UNIQUE_VIOLATION) {
      await refundDoubleSale(session, piId, stripe, supabase, tx.jersey_id, tx.id);
      return;
    }
    throw updateError;
  }
  if (!updated || updated.length === 0) {
    // A concurrent delivery transitioned it first — it also sends the notifications.
    return;
  }
  await applySoldSideEffects(updated[0] as TransactionRow, meta, supabase, piId, true);
}

/**
 * Doppelverkauf: Für dieses Trikot gibt es bereits einen anderen aktiven (bezahlten
 * oder reservierten) Verkauf. Die zweite Zahlung wird als 'failed' markiert und
 * automatisch voll erstattet. Das Trikot bleibt beim ersten Käufer.
 */
async function refundDoubleSale(
  session: Stripe.Checkout.Session,
  piId: string | null,
  stripe: StripeClient,
  supabase: SupabaseClient,
  jerseyId: string,
  txId: string | null,
): Promise<void> {
  console.error(
    `[stripe-webhook] DOPPELVERKAUF verhindert: Trikot ${jerseyId} hat bereits einen aktiven Verkauf. ` +
      `Session ${session.id} (PaymentIntent ${piId ?? "unbekannt"}) wird als failed markiert und voll erstattet.`,
  );
  if (txId) {
    const { error } = await supabase
      .from("transactions")
      .update({ status: "failed", stripe_payment_intent_id: piId })
      .eq("id", txId);
    if (error) throw error;
  }
  if (!piId) {
    console.error(`[stripe-webhook] Keine PaymentIntent-ID für Session ${session.id} — Erstattung bitte manuell im Stripe Dashboard auslösen.`);
    return;
  }
  // Idempotency key: a retried webhook never refunds twice.
  await stripe.refunds.create(
    { payment_intent: piId, reason: "duplicate", metadata: { reason: "cc_double_sale", jersey_id: jerseyId } },
    { idempotencyKey: `cc-double-sale-refund-${session.id}` },
  );
}

/**
 * Follow-ups of a completed sale. Jersey/match updates are idempotent and throw on
 * error (→ 500 → Stripe retries). Notifications are only sent on the first
 * completion and are non-fatal (same semantics as before CC-S2).
 */
async function applySoldSideEffects(
  tx: TransactionRow,
  meta: Record<string, string>,
  supabase: SupabaseClient,
  piId: string | null,
  sendNotifications: boolean,
): Promise<void> {
  const amountCents = tx.amount_cents;

  // CC-ORDERS: Schnappschuss des Trikots — Käufer dürfen verkaufte Trikots per RLS nicht mehr lesen,
  // „Käufe & Verkäufe“ zeigt deshalb diese Kopie. Nicht kritisch, nur einmal (jersey_snapshot IS NULL).
  const { data: jersey } = await supabase
    .from("user_jerseys")
    .select("team, name, league, year, size, condition, image_urls, image_url")
    .eq("id", tx.jersey_id)
    .maybeSingle();
  if (jersey) {
    const { error: snapshotError } = await supabase
      .from("transactions")
      .update({
        jersey_snapshot: {
          team: jersey.team,
          name: jersey.name,
          league: jersey.league,
          year: jersey.year,
          size: jersey.size,
          condition: jersey.condition,
          image: jersey.image_urls?.[0] ?? jersey.image_url ?? null,
        },
      })
      .eq("id", tx.id)
      .is("jersey_snapshot", null);
    if (snapshotError) console.error("[stripe-webhook] jersey snapshot failed (non-fatal):", snapshotError);
  }

  const { error: jerseyError } = await supabase
    .from("user_jerseys")
    .update({ listing_type: "sold", sale_price_cents: null, last_sale_price_cents: amountCents })
    .eq("id", tx.jersey_id);
  if (jerseyError) throw jerseyError;

  const isBidAsk = meta.flow === "bid_ask_match" && !!meta.match_id;
  if (isBidAsk) {
    const { error: matchError } = await supabase
      .from("bid_ask_matches")
      .update({ status: "completed", stripe_payment_intent_id: piId })
      .eq("id", meta.match_id)
      .eq("status", "pending");
    if (matchError) throw matchError;
  }

  if (!sendNotifications) return;

  const rows = isBidAsk
    ? [
      { recipient_id: tx.buyer_id, type: "bid_ask_matched", jersey_id: tx.jersey_id, buyer_id: tx.buyer_id, amount_cents: amountCents },
      { recipient_id: tx.seller_id, type: "bid_ask_matched", jersey_id: tx.jersey_id, buyer_id: tx.buyer_id, amount_cents: amountCents },
    ]
    : [
      { recipient_id: tx.seller_id, type: "jersey_sold", jersey_id: tx.jersey_id, buyer_id: tx.buyer_id, amount_cents: amountCents },
    ];
  const { error: notifError } = await supabase.from("jersey_sold_notifications").insert(rows);
  if (notifError) {
    console.error("[stripe-webhook] notification insert failed (non-fatal):", notifError);
  }

  // CC-ORDER-MAILS: Kaufbestätigung an den Käufer, „Verkauft – bitte versenden“ an den Verkäufer (nie fatal)
  await notifyOrder(supabase, tx.id, "paid");
}

// ── payment_intent.succeeded → only remember the PaymentIntent id ────────────
async function storePaymentIntentFromIntent(
  pi: Stripe.PaymentIntent,
  stripe: StripeClient,
  supabase: SupabaseClient,
): Promise<void> {
  try {
    const sessions = await stripe.checkout.sessions.list({ payment_intent: pi.id, limit: 1 });
    const session = sessions.data[0];
    if (session) await attachPaymentIntent(supabase, session.id, pi.id);
  } catch (err) {
    // Purely informational — checkout.session.completed stores the id as well.
    console.warn("[stripe-webhook] could not link PaymentIntent", pi.id, errorMessage(err));
  }
}

// ── charge.refunded → transaction refunded ───────────────────────────────────
async function handleRefund(charge: Stripe.Charge, supabase: SupabaseClient): Promise<void> {
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;
  if (!charge.refunded) {
    console.log(`[stripe-webhook] partial refund on ${piId} (${charge.amount_refunded} of ${charge.amount} cents) — transaction status unchanged.`);
    return;
  }

  const { data, error } = await supabase
    .from("transactions")
    .update({ status: "refunded" })
    .eq("stripe_payment_intent_id", piId)
    .eq("status", "completed")
    .select("id, jersey_id");
  if (error) throw error;

  if (!data || data.length === 0) {
    // Legacy bid/ask rows stored the PaymentIntent id in stripe_session_id.
    const { error: legacyError } = await supabase
      .from("transactions")
      .update({ status: "refunded" })
      .eq("stripe_session_id", piId)
      .eq("status", "completed");
    if (legacyError) throw legacyError;
  }

  // TODO(admin): Nach einer Erstattung bleibt das Trikot bewusst auf 'sold'. Ob es wieder
  // zum Verkauf gestellt wird, entscheidet ein Admin/der Verkäufer (Ware evtl. schon versendet).
}
