import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JerseyCard from "@/components/JerseyCard";
import JerseyDetailSheet from "@/components/JerseyDetailSheet";
import CategoryFilter from "@/components/CategoryFilter";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { centsToEuros, formatEuros } from "@/utils/currency";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(searchParams.get("cat") || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJersey, setSelectedJersey] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: jerseys = [], isLoading, error } = useQuery({
    queryKey: ["shop-jerseys"],
    queryFn: fetchJerseys,
  });

  const filteredJerseys = jerseys.filter((jersey: any) => {
    let categoryMatch = true;
    if (activeCategory !== "all") {
      if (activeCategory === "klassiker") {
        const year = parseInt(jersey.year, 10);
        categoryMatch = !Number.isNaN(year) && year < 2010;
      } else if (activeCategory === "rarities") {
        categoryMatch = (jersey.price_cents || 0) > 20000;
      } else {
        categoryMatch = jersey.league?.toLowerCase().includes(activeCategory.toLowerCase()) ||
                       jersey.league?.toLowerCase().replace(" ", "-") === activeCategory;
      }
    }

    let searchMatch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      searchMatch = jersey.name?.toLowerCase().includes(query) ||
                    jersey.team?.toLowerCase().includes(query);
    }

    return categoryMatch && searchMatch;
  });

  const sortedJerseys = [...filteredJerseys].sort((a: any, b: any) => {
    if (sortBy === "price-asc") return (a.price_cents || 0) - (b.price_cents || 0);
    if (sortBy === "price-desc") return (b.price_cents || 0) - (a.price_cents || 0);
    if (sortBy === "year-desc") {
      const aYear = parseInt(a.year, 10) || 0;
      const bYear = parseInt(b.year, 10) || 0;
      return bYear - aYear;
    }
    return 0;
  });

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    if (categoryId === "all") {
      searchParams.delete("cat");
    } else {
      searchParams.set("cat", categoryId);
    }
    setSearchParams(searchParams);
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full text-xs uppercase tracking-wider transition-colors ${
                    activeCategory === cat.id
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
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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
                    onClick={() => {
                      setSelectedJersey(jersey);
                      setIsDetailOpen(true);
                    }}
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

      <JerseyDetailSheet
        jersey={selectedJersey}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      <Footer />
    </div>
  );
};

export default Shop;
