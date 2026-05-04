import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JerseyCard from "@/components/JerseyCard";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-jersey.jpg";

// Mock data for jerseys (same as in Shop.tsx for now)
const allJerseys = [
  {
    id: "shop-1",
    name: "Heimtrikot 2024/25",
    team: "Real Madrid",
    league: "La Liga",
    year: "2024",
    price_cents: 8900,
    lowestAsk: 8500,
    highestBid: 7800,
    imageUrl: new URL("@/assets/jersey-1.jpg", import.meta.url).href,
    verified: true,
    condition: 5 as const,
    size: "L",
  },
  {
    id: "shop-2",
    name: "Heimtrikot 2024/25",
    team: "FC Barcelona",
    league: "La Liga",
    year: "2024",
    price_cents: 9500,
    lowestAsk: 9000,
    highestBid: 8200,
    imageUrl: new URL("@/assets/jersey-2.jpg", import.meta.url).href,
    verified: true,
    condition: 5 as const,
    size: "M",
  },
  {
    id: "shop-3",
    name: "Heimtrikot 2024/25",
    team: "FC Bayern München",
    league: "Bundesliga",
    year: "2024",
    price_cents: 7900,
    highestBid: 7200,
    imageUrl: new URL("@/assets/jersey-3.jpg", import.meta.url).href,
    verified: true,
    condition: 4 as const,
    size: "XL",
  },
  {
    id: "shop-4",
    name: "Heimtrikot 2019/20",
    team: "Manchester United",
    league: "Premier League",
    year: "2019",
    price_cents: 12000,
    lowestAsk: 11500,
    highestBid: 10500,
    imageUrl: new URL("@/assets/jersey-4.jpg", import.meta.url).href,
    verified: false,
    condition: 3 as const,
    size: "M",
  },
  {
    id: "shop-5",
    name: "Retro Heimtrikot 1995/96",
    team: "AC Milan",
    league: "Serie A",
    year: "1995",
    price_cents: 25000,
    lowestAsk: 24000,
    highestBid: 22000,
    imageUrl: new URL("@/assets/jersey-5.jpg", import.meta.url).href,
    verified: true,
    condition: 3 as const,
    size: "L",
  },
  {
    id: "shop-6",
    name: "Heimtrikot 2024/25",
    team: "Borussia Dortmund",
    league: "Bundesliga",
    year: "2024",
    price_cents: 7500,
    lowestAsk: 7000,
    imageUrl: new URL("@/assets/jersey-6.jpg", import.meta.url).href,
    verified: true,
    condition: 5 as const,
    size: "S",
  },
  {
    id: "shop-7",
    name: "Klassik Trikot 2002",
    team: "Brasilien",
    league: "Nationalteam",
    year: "2002",
    price_cents: 18000,
    highestBid: 16500,
    imageUrl: new URL("@/assets/jersey-7.jpg", import.meta.url).href,
    verified: true,
    condition: 4 as const,
    size: "M",
  },
  {
    id: "shop-8",
    name: "Heimtrikot 2024/25",
    team: "Inter Mailand",
    league: "Serie A",
    year: "2024",
    price_cents: 8500,
    lowestAsk: 8000,
    highestBid: 7500,
    imageUrl: new URL("@/assets/jersey-8.jpg", import.meta.url).href,
    verified: false,
    condition: 5 as const,
    size: "L",
  },
  {
    id: "shop-9",
    name: "Auswärtstrikot 2023/24",
    team: "Arsenal FC",
    league: "Premier League",
    year: "2023",
    price_cents: 11000,
    lowestAsk: 10500,
    highestBid: 8800,
    imageUrl: new URL("@/assets/jersey-1.jpg", import.meta.url).href,
    verified: true,
    condition: 5 as const,
    size: "M",
  },
  {
    id: "shop-10",
    name: "Heimtrikot 2022/23",
    team: "Juventus Turin",
    league: "Serie A",
    year: "2022",
    price_cents: 9500,
    highestBid: 8800,
    imageUrl: new URL("@/assets/jersey-2.jpg", import.meta.url).href,
    verified: true,
    condition: 4 as const,
    size: "L",
  },
  {
    id: "shop-11",
    name: "Retro Trikot 1986",
    team: "Argentinien",
    league: "Nationalteam",
    year: "1986",
    price_cents: 32000,
    lowestAsk: 31000,
    imageUrl: new URL("@/assets/jersey-3.jpg", import.meta.url).href,
    verified: true,
    condition: 3 as const,
    size: "XL",
  },
  {
    id: "shop-12",
    name: "Heimtrikot 2024/25",
    team: "Paris Saint-Germain",
    league: "Ligue 1",
    year: "2024",
    price_cents: 8800,
    lowestAsk: 8200,
    highestBid: 7600,
    imageUrl: new URL("@/assets/jersey-4.jpg", import.meta.url).href,
    verified: true,
    condition: 5 as const,
    size: "S",
  },
];

const Watchlist = () => {
  const { user } = useAuth();
  const { favorites, loading } = useWatchlist();
  const [favoriteJerseys, setFavoriteJerseys] = useState<typeof allJerseys>([]);

  useEffect(() => {
    const filtered = allJerseys.filter((jersey) => favorites.includes(jersey.id));
    setFavoriteJerseys(filtered);
  }, [favorites]);

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
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Laden...</p>
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
                <Link to="/shop">Zum Marktplatz</Link>
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
                {favoriteJerseys.map((jersey, index) => (
                  <div
                    key={jersey.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <JerseyCard {...jersey} />
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
