import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Gem, Calendar, Package, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatEuros } from "@/utils/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type JerseyWithProfile = Tables<"user_jerseys"> & {
  profiles?: Tables<"profiles"> | null;
};

type SaleHistory = {
  id: string;
  team: string;
  league: string;
  year: string;
  price_cents: number | null;
  condition: number;
  sold_at: string;
};

const conditionLabels: Record<number, string> = {
  5: "Neuwertig",
  4: "Sehr gut",
  3: "Gut erhalten",
  2: "Gebraucht",
  1: "Sammlerstück",
};

const getVintageBonus = (year: string): number => {
  if (!year || year.trim() === "") return 1.0;
  const yearNum = parseInt(year, 10);
  if (Number.isNaN(yearNum)) return 1.0;
  const age = new Date().getFullYear() - yearNum;
  if (age >= 25) return 1.8;
  if (age >= 15) return 1.4;
  if (age >= 5) return 1.1;
  return 1.0;
};

const JerseyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [jersey, setJersey] = useState<JerseyWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saleHistory, setSaleHistory] = useState<SaleHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchJersey();
    }
  }, [id]);

  useEffect(() => {
    if (searchParams.get("cancelled") === "1") {
      toast({ title: "Zahlung abgebrochen", description: "Du kannst jederzeit erneut kaufen.", variant: "default" });
      navigate(`/jersey/${id}`, { replace: true });
    }
  }, [searchParams, id]);

  useEffect(() => {
    if (jersey) {
      fetchSaleHistory();
    }
  }, [jersey]);

  const fetchJersey = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("user_jerseys")
        .select("*")
        .eq("id", id!)
        .is("deleted_at", null)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user_id)
          .single();

        setJersey({ ...data, profiles: profile });
      }
    } catch (err: any) {
      setError(err.message || "Jersey konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleHistory = async () => {
    if (!jersey) return;
    setLoadingHistory(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("user_jerseys")
        .select("id, team, league, year, price_cents, condition, updated_at")
        .eq("team", jersey.team)
        .eq("league", jersey.league)
        .eq("year", jersey.year)
        .neq("id", jersey.id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (fetchError) throw fetchError;

      if (data) {
        const history: SaleHistory[] = data.map((item: any) => ({
          id: item.id,
          team: item.team,
          league: item.league,
          year: item.year,
          price_cents: item.price_cents,
          condition: item.condition,
          sold_at: item.updated_at,
        }));
        setSaleHistory(history);
      }
    } catch (err: any) {
      console.error("Error fetching sale history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleKaufen = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { jersey_id: jersey?.id, buyer_id: user.id },
      });
      if (error) throw error;
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Checkout konnte nicht gestartet werden", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <EmailVerificationBanner />
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <Skeleton className="h-10 w-40 mb-4" />
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square rounded-sm" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-2/3" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !jersey) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <EmailVerificationBanner />
        <div className="container mx-auto px-4 py-12">
          <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
          </Button>
          <div className="rounded-sm border border-dashed border-border p-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive/30" />
            <p className="font-display text-xl text-muted-foreground">Trikot nicht gefunden</p>
            <p className="mt-2 text-sm text-muted-foreground">{error || "Das angeforderte Trikot existiert nicht."}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const vintageBonus = getVintageBonus(jersey.year);
  const isOwner = user?.id === jersey.user_id;
  const age = Number.isNaN(parseInt(jersey.year, 10)) ? "—" : new Date().getFullYear() - parseInt(jersey.year, 10);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <EmailVerificationBanner />
      <div className="container mx-auto px-4 py-12">
        <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Jersey Image */}
          <div className="relative">
            <div className="sticky top-20">
              {jersey.image_url ? (
                <div className="aspect-square overflow-hidden rounded-sm bg-secondary">
                  <img src={jersey.image_url} alt={jersey.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-sm bg-secondary">
                  <span className="font-display text-8xl text-muted-foreground/30">{jersey.team.charAt(0)}</span>
                </div>
              )}
              {jersey.verification_status === "verified" && (
                <div className="absolute left-3 top-3 flex items-center gap-1 rounded-sm bg-primary px-2 py-1">
                  <ShieldCheck className="h-4 w-4 text-primary-foreground" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-primary-foreground">
                    Zertifiziert
                  </span>
                </div>
              )}
              {vintageBonus > 1.0 && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-sm bg-background/90 border border-primary/30 px-2 py-1 backdrop-blur-sm">
                  <Gem className="h-4 w-4 text-primary" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-primary">
                    {vintageBonus >= 1.8 ? "Klassiker" : vintageBonus >= 1.4 ? "Retro" : "Vintage"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Jersey Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{jersey.league} · {jersey.year}</p>
              <h1 className="font-display text-5xl font-bold mt-2">{jersey.team}</h1>
              <p className="text-lg text-muted-foreground mt-2">{jersey.name}</p>
            </div>

            {/* Price */}
            {jersey.sale_price_cents ? (
              <div className="rounded-sm border border-border bg-secondary/50 p-6">
                <p className="text-sm text-muted-foreground mb-2">Verkaufspreis</p>
                <p className="font-display text-4xl font-bold text-primary">{formatEuros(jersey.sale_price_cents)}</p>
              </div>
            ) : jersey.price_cents && (
              <div className="rounded-sm border border-border bg-secondary/50 p-6">
                <p className="text-sm text-muted-foreground mb-2">Schätzpreis</p>
                <p className="font-display text-4xl font-bold">{formatEuros(jersey.price_cents)}</p>
              </div>
            )}

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-sm border border-border p-4">
                <p className="text-xs text-muted-foreground mb-2">Größe</p>
                <p className="font-semibold text-lg">{jersey.size}</p>
              </div>
              <div className="rounded-sm border border-border p-4">
                <p className="text-xs text-muted-foreground mb-2">Zustand</p>
                <p className="font-semibold text-lg">{jersey.condition}/5</p>
                <p className="text-xs text-muted-foreground mt-1">{conditionLabels[jersey.condition]}</p>
              </div>
              <div className="rounded-sm border border-border p-4">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Alter
                </p>
                <p className="font-semibold text-lg">{age !== "—" ? `${age} Jahre` : "—"}</p>
              </div>
              <div className="rounded-sm border border-border p-4">
                <p className="text-xs text-muted-foreground mb-2">Vintage Faktor</p>
                <p className="font-semibold text-lg">{vintageBonus}x</p>
              </div>
            </div>

            {/* Owner Info */}
            <div className="rounded-sm border border-border p-6">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Verkäufer</p>
              <p
                className="font-semibold text-lg cursor-pointer hover:text-primary"
                onClick={() => navigate(`/seller/${jersey.user_id}`)}
              >
                {jersey.profiles?.display_name || jersey.profiles?.id || "Anonym"}
              </p>
              {jersey.profiles?.bio && (
                <p className="text-sm text-muted-foreground mt-2">{jersey.profiles.bio}</p>
              )}
            </div>

            {/* Verification Status */}
            <div className="rounded-sm border border-border p-4">
              <div className="flex items-center gap-2">
                {jersey.verification_status === "verified" ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">Verifiziert</p>
                      <p className="text-xs text-muted-foreground">Dieses Trikot wurde von unserem Team geprüft</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    <div>
                      <p className="text-sm font-semibold">Nicht verifiziert</p>
                      <p className="text-xs text-muted-foreground">Dieses Trikot wurde noch nicht geprüft</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Price History - Zuletzt verkauft */}
            {saleHistory.length > 0 && (
              <div className="rounded-sm border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-semibold uppercase tracking-wider">Zuletzt verkauft</p>
                </div>
                <div className="space-y-3">
                  {saleHistory.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="text-muted-foreground">
                          {sale.condition}/5 • {new Date(sale.sold_at).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {sale.price_cents ? (
                        <p className="font-semibold text-primary">{formatEuros(sale.price_cents)}</p>
                      ) : (
                        <p className="text-muted-foreground text-xs">Preis nicht angegeben</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-border">
              {isOwner ? (
                <Button variant="outline" className="w-full" onClick={() => navigate("/collection")}>
                  <Package className="mr-2 h-4 w-4" /> Sammlung bearbeiten
                </Button>
              ) : jersey.listing_type === "sold" ? (
                <div className="rounded-sm border border-border bg-secondary/50 p-4 text-center">
                  <Badge variant="secondary" className="font-display text-sm uppercase tracking-wider">
                    Bereits verkauft
                  </Badge>
                  <p className="mt-2 text-sm text-muted-foreground">Dieses Trikot wurde bereits verkauft.</p>
                </div>
              ) : (
                <>
                  {jersey.is_for_sale && jersey.sale_price_cents && (
                    <Button
                      variant="hero"
                      className="w-full uppercase tracking-wider"
                      onClick={handleKaufen}
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? "Wird geladen..." : `Sofort kaufen — ${formatEuros(jersey.sale_price_cents)}`}
                    </Button>
                  )}
                  {jersey.available_for_trade && (
                    <Button variant={jersey.sale_price_cents ? "outline" : "hero"} className="w-full uppercase tracking-wider" onClick={() => navigate("/trade")}>
                      Tausch vorschlagen
                    </Button>
                  )}
                  {!jersey.sale_price_cents && !jersey.available_for_trade && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Dieses Trikot ist derzeit nicht verfügbar
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default JerseyDetail;
