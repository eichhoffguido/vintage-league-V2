import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JerseyCard from "@/components/JerseyCard";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-jersey.jpg";

const fetchFavoriteJerseys = async (favoriteIds: string[]) => {
  if (favoriteIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_jerseys")
    .select("*")
    .in("id", favoriteIds)
    .eq("available_for_trade", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

const Watchlist = () => {
  const { user } = useAuth();
  const { favorites } = useWatchlist();

  const { data: favoriteJerseys = [], isLoading } = useQuery({
    queryKey: ["favorite-jerseys", favorites],
    queryFn: () => fetchFavoriteJerseys(favorites),
    enabled: !!user && favorites.length > 0,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="mb-4 flex items-center justify-center">
              <Heart className="h-12 w-12 text-primary" />
            </div>
            <h1 className="font-display text-4xl font-bold">Beobachtungsliste</h1>
            <p className="mt-4 text-muted-foreground">Melde dich an, um deine Lieblings-Trikots zu speichern</p>
            <Button variant="hero" size="lg" className="mt-6" asChild>
              <Link to="/auth">Jetzt anmelden</Link>
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

      {/* Hero Banner */}
      <section className="grain relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px w-6 bg-primary/50" />
              <span className="font-display text-xs tracking-[0.2em] text-primary">MEINE SAMMLUNG</span>
            </div>
            <h1 className="font-display text-4xl font-bold md:text-6xl">
              Deine <span className="text-gradient">Beobachtungsliste</span>
            </h1>
            <p className="mt-4 font-serif text-lg italic text-muted-foreground">
              Speichere Trikots, die dir gefallen, und behalte ihre Preise im Auge.
            </p>
          </div>
        </div>
      </section>

      {/* Watchlist Grid */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <JerseyCardSkeleton />
                </div>
              ))}
            </div>
          ) : favoriteJerseys.length === 0 ? (
            <div className="py-16 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-display text-xl text-muted-foreground">Keine Trikots in deiner Beobachtungsliste</p>
              <p className="text-sm text-muted-foreground mt-2">
                Klicke auf das Herz-Icon auf Trikot-Karten, um sie zu deiner Beobachtungsliste hinzuzufügen.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-primary/30"
                asChild
              >
                <Link to="/trade">Zum Marktplatz</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{favoriteJerseys.length}</span> Trikots in deiner Beobachtungsliste
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                      imageUrl={jersey.image_url}
                      verified={jersey.verification_status === "verified"}
                      condition={jersey.condition as 1 | 2 | 3 | 4 | 5}
                      size={jersey.size}
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
