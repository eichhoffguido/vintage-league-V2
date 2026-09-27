import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import { useSiteContent } from "@/hooks/useSiteContent";
import JerseyCard from "@/components/JerseyCard";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getPrimaryImage } from "@/utils/jerseyImage";
import { startCheckout } from "@/lib/checkout";

const fetchFavoriteJerseys = async (favoriteIds: string[]) => {
  if (favoriteIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_jerseys")
    .select("*")
    .in("id", favoriteIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

const Watchlist = () => {
  const page = useSiteContent("watchlist");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { favoriteIds: favorites } = useFavorites();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { data: favoriteJerseys = [], isLoading } = useQuery({
    queryKey: ["favorite-jerseys", favorites],
    queryFn: () => fetchFavoriteJerseys(favorites),
    enabled: !!user && favorites.length > 0,
  });

  const handleQuickBuy = async (jerseyId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCheckoutLoading(true);
    try {
      await startCheckout({ jersey_id: jerseyId });
    } catch (err) {
      toast({ title: "Kauf nicht möglich", description: err instanceof Error ? err.message : "Checkout konnte nicht gestartet werden.", variant: "destructive" });
      setCheckoutLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="mb-4 flex items-center justify-center">
              <Heart className="h-12 w-12 text-verde" />
            </div>
            <h1 className="display text-[40px] md:text-[64px]">Deine <span className="hollow-dark">Merkliste.</span></h1>
            <p className="mt-4 text-muted-foreground">Melde dich an, um deine Lieblings-Trikots zu speichern</p>
            <Button size="lg" className="mt-6" asChild>
              <Link to="/auth">Jetzt anmelden →</Link>
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Persönlicher Bereich → grünes Kopfband (Skill cc-design §5.1) */}
      <PageHeader
        tone="verde"
        eyebrow={page.header.eyebrow}
        headline={page.header.headline}
        subline={page.header.subline}
      />

      {/* Watchlist Grid */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-10">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2.5 md:gap-6 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <JerseyCardSkeleton />
                </div>
              ))}
            </div>
          ) : favoriteJerseys.length === 0 ? (
            <div className="border-2 border-nero bg-card px-6 py-12 text-center">
              <Heart className="mx-auto mb-4 h-10 w-10" />
              <p className="font-display text-lg font-semibold">Noch keine Trikots auf deiner Merkliste</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tippe auf das Herz einer Trikot-Karte, um sie hier zu sammeln.
              </p>
              <Button variant="outline" className="mt-5" asChild>
                <Link to="/shop">Zum Marktplatz →</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="cap mb-5 border-b border-nero pb-3 text-[11px] text-muted-foreground">
                <span className="num mr-1 text-base text-nero">{favoriteJerseys.length}</span> Trikots auf deiner Merkliste
              </div>
              <div className="grid grid-cols-2 gap-2.5 md:gap-6 lg:grid-cols-4">
                {favoriteJerseys.map((jersey: any, index) => (
                  <div
                    key={jersey.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <JerseyCard
                      id={jersey.id}
                      name={jersey.name}
                      team={jersey.team}
                      league={jersey.league}
                      year={jersey.year}
                      price_cents={jersey.price_cents}
                      imageUrl={getPrimaryImage(jersey) ?? undefined}
                      verification_status={jersey.verification_status}
                      condition={jersey.condition as 1 | 2 | 3 | 4 | 5}
                      size={jersey.size}
                      user_id={jersey.user_id}
                      sale_price_cents={jersey.sale_price_cents}
                      listing_type={jersey.listing_type}
                      onQuickBuy={() => handleQuickBuy(jersey.id)}
                      onClick={() => navigate(`/jersey/${jersey.id}`)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Watchlist;
