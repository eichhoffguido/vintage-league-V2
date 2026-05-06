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

  let jersey_id: string;
  let buyer_id: string;

  try {
    const body = await req.json();
    jersey_id = body.jersey_id;
    buyer_id = body.buyer_id;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!jersey_id || !buyer_id) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: jersey_id and buyer_id" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Validate jersey: must exist, have sale_price_cents set, and listing type must allow purchase
  const { data: jersey, error: jerseyError } = await supabase
    .from("user_jerseys")
    .select("id, name, sale_price_cents, user_id, listing_type")
    .eq("id", jersey_id)
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
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Check if already sold: a completed transaction exists for this jersey
  const { data: completedTx } = await supabase
    .from("transactions")
    .select("id")
    .eq("jersey_id", jersey_id)
    .eq("status", "completed")
    .maybeSingle();

  if (completedTx) {
    return new Response(JSON.stringify({ error: "Jersey already sold" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Compute 5% platform fee
  const platformFeeCents = Math.round(jersey.sale_price_cents * 0.05);

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
  });

  const siteUrl =
    Deno.env.get("SITE_URL") || "https://vintage-league-v2.vercel.app";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: jersey.name,
          },
          unit_amount: jersey.sale_price_cents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      jersey_id,
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
