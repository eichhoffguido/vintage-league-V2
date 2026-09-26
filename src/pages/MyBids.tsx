import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
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

// Eckige Status-Tags (Skill cc-design §6): aktiv = verde Kontur, angenommen = verde gefüllt,
// storniert = neutral, abgelaufen = rosso Kontur.
const statusConfig: Record<BidStatus, { label: string; className: string }> = {
  active: { label: "Aktiv", className: "border-verde bg-transparent text-verde" },
  matched: { label: "Angenommen", className: "border-verde bg-verde text-avorio" },
  cancelled: { label: "Storniert", className: "border-nero bg-transparent text-muted-foreground" },
  expired: { label: "Abgelaufen", className: "border-rosso bg-transparent text-rosso" },
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

      {/* Persönlicher Bereich → grünes Kopfband (Skill cc-design §5.1) */}
      <PageHeader tone="verde" eyebrow="Le mie offerte · Gebote" title="Meine" hollowWord="Gebote." />

      <div className="container mx-auto px-4 py-8 md:px-10 md:py-12">
        {loading ? (
          <div className="border-t border-nero">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-b border-nero py-4">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : bids.length === 0 ? (
          <div className="border-2 border-nero bg-card px-6 py-12 text-center">
            <p className="font-display text-lg font-semibold">Du hast noch keine Gebote abgegeben.</p>
            <Button variant="outline" className="mt-5" onClick={() => navigate("/shop")}>
              Zum Marktplatz →
            </Button>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="cap hidden grid-cols-[48px_minmax(0,2fr)_1fr_1fr_1fr_auto] gap-4 border-y border-nero py-3 text-[11px] text-muted-foreground md:grid">
              <div />
              <div>Trikot</div>
              <div>Mein Gebot</div>
              <div>Niedrigstes Ask</div>
              <div>Läuft ab</div>
              <div className="min-w-[132px]">Aktion</div>
            </div>

            <ul className="border-t border-nero md:border-t-0">
              {bids.map((bid) => {
                const cfg = statusConfig[bid.status] || statusConfig.expired;
                const imageUrl = getImageUrl(bid.jersey ? getPrimaryImage(bid.jersey) : null);
                const expiresDate = new Date(bid.expires_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });

                return (
                  <li
                    key={bid.id}
                    className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-nero py-4 md:grid-cols-[48px_minmax(0,2fr)_1fr_1fr_1fr_auto] md:gap-4"
                  >
                    {/* Thumbnail */}
                    <div className="h-12 w-12 self-start md:self-center">
                      {imageUrl ? (
                        <img src={imageUrl} alt={bid.jersey?.name ?? ""} className="h-12 w-12 border border-nero bg-sabbia object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center border border-nero bg-sabbia font-display text-lg font-bold text-nero/40">
                          {(bid.jersey?.team ?? "?").charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Jersey info */}
                    <div className="min-w-0">
                      <Link
                        to={`/jersey/${bid.jersey_id}`}
                        className="block truncate font-display text-[17px] font-semibold tracking-[-0.02em] underline-offset-4 hover:underline"
                      >
                        {bid.jersey?.name ?? "Trikot"}
                      </Link>
                      <p className="cap mt-0.5 text-[10px] text-muted-foreground">{bid.jersey?.league} · {bid.jersey?.year}</p>
                      <Badge variant="tag" className={`mt-2 ${cfg.className}`}>{cfg.label}</Badge>
                    </div>

                    {/* My bid */}
                    <div className="col-span-2 flex items-baseline justify-between gap-4 md:col-span-1 md:block">
                      <span className="cap text-[10px] text-muted-foreground md:hidden">Mein Gebot</span>
                      <p className="num text-2xl leading-none">{formatEuros(bid.price_cents)}</p>
                    </div>

                    {/* Lowest ask */}
                    <div className="col-span-2 flex items-baseline justify-between gap-4 md:col-span-1 md:block">
                      <span className="cap text-[10px] text-muted-foreground md:hidden">Niedrigstes Ask</span>
                      {bid.status === "active" ? (
                        bid.lowestAsk !== undefined && bid.lowestAsk !== null ? (
                          <p className="num text-lg leading-none">{formatEuros(bid.lowestAsk)}</p>
                        ) : (
                          <p className="num text-lg leading-none text-muted-foreground">—</p>
                        )
                      ) : (
                        <p className="num text-lg leading-none text-muted-foreground">—</p>
                      )}
                    </div>

                    {/* Expires */}
                    <div className="col-span-2 flex items-baseline justify-between gap-4 md:col-span-1 md:block">
                      <span className="cap text-[10px] text-muted-foreground md:hidden">Läuft ab</span>
                      <p className="num text-lg leading-none text-muted-foreground">{expiresDate}</p>
                    </div>

                    {/* Action */}
                    <div className="col-span-2 md:col-span-1 md:min-w-[132px]">
                      {bid.status === "active" && (
                        <Button
                          variant="outline"
                          className="mt-1 w-full border-rosso text-rosso hover:bg-rosso hover:text-avorio md:mt-0 md:w-auto"
                          onClick={() => setCancelTargetId(bid.id)}
                        >
                          Zurückziehen
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
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
              className="border-rosso bg-rosso text-avorio hover:bg-rosso/90"
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
