import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno&no-check=true";

serve(async (req) => {
  // Only POST is accepted for webhook events
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
  });

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Read raw body for signature verification (must not use req.json())
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── payment_intent.succeeded — bid/ask match flow ─────────────────────────
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const meta = pi.metadata ?? {};

    if (meta.flow !== "bid_ask_match") {
      // Not our bid/ask match event — acknowledge and ignore
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { match_id, bid_id, ask_id, jersey_id, buyer_id, seller_id } = meta;

    if (!match_id || !bid_id || !ask_id || !jersey_id || !buyer_id || !seller_id) {
      console.error("Missing required bid_ask_match metadata:", meta);
      return new Response(JSON.stringify({ error: "Missing metadata fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Update bid_ask_matches: status=completed, stripe_payment_intent_id
    const { error: matchUpdateError } = await supabase
      .from("bid_ask_matches")
      .update({ status: "completed", stripe_payment_intent_id: pi.id })
      .eq("id", match_id);

    if (matchUpdateError) {
      console.error("Failed to update bid_ask_match:", matchUpdateError);
      return new Response(JSON.stringify({ error: "Failed to update match record" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Mark jersey as sold
    const { error: jerseyError } = await supabase
      .from("user_jerseys")
      .update({ listing_type: "sold", sale_price_cents: null })
      .eq("id", jersey_id);

    if (jerseyError) {
      console.error("Failed to update jersey listing_type:", jerseyError);
      // Non-fatal: match already recorded
    }

    // 3. Insert into transactions (same columns as the existing buy flow)
    const amountCents = pi.amount_received ?? pi.amount ?? 0;
    const { error: txError } = await supabase.from("transactions").insert({
      jersey_id,
      buyer_id,
      seller_id,
      amount_cents: amountCents,
      platform_fee_cents: 0, // no platform fee on bid/ask matches (fee handled separately if needed)
      stripe_session_id: pi.id, // payment intent id stored in stripe_session_id column
      status: "completed",
    });

    if (txError) {
      console.error("Failed to insert bid_ask_match transaction:", txError);
      return new Response(JSON.stringify({ error: "Failed to record transaction" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Insert 2x notifications: buyer and seller
    const { error: notifError } = await supabase.from("jersey_sold_notifications").insert([
      {
        recipient_id: buyer_id,
        type: "bid_ask_matched",
        jersey_id,
        buyer_id,
        amount_cents: amountCents,
      },
      {
        recipient_id: seller_id,
        type: "bid_ask_matched",
        jersey_id,
        buyer_id,
        amount_cents: amountCents,
      },
    ]);

    if (notifError) {
      console.error("Failed to insert bid_ask_matched notifications:", notifError);
      // Non-fatal: transaction already recorded
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── checkout.session.completed — direct buy flow (unchanged) ──────────────
  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { jersey_id, buyer_id, seller_id, platform_fee_cents } = session.metadata ?? {};

  if (!jersey_id || !buyer_id || !seller_id) {
    console.error("Missing required metadata fields:", session.metadata);
    return new Response(JSON.stringify({ error: "Missing metadata fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const amountCents = session.amount_total ?? 0;
  const platformFee = platform_fee_cents ? parseInt(platform_fee_cents, 10) : 0;
  const stripeSessionId = session.id;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Insert into transactions table
  const { error: txError } = await supabase.from("transactions").insert({
    jersey_id,
    buyer_id,
    seller_id,
    amount_cents: amountCents,
    platform_fee_cents: platformFee,
    stripe_session_id: stripeSessionId,
    status: "completed",
  });

  if (txError) {
    console.error("Failed to insert transaction:", txError);
    return new Response(JSON.stringify({ error: "Failed to record transaction" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Mark jersey as sold
  const { error: jerseyError } = await supabase
    .from("user_jerseys")
    .update({ listing_type: "sold", sale_price_cents: null })
    .eq("id", jersey_id);

  if (jerseyError) {
    console.error("Failed to update jersey listing_type:", jerseyError);
    // Non-fatal: transaction already recorded, log and continue
  }

  // 3. Insert seller notification
  const { error: notifError } = await supabase.from("jersey_sold_notifications").insert({
    recipient_id: seller_id,
    type: "jersey_sold",
    jersey_id,
    buyer_id,
    amount_cents: amountCents,
  });

  if (notifError) {
    console.error("Failed to insert jersey_sold_notification:", notifError);
    // Non-fatal: core transaction is already recorded
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
