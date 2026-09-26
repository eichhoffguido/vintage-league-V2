// CC-S2 — Supabase service client, Stripe client and caller authentication.
import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno&no-check=true";

export { Stripe };

export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function createStripe(): Stripe {
  return new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

/**
 * Returns the logged-in user behind the request's bearer token, or null.
 * supabase-js `functions.invoke` sends the user's access token automatically;
 * a request carrying only the anon key (not logged in) resolves to null.
 */
export async function getAuthenticatedUser(
  req: Request,
  supabase: SupabaseClient,
): Promise<User | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
