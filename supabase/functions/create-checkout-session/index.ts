import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno&no-check=true";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let jersey_id: string | undefined;
  let buyer_id: string | undefined;
  let match_id: string | undefined;

  try {
    const body = await req.json();
    jersey_id = body.jersey_id;
    buyer_id = body.buyer_id;
    match_id = body.match_id;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
  });

  const siteUrl =
    Deno.env.get("SITE_URL") || "https://vintage-league-v2.vercel.app";

  // ── Bid/Ask match flow ────────────────────────────────────────────────────
  if (match_id) {
    // Look up the pending match
    const { data: match, error: matchError } = await supabase
      .from("bid_ask_matches")
      .select("id, bid_id, ask_id, jersey_id, matched_price_cents, status")
      .eq("id", match_id)
      .eq("status", "pending")
      .single();

    if (matchError || !match) {
      return new Response(JSON.stringify({ error: "Match not found or not pending" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch bid (buyer) and ask (seller)
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select("id, user_id")
      .eq("id", match.bid_id)
      .single();

    const { data: ask, error: askError } = await supabase
      .from("asks")
      .select("id, user_id")
      .eq("id", match.ask_id)
      .single();

    if (bidError || !bid || askError || !ask) {
      return new Response(JSON.stringify({ error: "Failed to load match participants" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch jersey name for line item
    const { data: jersey } = await supabase
      .from("user_jerseys")
      .select("name")
      .eq("id", match.jersey_id)
      .single();

    const jerseyName = jersey?.name ?? "Vintage Jersey";
    const matchedPriceCents = match.matched_price_cents;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: jerseyName },
            unit_amount: matchedPriceCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          match_id: match.id,
          bid_id: match.bid_id,
          ask_id: match.ask_id,
          jersey_id: match.jersey_id,
          flow: "bid_ask_match",
          buyer_id: bid.user_id,
          seller_id: ask.user_id,
        },
      },
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/jersey/${match.jersey_id}`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Direct buy flow (unchanged) ───────────────────────────────────────────
  if (!jersey_id || !buyer_id) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: jersey_id and buyer_id (or match_id for bid/ask flow)" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Validate jersey: must exist, have sale_price_cents set, and listing type must allow purchase
  const { data: jersey, error: jerseyError } = await supabase
    .from("user_jerseys")
    .select("id, name, sale_price_cents, user_id, listing_type")
    .eq("id", jersey_id!)
    .is("deleted_at", null)
    .single();

  if (jerseyError || !jersey) {
    return new Response(JSON.stringify({ error: "Jersey not found" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (
    jersey.sale_price_cents === null ||
    !["buy_now", "both"].includes(jersey.listing_type)
  ) {
    return new Response(
      JSON.stringify({ error: "Jersey is not available for purchase" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: completedTx } = await supabase
    .from("transactions")
    .select("id")
    .eq("jersey_id", jersey_id!)
    .eq("status", "completed")
    .maybeSingle();

  if (completedTx) {
    return new Response(JSON.stringify({ error: "Jersey already sold" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const platformFeeCents = Math.round(jersey.sale_price_cents * 0.05);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: jersey.name },
          unit_amount: jersey.sale_price_cents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      jersey_id: jersey_id!,
      buyer_id,
      seller_id: jersey.user_id,
      platform_fee_cents: String(platformFeeCents),
    },
    success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/jersey/${jersey_id}`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
