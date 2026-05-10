import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useFilterState } from "@/hooks/useFilterState";
import { filterJerseys, sortJerseys } from "@/utils/filterJerseys";
import { Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JerseyCard from "@/components/JerseyCard";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-jersey.jpg";


const categories = [
  { id: "all", label: "Alle" },
  { id: "bundesliga", label: "Bundesliga" },
  { id: "premier-league", label: "Premier League" },
  { id: "la-liga", label: "La Liga" },
  { id: "serie-a", label: "Serie A" },
  { id: "nationalteam", label: "Nationalteams" },
  { id: "klassiker", label: "Klassiker" },
  { id: "rarities", label: "Raritäten" },
];

const CATEGORY_TO_FILTERS: Record<string, Partial<{
  leagues: string[];
  eraPreset: string | null;
  priceMin: number | null;
}>> = {
  bundesliga: { leagues: ["bundesliga"] },
  "premier-league": { leagues: ["premier-league"] },
  "la-liga": { leagues: ["la-liga"] },
  "serie-a": { leagues: ["serie-a"] },
  nationalteam: { leagues: ["nationalteam"] },
  klassiker: { eraPreset: null, leagues: [] },
  rarities: { priceMin: 20000 },
};

const fetchJerseys = async () => {
  const { data, error } = await supabase
    .from("user_jerseys")
    .select("*")
    .in("listing_type", ["buy_now", "both"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

const Shop = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { filters, setFilters, updateFilter, resetFilters } = useFilterState();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { data: jerseys = [], isLoading, error } = useQuery({
    queryKey: ["shop-jerseys"],
    queryFn: fetchJerseys,
  });

  const currentCategory = (() => {
    if (filters.leagues.length === 1) return filters.leagues[0];
    if (filters.eraTo === 2009 && filters.leagues.length === 0) return "klassiker";
    if (filters.priceMin === 20000 && filters.leagues.length === 0) return "rarities";
    return "all";
  })();

  const filteredJerseys = filterJerseys(jerseys, filters);
  const sortedJerseys = sortJerseys(filteredJerseys, filters.sortBy);

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === "all") {
      resetFilters();
    } else {
      const cat = CATEGORY_TO_FILTERS[categoryId];
      if (!cat) return;
      setFilters({
        search: null,
        leagues: cat.leagues || [],
        sizes: [],
        conditions: [],
        priceMin: cat.priceMin ?? null,
        priceMax: null,
        eraFrom: null,
        eraTo: categoryId === "klassiker" ? 2009 : null,
        eraPreset: null,
        listingType: [],
        verified: false,
        sortBy: "newest",
      });
    }
  };

  const handleQuickBuy = async (jerseyId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { jersey_id: jerseyId, buyer_id: user.id },
      });
      if (error) throw error;
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Checkout konnte nicht gestartet werden", variant: "destructive" });
      setCheckoutLoading(false);
    }
  };

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
              <span className="font-display text-xs tracking-[0.2em] text-primary">MARKTPLATZ</span>
            </div>
            <h1 className="font-display text-4xl font-bold md:text-6xl">
              Trikot <span className="text-gradient">Marktplatz</span>
            </h1>
            <p className="mt-4 font-serif text-lg italic text-muted-foreground">
              Entdecke authentische Trikots von Sammlern für Sammler — jedes Stück verifiziert und mit Geschichte.
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Controls */}
      <section className="border-b border-border bg-secondary/50">
        <div className="container mx-auto px-4 py-6">
          {/* Search Input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Suche nach Team oder Trikot…"
              value={filters.search || ""}
              onChange={(e) => updateFilter("search", e.target.value || null)}
              className="w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={currentCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full text-xs uppercase tracking-wider transition-colors ${
                    currentCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {cat.label}
                </Button>
              ))}
             </div>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-3">
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter("sortBy", e.target.value)}
                className="rounded-sm border border-border bg-background px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground focus:border-primary focus:outline-none"
              >
                <option value="newest">Neueste</option>
                <option value="price-asc">Preis aufsteigend</option>
                <option value="price-desc">Preis absteigend</option>
                <option value="year-desc">Jahr (neueste)</option>
              </select>
              <div className="flex items-center gap-1 rounded-sm border border-border">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jersey Grid */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{sortedJerseys.length}</span> Trikots gefunden
            </p>
          </div>

          {isLoading ? (
            <div className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"}`}>
              {[...Array(8)].map((_, i) => (
                <JerseyCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="font-display text-xl text-muted-foreground">Fehler beim Laden der Trikots.</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"}`}>
              {sortedJerseys.map((jersey: any, index: number) => (
                <div
                  key={jersey.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
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
                    available_for_trade={jersey.available_for_trade}
                    listing_type={jersey.listing_type}
                    user_id={jersey.user_id}
                    sale_price_cents={jersey.sale_price_cents}
                    onQuickBuy={() => handleQuickBuy(jersey.id)}
                    onClick={() => navigate(`/jersey/${jersey.id}`)}
                  />
                </div>
              ))}
            </div>
          )}

          {!isLoading && sortedJerseys.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-display text-xl text-muted-foreground">Noch keine Trikots gefunden. Sei der Erste!</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-primary/30"
                onClick={() => navigate("/collection")}
              >
                Trikot hinzufügen
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Shop;
