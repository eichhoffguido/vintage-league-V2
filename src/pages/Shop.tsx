import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JerseyCard from "@/components/JerseyCard";
import CategoryFilter from "@/components/CategoryFilter";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";
import heroImage from "@/assets/hero-jersey.jpg";
import jersey1 from "@/assets/jersey-1.jpg";
import jersey2 from "@/assets/jersey-2.jpg";
import jersey3 from "@/assets/jersey-3.jpg";
import jersey4 from "@/assets/jersey-4.jpg";
import jersey5 from "@/assets/jersey-5.jpg";
import jersey6 from "@/assets/jersey-6.jpg";
import jersey7 from "@/assets/jersey-7.jpg";
import jersey8 from "@/assets/jersey-8.jpg";

const allJerseys = [
  {
    name: "Heimtrikot 2024/25",
    team: "Real Madrid",
    league: "La Liga",
    year: "2024",
    price: 89,
    lowestAsk: 85,
    highestBid: 78,
    imageUrl: jersey1,
    verified: true,
    condition: 5,
    size: "L",
  },
  {
    name: "Heimtrikot 2024/25",
    team: "FC Barcelona",
    league: "La Liga",
    year: "2024",
    price: 95,
    lowestAsk: 90,
    highestBid: 82,
    imageUrl: jersey2,
    verified: true,
    condition: 5,
    size: "M",
  },
  {
    name: "Heimtrikot 2024/25",
    team: "FC Bayern München",
    league: "Bundesliga",
    year: "2024",
    price: 79,
    highestBid: 72,
    imageUrl: jersey3,
    verified: true,
    condition: 4,
    size: "XL",
  },
  {
    name: "Heimtrikot 2019/20",
    team: "Manchester United",
    league: "Premier League",
    year: "2019",
    price: 120,
    lowestAsk: 115,
    highestBid: 105,
    imageUrl: jersey4,
    verified: false,
    condition: 3,
    size: "M",
  },
  {
    name: "Retro Heimtrikot 1995/96",
    team: "AC Milan",
    league: "Serie A",
    year: "1995",
    price: 250,
    lowestAsk: 240,
    highestBid: 220,
    imageUrl: jersey5,
    verified: true,
    condition: 3,
    size: "L",
  },
  {
    name: "Heimtrikot 2024/25",
    team: "Borussia Dortmund",
    league: "Bundesliga",
    year: "2024",
    price: 75,
    lowestAsk: 70,
    imageUrl: jersey6,
    verified: true,
    condition: 5,
    size: "S",
  },
  {
    name: "Klassik Trikot 2002",
    team: "Brasilien",
    league: "Nationalteam",
    year: "2002",
    price: 180,
    highestBid: 165,
    imageUrl: jersey7,
    verified: true,
    condition: 4,
    size: "M",
  },
  {
    name: "Heimtrikot 2024/25",
    team: "Inter Mailand",
    league: "Serie A",
    year: "2024",
    price: 85,
    lowestAsk: 80,
    highestBid: 75,
    imageUrl: jersey8,
    verified: false,
    condition: 5,
    size: "L",
  },
  {
    name: "Auswärtstrikot 2023/24",
    team: "Arsenal FC",
    league: "Premier League",
    year: "2023",
    price: 110,
    lowestAsk: 105,
    imageUrl: jersey1,
    verified: true,
    condition: 5,
    size: "M",
  },
  {
    name: "Heimtrikot 2022/23",
    team: "Juventus Turin",
    league: "Serie A",
    year: "2022",
    price: 95,
    highestBid: 88,
    imageUrl: jersey2,
    verified: true,
    condition: 4,
    size: "L",
  },
  {
    name: "Retro Trikot 1986",
    team: "Argentinien",
    league: "Nationalteam",
    year: "1986",
    price: 320,
    lowestAsk: 310,
    imageUrl: jersey3,
    verified: true,
    condition: 3,
    size: "XL",
  },
  {
    name: "Heimtrikot 2024/25",
    team: "Paris Saint-Germain",
    league: "Ligue 1",
    year: "2024",
    price: 88,
    lowestAsk: 82,
    highestBid: 76,
    imageUrl: jersey4,
    verified: true,
    condition: 5,
    size: "S",
  },
];

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

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(searchParams.get("cat") || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const cat = searchParams.get("cat");
    if (cat) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [activeCategory, sortBy, searchQuery]);

  const filteredJerseys = allJerseys.filter((jersey) => {
    // Filter by category
    let categoryMatch = true;
    if (activeCategory !== "all") {
      if (activeCategory === "klassiker") {
        categoryMatch = parseInt(jersey.year) < 2010;
      } else if (activeCategory === "rarities") {
        categoryMatch = jersey.price > 200;
      } else {
        categoryMatch = jersey.league.toLowerCase().includes(activeCategory.toLowerCase()) ||
                       jersey.league.toLowerCase().replace(" ", "-") === activeCategory;
      }
    }

    // Filter by search query (name or team, case-insensitive)
    let searchMatch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      searchMatch = jersey.name.toLowerCase().includes(query) ||
                    jersey.team.toLowerCase().includes(query);
    }

    return categoryMatch && searchMatch;
  });

  const sortedJerseys = [...filteredJerseys].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "year-desc") return parseInt(b.year) - parseInt(a.year);
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

          {loading ? (
            <div className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"}`}>
              {[...Array(8)].map((_, i) => (
                <JerseyCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"}`}>
              {sortedJerseys.map((jersey, index) => (
                <div
                  key={index}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <JerseyCard {...jersey} condition={jersey.condition as 1 | 2 | 3 | 4 | 5} />
                </div>
              ))}
            </div>
          )}

          {sortedJerseys.length === 0 && !loading && (
            <div className="py-16 text-center">
              <p className="font-display text-xl text-muted-foreground">Keine Trikots in dieser Kategorie gefunden.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-primary/30"
                onClick={() => handleCategoryChange("all")}
              >
                Alle anzeigen
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
