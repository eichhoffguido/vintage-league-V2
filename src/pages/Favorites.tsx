import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import JerseyCard from "@/components/JerseyCard";
import { useEffect } from "react";

const Favorites = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { favoriteJerseys, isFavorited, toggleFavorite, isFavoritesLoading } = useFavorites();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  if (authLoading || isFavoritesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <EmailVerificationBanner />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Wird geladen...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <EmailVerificationBanner />
      <div className="container mx-auto px-4 py-12">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>

        <div className="mb-8">
          <h1 className="font-display text-5xl font-bold md:text-7xl">Meine Favoriten</h1>
          <p className="mt-2 text-muted-foreground">
            {favoriteJerseys.length} Trikot{favoriteJerseys.length !== 1 ? "s" : ""}
          </p>
        </div>

        {favoriteJerseys.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-12 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-display text-xl text-muted-foreground">
              Noch keine Favoriten gespeichert
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Durchstöbere den Shop und speichere deine Lieblings-Trikots.
            </p>
            <Button
              variant="hero"
              className="mt-4 uppercase tracking-wider"
              onClick={() => navigate("/shop")}
            >
              Zum Shop
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteJerseys.map((jersey) => (
              <JerseyCard
                key={jersey.id}
                id={jersey.id}
                name={jersey.name}
                team={jersey.team}
                league={jersey.league}
                year={jersey.year}
                price_cents={jersey.price_cents}
                imageUrl={jersey.image_url || ""}
                condition={jersey.condition as 1 | 2 | 3 | 4 | 5}
                size={jersey.size}
                isFavorited={isFavorited(jersey.id)}
                onFavoriteToggle={toggleFavorite.mutate}
                onClick={() => navigate(`/jersey/${jersey.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Favorites;
