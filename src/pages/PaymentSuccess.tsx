import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-green-500" />
        <h1 className="font-display text-4xl font-bold mb-4">Zahlung erfolgreich!</h1>
        <p className="text-muted-foreground mb-2">Dein Trikot ist auf dem Weg.</p>
        {sessionId ? (
          <p className="text-xs text-muted-foreground mb-8 font-mono">Session: {sessionId}</p>
        ) : (
          <p className="text-xs text-muted-foreground mb-8">Keine Session-ID gefunden.</p>
        )}
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate("/shop")}>Weiter shoppen</Button>
          <Button variant="outline" onClick={() => navigate("/collection")}>Meine Sammlung</Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
