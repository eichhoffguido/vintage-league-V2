import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatEuros } from "@/utils/currency";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertCircle, Shirt } from "lucide-react";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";

const conditionLabels: Record<number, string> = {
  5: "Neuwertig",
  4: "Sehr gut",
  3: "Gut erhalten",
  2: "Gebraucht",
  1: "Sammlerstück",
};

const Shop = () => {
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("cat");
  const [selectedJersey, setSelectedJersey] = useState<any>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const { data: jerseys = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["shop-jerseys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_jerseys")
        .select(`
          *,
          profiles!user_jerseys_user_id_fkey(display_name)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Filter by category if selected
  const filteredJerseys = useMemo(() => {
    if (!selectedCategory) return jerseys;
    return jerseys.filter((jersey) =>
      jersey.league?.toLowerCase() === selectedCategory
    );
  }, [jerseys, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-5xl font-bold md:text-7xl">Marketplace</h1>
          <p className="mt-1 text-muted-foreground">
            {filteredJerseys.length} Trikots verfügbar
            {selectedCategory && ` in ${selectedCategory}`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <JerseyCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-sm border border-dashed border-border p-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive/30" />
            <p className="font-display text-xl text-muted-foreground">Fehler beim Laden des Marketplace</p>
            <p className="mt-2 text-sm text-muted-foreground">{error instanceof Error ? error.message : "Bitte versuche es später erneut"}</p>
            <Button
              variant="hero"
              className="mt-4 uppercase tracking-wider"
              onClick={() => refetch()}
            >
              Erneut versuchen
            </Button>
          </div>
        ) : filteredJerseys.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-12 text-center">
            <Shirt className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-display text-xl text-muted-foreground">
              {selectedCategory ? "Keine Trikots in dieser Kategorie" : "Keine Trikots verfügbar"}
            </p>
            {selectedCategory && (
              <Button
                variant="hero"
                className="mt-4 uppercase tracking-wider"
                onClick={() => window.location.href = "/shop"}
              >
                Alle Trikots anzeigen
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredJerseys.map((jersey) => (
              <div
                key={jersey.id}
                className="overflow-hidden rounded-sm border border-border bg-card cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => {
                  setSelectedJersey(jersey);
                  setDetailSheetOpen(true);
                }}
              >
                {jersey.image_url ? (
                  <div className="aspect-square overflow-hidden bg-secondary">
                    <img src={jersey.image_url} alt={jersey.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-secondary">
                    <span className="font-display text-4xl text-muted-foreground/30">{jersey.team.charAt(0)}</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{jersey.league} · {jersey.year}</p>
                      <h3 className="font-display text-xl font-semibold">{jersey.team}</h3>
                      <p className="text-sm text-muted-foreground">{jersey.name}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{jersey.condition}/5 · {conditionLabels[jersey.condition]}</span>
                    {jersey.price_cents && <span className="font-semibold text-foreground">{formatEuros(jersey.price_cents)}</span>}
                  </div>
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">
                      Von: <span className="font-semibold text-foreground">{(jersey.profiles as any)?.display_name || "Anonym"}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Jersey Detail Sheet */}
        <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
            {selectedJersey && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-display text-2xl">{selectedJersey.team}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Jersey Image */}
                  {selectedJersey.image_url ? (
                    <div className="aspect-square overflow-hidden rounded-sm bg-secondary">
                      <img src={selectedJersey.image_url} alt={selectedJersey.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center rounded-sm bg-secondary">
                      <span className="font-display text-6xl text-muted-foreground/30">{selectedJersey.team.charAt(0)}</span>
                    </div>
                  )}

                  {/* Jersey Info */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-semibold">{selectedJersey.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Liga</p>
                      <p className="font-semibold">{selectedJersey.league || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Jahr</p>
                      <p className="font-semibold">{selectedJersey.year || "—"}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Größe</p>
                        <p className="font-semibold">{selectedJersey.size}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Zustand</p>
                        <p className="font-semibold">{selectedJersey.condition}/5</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Preis</p>
                        <p className="font-semibold">{selectedJersey.price_cents ? formatEuros(selectedJersey.price_cents) : "—"}</p>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground">Verkäufer</p>
                      <p className="font-semibold">{(selectedJersey.profiles as any)?.display_name || "Anonym"}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 border-t border-border pt-6">
                    <Button variant="hero" className="w-full uppercase tracking-wider">
                      Kontaktieren
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
      <Footer />
    </div>
  );
};

export default Shop;
