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

  // Only handle checkout.session.completed
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
