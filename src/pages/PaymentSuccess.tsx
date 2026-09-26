import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

type CheckoutStatus = "paid" | "pending" | "failed" | "expired";
type ViewState =
  | { kind: "loading" }
  | { kind: "result"; status: CheckoutStatus; jerseyId: string; amountCents: number }
  | { kind: "error"; reason: "missing" | "login" | "notfound" | "unknown" };

interface VerifyResponse {
  status: CheckoutStatus;
  jersey_id: string;
  amount_cents: number;
}

// The webhook can arrive a few seconds after Stripe redirects back — re-check a few times.
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 5;

const formatEuro = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<ViewState>(
    sessionId ? { kind: "loading" } : { kind: "error", reason: "missing" },
  );

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async (attempt: number) => {
      const { data, error } = await supabase.functions.invoke<VerifyResponse>("verify-checkout-session", {
        body: { session_id: sessionId },
      });
      if (cancelled) return;

      if (error || !data) {
        const httpStatus = error instanceof FunctionsHttpError ? (error.context as Response).status : undefined;
        setState({
          kind: "error",
          reason: httpStatus === 401 ? "login" : httpStatus === 404 ? "notfound" : "unknown",
        });
        return;
      }

      setState({ kind: "result", status: data.status, jerseyId: data.jersey_id, amountCents: data.amount_cents });
      if (data.status === "pending" && attempt < MAX_POLLS) {
        timer = setTimeout(() => check(attempt + 1), POLL_INTERVAL_MS);
      }
    };

    check(1);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-xl border border-border bg-card p-8 text-center">
          <Content state={state} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Content = ({ state }: { state: ViewState }) => {
  if (state.kind === "loading") {
    return (
      <>
        <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-muted-foreground" aria-hidden />
        <h1 className="font-display text-3xl font-bold mb-3">Zahlung wird geprüft …</h1>
        <p className="text-muted-foreground">Einen Moment, wir fragen den Status bei Stripe ab.</p>
      </>
    );
  }

  if (state.kind === "error") {
    const copy = {
      missing: { title: "Kein Kauf gefunden.", text: "Diese Seite wurde ohne Bezahlvorgang aufgerufen." },
      login: { title: "Bitte melde dich an.", text: "Melde dich mit dem Konto an, mit dem du bezahlt hast, um den Status zu sehen." },
      notfound: { title: "Kauf nicht gefunden.", text: "Zu diesem Bezahlvorgang gibt es keinen Kauf in deinem Konto." },
      unknown: { title: "Status nicht verfügbar.", text: "Der Zahlungsstatus konnte gerade nicht geladen werden. Bitte lade die Seite gleich neu." },
    }[state.reason];
    return (
      <>
        <XCircle className="mx-auto mb-6 h-12 w-12 text-muted-foreground" aria-hidden />
        <h1 className="font-display text-3xl font-bold mb-3">{copy.title}</h1>
        <p className="text-muted-foreground mb-8">{copy.text}</p>
        <div className="flex flex-wrap justify-center gap-4">
          {state.reason === "login" && (
            <Button asChild>
              <Link to="/auth">Anmelden</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/shop">Zum Marktplatz</Link>
          </Button>
        </div>
      </>
    );
  }

  const jerseyLink = `/jersey/${state.jerseyId}`;

  if (state.status === "paid") {
    return (
      <>
        <CheckCircle2 className="mx-auto mb-6 h-12 w-12 text-primary" aria-hidden />
        <h1 className="font-display text-3xl font-bold mb-3">Zahlung erfolgreich.</h1>
        <p className="text-muted-foreground mb-8">
          Du hast {formatEuro(state.amountCents)} bezahlt. Das Trikot gehört dir — der Verkäufer wurde benachrichtigt.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild>
            <Link to={jerseyLink}>Zum Trikot</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/shop">Weiter stöbern</Link>
          </Button>
        </div>
      </>
    );
  }

  if (state.status === "pending") {
    return (
      <>
        <Clock className="mx-auto mb-6 h-12 w-12 text-muted-foreground" aria-hidden />
        <h1 className="font-display text-3xl font-bold mb-3">Zahlung in Bearbeitung.</h1>
        <p className="text-muted-foreground mb-8">
          Deine Zahlung über {formatEuro(state.amountCents)} ist noch nicht bestätigt. Bei Lastschrift (SEPA) kann das
          einige Werktage dauern. Das Trikot bleibt so lange für dich reserviert.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild variant="outline">
            <Link to={jerseyLink}>Zum Trikot</Link>
          </Button>
        </div>
      </>
    );
  }

  const expired = state.status === "expired";
  return (
    <>
      <XCircle className="mx-auto mb-6 h-12 w-12 text-destructive" aria-hidden />
      <h1 className="font-display text-3xl font-bold mb-3">
        {expired ? "Bezahlvorgang abgelaufen." : "Zahlung fehlgeschlagen."}
      </h1>
      <p className="text-muted-foreground mb-8">
        {expired
          ? "Die Reservierung ist abgelaufen, es wurde nichts abgebucht. Ist das Trikot noch verfügbar, kannst du es erneut kaufen."
          : "Der Kauf konnte nicht abgeschlossen werden. Falls bereits Geld abgebucht wurde, wird es automatisch erstattet."}
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button asChild>
          <Link to={jerseyLink}>Zum Trikot</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/shop">Zum Marktplatz</Link>
        </Button>
      </div>
    </>
  );
};

export default PaymentSuccess;
