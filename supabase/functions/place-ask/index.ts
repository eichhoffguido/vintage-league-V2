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

  // Validate jersey: exists, not deleted, owned by caller, not sold
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

  if (jersey.user_id !== user.id) {
    return new Response(JSON.stringify({ error: "You do not own this jersey" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (jersey.listing_type === "sold") {
    return new Response(JSON.stringify({ error: "Jersey is already sold" }), {
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

  // Insert ask
  const { data: ask, error: askError } = await supabase
    .from("asks")
    .insert({
      user_id: user.id,
      jersey_id,
      price_cents,
      status: "active",
    })
    .select("id")
    .single();

  if (askError || !ask) {
    console.error("Failed to insert ask:", askError);
    return new Response(JSON.stringify({ error: "Failed to place ask" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Matching check: find highest active bid for this jersey where bid price >= ask price
  const { data: matchingBid } = await supabase
    .from("bids")
    .select("id, user_id, price_cents")
    .eq("jersey_id", jersey_id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .gte("price_cents", price_cents)
    .order("price_cents", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (matchingBid) {
    // Create match at ask price (ask sets the price)
    const { data: match, error: matchError } = await supabase
      .from("bid_ask_matches")
      .insert({
        bid_id: matchingBid.id,
        ask_id: ask.id,
        jersey_id,
        matched_price_cents: price_cents,
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

    // Update ask and bid to matched
    await supabase.from("asks").update({ status: "matched" }).eq("id", ask.id);
    await supabase.from("bids").update({ status: "matched" }).eq("id", matchingBid.id);

    return new Response(
      JSON.stringify({ ask_id: ask.id, matched: true, match_id: match.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // No match: notify all active bidders about the new ask
  const { data: activeBids } = await supabase
    .from("bids")
    .select("id, user_id")
    .eq("jersey_id", jersey_id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());

  if (activeBids && activeBids.length > 0) {
    const notifications = activeBids.map((bid) => ({
      recipient_id: bid.user_id,
      type: "ask_placed",
      jersey_id,
      buyer_id: user.id,
      amount_cents: price_cents,
    }));

    const { error: notifError } = await supabase
      .from("jersey_sold_notifications")
      .insert(notifications);

    if (notifError) {
      console.error("Failed to insert ask_placed notifications:", notifError);
      // Non-fatal: ask already placed
    }
  }

  return new Response(
    JSON.stringify({ ask_id: ask.id, matched: false }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
