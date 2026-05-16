import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse body
  let jersey_id: string;
  let price_cents: number;
  try {
    const body = await req.json();
    jersey_id = body.jersey_id;
    price_cents = body.price_cents;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!jersey_id || !price_cents) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: jersey_id and price_cents" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (typeof price_cents !== "number" || price_cents <= 0) {
    return new Response(JSON.stringify({ error: "price_cents must be a positive integer" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate jersey: exists, not deleted, not owned by caller
  const { data: jersey, error: jerseyError } = await supabase
    .from("user_jerseys")
    .select("id, user_id, listing_type")
    .eq("id", jersey_id)
    .is("deleted_at", null)
    .single();

  if (jerseyError || !jersey) {
    return new Response(JSON.stringify({ error: "Jersey not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (jersey.user_id === user.id) {
    return new Response(JSON.stringify({ error: "Cannot place a bid on your own jersey" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Lazy cleanup: expire stale bids and asks for this jersey before matching
  const { error: expireBidsError } = await supabase
    .from("bids")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("jersey_id", jersey_id)
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString());

  if (expireBidsError) {
    console.error("Lazy cleanup failed for bids:", expireBidsError);
  }

  const { error: expireAsksError } = await supabase
    .from("asks")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("jersey_id", jersey_id)
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString());

  if (expireAsksError) {
    console.error("Lazy cleanup failed for asks:", expireAsksError);
  }

  // Insert bid
  const { data: bid, error: bidError } = await supabase
    .from("bids")
    .insert({
      user_id: user.id,
      jersey_id,
      price_cents,
      status: "active",
    })
    .select("id")
    .single();

  if (bidError || !bid) {
    console.error("Failed to insert bid:", bidError);
    return new Response(JSON.stringify({ error: "Failed to place bid" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Matching check: find lowest active ask for this jersey where ask price <= bid price
  const { data: matchingAsk } = await supabase
    .from("asks")
    .select("id, user_id, price_cents")
    .eq("jersey_id", jersey_id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .lte("price_cents", price_cents)
    .order("price_cents", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (matchingAsk) {
    // Create match at ask price (price taker is the bidder)
    const { data: match, error: matchError } = await supabase
      .from("bid_ask_matches")
      .insert({
        bid_id: bid.id,
        ask_id: matchingAsk.id,
        jersey_id,
        matched_price_cents: matchingAsk.price_cents,
        status: "pending",
      })
      .select("id")
      .single();

    if (matchError || !match) {
      console.error("Failed to create match:", matchError);
      return new Response(JSON.stringify({ error: "Failed to create match" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update bid and ask to matched
    await supabase.from("bids").update({ status: "matched" }).eq("id", bid.id);
    await supabase.from("asks").update({ status: "matched" }).eq("id", matchingAsk.id);

    return new Response(
      JSON.stringify({ bid_id: bid.id, matched: true, match_id: match.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // No match: notify jersey owner about new bid
  const { error: notifError } = await supabase.from("jersey_sold_notifications").insert({
    recipient_id: jersey.user_id,
    type: "bid_placed",
    jersey_id,
    buyer_id: user.id,
    amount_cents: price_cents,
  });

  if (notifError) {
    console.error("Failed to insert bid_placed notification:", notifError);
    // Non-fatal: bid already placed
  }

  return new Response(
    JSON.stringify({ bid_id: bid.id, matched: false }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
