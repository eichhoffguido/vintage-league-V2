import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatEuros } from "@/utils/currency";
import { getImageUrl } from "@/utils/imageUrl";
import { getPrimaryImage } from "@/utils/jerseyImage";
import { getLowestAsk } from "@/utils/market";

type BidStatus = "active" | "matched" | "cancelled" | "expired";

interface BidRow {
  id: string;
  jersey_id: string;
  price_cents: number;
  status: BidStatus;
  expires_at: string;
  created_at: string;
  jersey?: {
    id: string;
    name: string;
    team: string;
    league: string;
    year: string;
    image_url: string | null;
    image_urls: string[] | null;
  } | null;
  lowestAsk?: number | null;
}

const statusConfig: Record<BidStatus, { label: string; className: string }> = {
  active: { label: "Aktiv", className: "bg-green-500/15 text-green-700 border-green-500/20" },
  matched: { label: "Angenommen", className: "bg-blue-500/15 text-blue-700 border-blue-500/20" },
  cancelled: { label: "Storniert", className: "bg-red-500/15 text-red-700 border-red-500/20" },
  expired: { label: "Abgelaufen", className: "bg-secondary text-muted-foreground border-border" },
};

const MyBids = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bids, setBids] = useState<BidRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBids();
    }
  }, [user]);

  const fetchBids = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bids")
        .select("id, jersey_id, price_cents, status, expires_at, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows: BidRow[] = (data || []).map((b: any) => ({ ...b }));

      // Enrich with jersey data
      const jerseyIds = [...new Set(rows.map((b) => b.jersey_id))];
      if (jerseyIds.length > 0) {
        const { data: jerseys } = await supabase
          .from("user_jerseys")
          .select("id, name, team, league, year, image_url, image_urls")
          .in("id", jerseyIds);

        const jerseyMap = new Map((jerseys || []).map((j: any) => [j.id, j]));
        rows.forEach((b) => { b.jersey = jerseyMap.get(b.jersey_id) || null; });
      }

      // Fetch lowest ask for active bids
      await Promise.all(
        rows
          .filter((b) => b.status === "active")
          .map(async (b) => {
            b.lowestAsk = await getLowestAsk(b.jersey_id);
          })
      );

      setBids(rows);
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Gebote konnten nicht geladen werden", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTargetId) return;
    setCancelling(true);
    // Optimistic update
    const previous = bids.map((b) => ({ ...b }));
    setBids((prev) => prev.filter((b) => b.id !== cancelTargetId));

    try {
      const { error } = await supabase.functions.invoke("cancel-bid", {
        body: { bid_id: cancelTargetId },
      });
      if (error) throw error;
      toast({ title: "Gebot zurückgezogen", description: "Das Gebot wurde erfolgreich storniert." });
    } catch (err: any) {
      // Restore on failure
      setBids(previous);
      toast({ title: "Fehler", description: err.message || "Gebot konnte nicht storniert werden", variant: "destructive" });
    } finally {
      setCancelling(false);
      setCancelTargetId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <EmailVerificationBanner />
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-4xl font-bold mb-8">Meine Gebote</h1>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-sm" />
            ))}
          </div>
        ) : bids.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-16 text-center">
            <p className="font-display text-xl text-muted-foreground">Du hast noch keine Gebote abgegeben.</p>
            <Button variant="outline" className="mt-6" onClick={() => navigate("/shop")}>
              Zum Marktplatz
            </Button>
          </div>
        ) : (
          <div className="rounded-sm border border-border overflow-hidden">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-4 bg-secondary/50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <div className="w-12" />
              <div>Trikot</div>
              <div>Mein Gebot</div>
              <div>Niedrigstes Ask</div>
              <div>Läuft ab</div>
              <div>Aktion</div>
            </div>

            {bids.map((bid, idx) => {
              const cfg = statusConfig[bid.status] || statusConfig.expired;
              const imageUrl = getImageUrl(bid.jersey ? getPrimaryImage(bid.jersey) : null);
              const expiresDate = new Date(bid.expires_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });

              return (
                <div
                  key={bid.id}
                  className={`grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-4 py-4 ${idx !== 0 ? "border-t border-border" : ""}`}
                >
                  {/* Thumbnail */}
                  <div className="hidden md:block w-12">
                    {imageUrl ? (
                      <img src={imageUrl} alt={bid.jersey?.name ?? ""} className="h-12 w-12 rounded-sm object-cover bg-secondary" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-secondary text-muted-foreground font-display font-bold">
                        {(bid.jersey?.team ?? "?").charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Jersey info */}
                  <div className="min-w-0">
                    <Link to={`/jersey/${bid.jersey_id}`} className="font-semibold hover:text-primary truncate block">
                      {bid.jersey?.name ?? "Trikot"}
                    </Link>
                    <p className="text-xs text-muted-foreground">{bid.jersey?.league} · {bid.jersey?.year}</p>
                    <Badge className={`mt-1 text-xs border ${cfg.className}`} variant="outline">{cfg.label}</Badge>
                  </div>

                  {/* My bid */}
                  <div>
                    <p className="font-semibold text-primary">{formatEuros(bid.price_cents)}</p>
                  </div>

                  {/* Lowest ask */}
                  <div>
                    {bid.status === "active" ? (
                      bid.lowestAsk !== undefined && bid.lowestAsk !== null ? (
                        <p className="text-sm">{formatEuros(bid.lowestAsk)}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">—</p>
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>

                  {/* Expires */}
                  <div>
                    <p className="text-sm text-muted-foreground">{expiresDate}</p>
                  </div>

                  {/* Action */}
                  <div>
                    {bid.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setCancelTargetId(bid.id)}
                      >
                        Zurückziehen
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />

      <AlertDialog open={cancelTargetId !== null} onOpenChange={(v) => { if (!v) setCancelTargetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gebot wirklich zurückziehen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelConfirm}
              disabled={cancelling}
            >
              {cancelling ? "Wird storniert..." : "Zurückziehen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyBids;
