import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useFilterState } from "@/hooks/useFilterState";
import { filterJerseys, sortJerseys } from "@/utils/filterJerseys";
import { Grid3X3, List, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import { useSiteContent } from "@/hooks/useSiteContent";
import TrustBanner from "@/components/TrustBanner";
import JerseyCard from "@/components/JerseyCard";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getPrimaryImage } from "@/utils/jerseyImage";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { FilterDrawer } from "@/components/filters/FilterDrawer";
import { ActiveFilterChips } from "@/components/filters/ActiveFilterChips";
import { startCheckout } from "@/lib/checkout";
import { FEATURES } from "@/config/features";

const fetchJerseys = async () => {
  const { data, error } = await supabase
    .from("user_jerseys")
    .select("*")
    // „Nur Tausch“ nur, solange der Tausch eingeschaltet ist (src/config/features.ts)
    .in("listing_type", FEATURES.trade ? ["buy_now", "both", "trade_only"] : ["buy_now", "both"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

const Shop = () => {
  const page = useSiteContent("shop");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    filters,
    setFilters,
    activeFilterCount,
    resetFilters,
  } = useFilterState();

  const { data: jerseys = [], isLoading, error } = useQuery({
    queryKey: ["shop-jerseys"],
    queryFn: fetchJerseys,
  });

  const filteredJerseys = filterJerseys(jerseys, filters);
  const sortedJerseys = sortJerseys(filteredJerseys, filters.sortBy);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Seitenkopf: schwarzes Band (Hell/Dunkel-Rhythmus, Skill cc-design §5.1) */}
      <PageHeader
        tone="nero"
        eyebrow={page.header.eyebrow}
        headline={page.header.headline}
        subline={page.header.subline}
      />

      {/* Main Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-10">
          <div className="flex gap-8 lg:gap-10">
            {/* Desktop Filter Sidebar */}
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              className="sticky top-36 hidden self-start md:block"
            />

            <div className="flex-1 min-w-0">
              {/* Werkzeugleiste: Suche · Sortierung · Filter (mobil) · Ansicht */}
              <div className="mb-4 flex flex-wrap items-stretch gap-2 md:gap-3">
                <input
                  type="text"
                  placeholder="Suche nach Team oder Trikot …"
                  aria-label="Trikots durchsuchen"
                  value={filters.search || ""}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value || null })}
                  className="h-11 min-w-0 flex-[1_1_100%] border border-nero bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:flex-[1_1_240px] md:text-sm"
                />

                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  aria-label="Sortierung"
                  className="cap h-11 flex-1 border border-nero bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:flex-none"
                >
                  <option value="newest">Neueste</option>
                  <option value="price-asc">Preis aufsteigend</option>
                  <option value="price-desc">Preis absteigend</option>
                  <option value="year-desc">Jahr (neueste)</option>
                </select>

                {/* Filter-Button (mobil) */}
                <Button variant="outline" className="h-11 md:hidden" onClick={() => setDrawerOpen(true)}>
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="num ml-1 inline-flex h-5 min-w-5 items-center justify-center bg-nero px-1 text-xs text-avorio">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>

                {/* Ansicht: Raster / Liste */}
                <div className="flex border border-nero" role="group" aria-label="Ansicht">
                  <button
                    type="button"
                    aria-label="Rasteransicht"
                    aria-pressed={viewMode === "grid"}
                    className={`flex h-11 w-11 items-center justify-center ${viewMode === "grid" ? "bg-nero text-avorio" : "bg-card"}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Listenansicht"
                    aria-pressed={viewMode === "list"}
                    className={`flex h-11 w-11 items-center justify-center border-l border-nero ${viewMode === "list" ? "bg-nero text-avorio" : "bg-card"}`}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Aktive Filter */}
              <ActiveFilterChips filters={filters} onChange={setFilters} className="mb-4" />

              {/* Trefferzahl */}
              <div className="cap mb-5 border-b border-nero pb-3 text-[11px] text-muted-foreground">
                <span className="num mr-1 text-base text-nero">{sortedJerseys.length}</span> Trikots gefunden
              </div>

              {/* Trikots */}
              {isLoading ? (
                <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2.5 md:gap-6 xl:grid-cols-3 2xl:grid-cols-4" : "grid gap-3"}>
                  {[...Array(8)].map((_, i) => (
                    <JerseyCardSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <div className="border-2 border-nero bg-card px-6 py-12 text-center">
                  <p className="font-display text-lg font-semibold">Fehler beim Laden der Trikots.</p>
                </div>
              ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2.5 md:gap-6 xl:grid-cols-3 2xl:grid-cols-4" : "grid gap-3"}>
                  {sortedJerseys.map((jersey: any) => (
                    <JerseyCard
                      key={jersey.id}
                      layout={viewMode === "list" ? "row" : "card"}
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
                      available_for_trade={jersey.available_for_trade}
                      listing_type={jersey.listing_type}
                      user_id={jersey.user_id}
                      sale_price_cents={jersey.sale_price_cents}
                      onQuickBuy={() => handleQuickBuy(jersey.id)}
                      onClick={() => navigate(`/jersey/${jersey.id}`)}
                    />
                  ))}
                </div>
              )}

              {!isLoading && sortedJerseys.length === 0 && (
                <div className="border-2 border-nero bg-card px-6 py-12 text-center">
                  <p className="display text-[28px] md:text-[40px]">
                    Nichts <span className="hollow-dark">gefunden.</span>
                  </p>
                  <p className="mt-3 text-muted-foreground">Keine Trikots zu diesen Filtern — oder stell dein eigenes ein.</p>
                  <Button variant="outline" className="mt-5" onClick={() => navigate("/collection")}>
                    Trikot hinzufügen
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        filters={filters}
        onChange={setFilters}
      />

      <TrustBanner />

      <Footer />
    </div>
  );
};

export default Shop;
