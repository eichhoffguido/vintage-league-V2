import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Käufer ermittelt der Server aus dem Login (CC-S2) — daher keine buyer_id mehr im Body.
export type CheckoutRequest = { jersey_id: string } | { match_id: string };

const FALLBACK_MESSAGE = "Checkout konnte nicht gestartet werden. Bitte versuche es gleich noch einmal.";

/** Liest die deutsche Fehlermeldung der Edge Function (z. B. 409 „gerade reserviert“) aus. */
export async function checkoutErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body: unknown = await error.context.json();
      if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
        return body.error;
      }
    } catch {
      // Antwort ohne JSON-Body → Standardtext
    }
  }
  return FALLBACK_MESSAGE;
}

/** Startet den Stripe-Checkout und leitet weiter. Wirft einen Error mit deutscher Meldung. */
export async function startCheckout(request: CheckoutRequest): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ url?: string }>("create-checkout-session", {
    body: request,
  });
  if (error) throw new Error(await checkoutErrorMessage(error));
  if (!data?.url) throw new Error(FALLBACK_MESSAGE);
  window.location.href = data.url;
}
