import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatEuros } from "@/utils/currency";
import { getImageUrl } from "@/utils/imageUrl";
import type { Tables } from "@/integrations/supabase/types";

interface PlaceBidModalProps {
  open: boolean;
  onClose: () => void;
  jersey: Tables<"user_jerseys">;
  highestBid: number | null | undefined;
  lowestAsk: number | null | undefined;
}

const PlaceBidModal = ({ open, onClose, jersey, highestBid, lowestAsk }: PlaceBidModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [priceEuros, setPriceEuros] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"matched" | "placed" | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setPriceEuros("");
    setLoading(false);
    setResult(null);
    setMatchId(null);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const parsed = parseInt(priceEuros, 10);
    if (!priceEuros || isNaN(parsed) || parsed < 1) {
      setError("Bitte gib einen gültigen Betrag (mind. €1) ein.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("place-bid", {
        body: { jersey_id: jersey.id, price_cents: parsed * 100 },
      });

      if (fnError) throw fnError;

      if (data.matched) {
        setMatchId(data.match_id);
        setResult("matched");
      } else {
        setResult("placed");
      }
    } catch (err: any) {
      setError(err.message || "Gebot konnte nicht platziert werden.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-checkout-session", {
        body: { match_id: matchId, buyer_id: user!.id },
      });
      if (fnError) throw fnError;
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Checkout konnte nicht gestartet werden", variant: "destructive" });
      setLoading(false);
    }
  };

  const imageUrl = getImageUrl(jersey.image_url);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Gebot abgeben</DialogTitle>
        </DialogHeader>

        {result === "matched" ? (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Gebot angenommen! Du wirst zur Zahlung weitergeleitet.
            </p>
            <Button className="w-full uppercase tracking-wider" variant="hero" onClick={handleCheckout} disabled={loading}>
              {loading ? "Wird geladen..." : "Zur Zahlung"}
            </Button>
            <Button variant="outline" className="w-full" onClick={handleClose}>Schließen</Button>
          </div>
        ) : result === "placed" ? (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Gebot platziert. Du wirst benachrichtigt wenn dein Gebot angenommen wird.
            </p>
            <Button className="w-full uppercase tracking-wider" onClick={handleClose}>Schließen</Button>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Jersey info */}
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <img src={imageUrl} alt={jersey.name} className="h-16 w-16 rounded-sm object-cover bg-secondary flex-shrink-0" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-secondary text-muted-foreground font-display font-bold text-xl flex-shrink-0">
                  {jersey.team.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate">{jersey.name}</p>
                <p className="text-xs text-muted-foreground">{jersey.league} · {jersey.year}</p>
                {lowestAsk !== undefined && lowestAsk !== null && (
                  <p className="text-xs text-muted-foreground mt-0.5">Sofort kaufen ab: <span className="font-semibold text-foreground">{formatEuros(lowestAsk)}</span></p>
                )}
              </div>
            </div>

            {/* Reference: highest bid */}
            {highestBid !== undefined && highestBid !== null && (
              <div className="rounded-sm border border-border bg-secondary/50 px-4 py-2 text-sm">
                Höchstes Gebot: <span className="font-semibold text-primary">{formatEuros(highestBid)}</span>
              </div>
            )}

            {/* Price input */}
            <div className="space-y-2">
              <Label htmlFor="bid-price">Mein Gebot (€)</Label>
              <Input
                id="bid-price"
                type="number"
                min={1}
                step={1}
                placeholder="z.B. 75"
                value={priceEuros}
                onChange={(e) => { setPriceEuros(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              />
              <p className="text-xs text-muted-foreground">Gültig für 30 Tage</p>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
                Abbrechen
              </Button>
              <Button className="flex-1 uppercase tracking-wider" variant="hero" onClick={handleSubmit} disabled={loading || !priceEuros}>
                {loading ? "Wird gesendet..." : "Gebot abgeben"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlaceBidModal;
