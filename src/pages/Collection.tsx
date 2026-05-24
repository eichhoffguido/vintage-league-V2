import { useState } from "react";
import { eurosToCents, formatEuros } from "@/utils/currency";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { calculatePriceIntelligence } from "@/utils/priceIntelligence";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import PriceIntelligence from "@/components/PriceIntelligence";
import MultiImageUpload from "@/components/MultiImageUpload";
import { Autocomplete } from "@/components/Autocomplete";
import { COMMON_TEAMS, COMMON_LEAGUES } from "@/data/teams-leagues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeftRight, Upload, X, Shirt, AlertCircle, ShieldCheck, Clock, XCircle } from "lucide-react";
import { useEffect } from "react";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";

const conditionLabels: Record<number, string> = {
  5: "Neuwertig",
  4: "Sehr gut",
  3: "Gut erhalten",
  2: "Gebraucht",
  1: "Sammlerstück",
};

const Collection = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedJersey, setSelectedJersey] = useState<any>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [debouncedPrice, setDebouncedPrice] = useState("");
  const [form, setForm] = useState({
    name: "", team: "", league: "", year: "", condition: "3", size: "M",
    price_cents: "", available_for_trade: false,
    listingType: "trade" as "trade" | "sell" | "both",
    description: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // Debounce price changes for PriceIntelligence preview (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPrice(form.price_cents);
    }, 500);
    return () => clearTimeout(timer);
  }, [form.price_cents]);

  const { data: jerseys = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-jerseys", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_jerseys")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addJersey = useMutation({
    mutationFn: async () => {
      const isForSale = form.listingType === "sell" || form.listingType === "both";
      const availableForTrade = form.listingType === "trade" || form.listingType === "both";
      const salePriceCents = isForSale ? eurosToCents(form.price_cents) : null;

      // Map listingType to database listing_type enum
      const listingTypeMap: Record<"trade" | "sell" | "both", "trade_only" | "buy_now" | "both"> = {
        trade: "trade_only",
        sell: "buy_now",
        both: "both",
      };

      const { error } = await supabase.from("user_jerseys").insert({
        user_id: user!.id,
        name: form.name.trim(),
        team: form.team.trim(),
        league: form.league.trim(),
        year: form.year.trim(),
        condition: parseInt(form.condition),
        size: form.size,
        image_urls: imageUrls.length > 0 ? imageUrls : [],
        price_cents: eurosToCents(form.price_cents),
        available_for_trade: availableForTrade,
        sale_price_cents: salePriceCents,
        listing_type: listingTypeMap[form.listingType],
        description: form.description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jerseys"] });
      setDialogOpen(false);
      setForm({ name: "", team: "", league: "", year: "", condition: "3", size: "M", price_cents: "", available_for_trade: false, listingType: "trade", description: "" });
      setImageUrls([]);
      toast.success("Trikot hinzugefügt!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateJersey = useMutation({
    mutationFn: async (jersey: any) => {
      const { error } = await supabase
        .from("user_jerseys")
        .update({
          name: jersey.name.trim(),
          team: jersey.team.trim(),
          league: jersey.league.trim(),
          year: jersey.year.trim(),
          condition: parseInt(jersey.condition),
          size: jersey.size,
          image_urls: editImageUrls.length > 0 ? editImageUrls : [],
          price_cents: eurosToCents(jersey.price_cents),
          description: jersey.description ? jersey.description.trim() : null,
        })
        .eq("id", jersey.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jerseys"] });
      setDetailSheetOpen(false);
      setSelectedJersey(null);
      setEditImageUrls([]);
      toast.success("Trikot aktualisiert");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteJersey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_jerseys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jerseys"] });
      toast.success("Trikot entfernt");
    },
  });

  const toggleTrade = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      // Fetch current jersey to check sale_price_cents
      const { data: jersey, error: fetchError } = await supabase
        .from("user_jerseys")
        .select("sale_price_cents, listing_type")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Update listing_type based on trade availability and sale status
      let newListingType: "trade_only" | "buy_now" | "both" = jersey.listing_type;
      if (available) {
        // If toggling to available for trade:
        // - If has sale price, listing_type should be "both"
        // - If no sale price, listing_type should be "trade_only"
        newListingType = jersey.sale_price_cents ? "both" : "trade_only";
      } else {
        // If toggling to unavailable for trade:
        // - If has sale price, listing_type should be "buy_now"
        // - If no sale price, keep as "trade_only"
        newListingType = jersey.sale_price_cents ? "buy_now" : "trade_only";
      }

      const { error } = await supabase
        .from("user_jerseys")
        .update({ available_for_trade: available, listing_type: newListingType })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jerseys"] });
      toast.success("Trikot ist jetzt zum Tausch verfügbar!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSalePrice = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: string }) => {
      const priceCents = price ? eurosToCents(price) : null;

      // Fetch current jersey to check available_for_trade
      const { data: jersey, error: fetchError } = await supabase
        .from("user_jerseys")
        .select("available_for_trade")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Update listing_type based on sale price and trade availability
      let newListingType: "trade_only" | "buy_now" | "both" = "trade_only";
      if (priceCents !== null && jersey.available_for_trade) {
        newListingType = "both";
      } else if (priceCents !== null && !jersey.available_for_trade) {
        newListingType = "buy_now";
      } else if (priceCents === null && jersey.available_for_trade) {
        newListingType = "trade_only";
      } else {
        // priceCents === null && !available_for_trade
        newListingType = "trade_only";
      }

      const { error } = await supabase
        .from("user_jerseys")
        .update({ sale_price_cents: priceCents, listing_type: newListingType })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jerseys"] });
      setSaleModalOpen(false);
      setSalePrice("");
      toast.success("Trikot zum Verkauf angeboten!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <EmailVerificationBanner />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-5xl font-bold md:text-7xl">Meine Sammlung</h1>
            <p className="mt-1 text-muted-foreground">{jerseys.length} Trikots in deiner Sammlung</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setImageUrls([]);
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="hero" className="uppercase tracking-wider">
                <Plus className="mr-2 h-4 w-4" /> Trikot hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Neues Trikot</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addJersey.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input placeholder="Heimtrikot 2024/25" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={200} />
                  </div>
                  <div className="space-y-2">
                    <Label>Team *</Label>
                    <Autocomplete
                      options={COMMON_TEAMS}
                      value={form.team}
                      onChange={(value) => setForm(f => ({ ...f, team: value }))}
                      placeholder="FC Bayern München"
                      maxLength={200}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Liga</Label>
                    <Autocomplete
                      options={COMMON_LEAGUES}
                      value={form.league}
                      onChange={(value) => setForm(f => ({ ...f, league: value }))}
                      placeholder="Bundesliga"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jahr</Label>
                    <Input placeholder="2024" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))} maxLength={10} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Zustand</Label>
                    <Select value={form.condition} onValueChange={(v) => setForm(f => ({ ...f, condition: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[5,4,3,2,1].map(c => <SelectItem key={c} value={String(c)}>{c}/5 · {conditionLabels[c]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Größe</Label>
                    <Select value={form.size} onValueChange={(v) => setForm(f => ({ ...f, size: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["XS","S","M","L","XL","XXL"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Schätzpreis (€)</Label>
                    <Input type="number" placeholder="80" value={form.price_cents} onChange={(e) => setForm(f => ({ ...f, price_cents: e.target.value }))} min={0} max={100000} />
                  </div>
                </div>
                {form.price_cents && form.condition && form.year && (
                  (() => {
                    const priceIntel = calculatePriceIntelligence({
                      priceCents: Math.round(parseFloat(form.price_cents) * 100),
                      condition: parseInt(form.condition),
                      year: form.year,
                    });
                    return (
                      <div className="rounded-sm border border-border bg-secondary/50 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Preisanalyse</span>
                          <Badge
                            className={`rounded-sm font-display text-xs uppercase tracking-wider ${priceIntel.verdict.bg} text-white`}
                          >
                            {priceIntel.verdict.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Fairer Bereich: €{Math.round(priceIntel.spectrum.fair * 0.9)}–€{Math.round(priceIntel.spectrum.fair * 1.1)}
                        </p>
                      </div>
                    );
                  })()
                )}
                <div className="space-y-2">
                  <Label>Bilder</Label>
                  <MultiImageUpload
                    images={imageUrls}
                    onImagesChange={setImageUrls}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beschreibung</Label>
                  <Textarea placeholder="Erzähle die Geschichte dieses Trikots..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} maxLength={500} className="resize-none" rows={4} />
                  <p className="text-xs text-muted-foreground">{form.description.length}/500</p>
                </div>
                <div className="space-y-3">
                  <Label>Listingtyp</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "trade" as const, label: "Zum Tauschen" },
                      { value: "sell" as const, label: "Zum Verkaufen" },
                      { value: "both" as const, label: "Beides" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={form.listingType === option.value ? "default" : "outline"}
                        onClick={() => setForm(f => ({ ...f, listingType: option.value }))}
                        className="text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {(form.listingType === "sell" || form.listingType === "both") && (
                  <div className="space-y-2">
                    <Label>Verkaufspreis (€) *</Label>
                    <Input type="number" placeholder="80" value={form.price_cents} onChange={(e) => setForm(f => ({ ...f, price_cents: e.target.value }))} min={0} max={100000} step={0.01} required />
                    {form.team && form.year && debouncedPrice && (
                      <div className="mt-3">
                        <PriceIntelligence
                          team={form.team}
                          year={parseInt(form.year) || 0}
                          condition={parseInt(form.condition)}
                          size={form.size}
                          listingPriceCents={Math.round(parseFloat(debouncedPrice) * 100)}
                          compact={false}
                        />
                      </div>
                    )}
                  </div>
                )}
                <Button type="submit" variant="hero" className="w-full uppercase tracking-wider" disabled={addJersey.isPending}>
                  {addJersey.isPending ? "Wird verarbeitet..." : "Trikot speichern"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
            <p className="font-display text-xl text-muted-foreground">Fehler beim Laden deiner Sammlung</p>
            <p className="mt-2 text-sm text-muted-foreground">{error instanceof Error ? error.message : "Bitte versuche es später erneut"}</p>
            <Button
              variant="hero"
              className="mt-4 uppercase tracking-wider"
              onClick={() => refetch()}
            >
              Erneut versuchen
            </Button>
          </div>
        ) : jerseys.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-12 text-center">
            <Shirt className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-display text-xl text-muted-foreground">Noch keine Trikots in deiner Sammlung</p>
            <p className="mt-2 text-sm text-muted-foreground">Füge dein erstes Trikot hinzu und starte deine Kollektion.</p>
            <Button
              variant="hero"
              className="mt-4 uppercase tracking-wider"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Trikot hinzufügen
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {jerseys.map((jersey) => (
              <div
                key={jersey.id}
                className="overflow-hidden rounded-sm border border-border bg-card cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => {
                  setSelectedJersey(jersey);
                  setEditForm(jersey);
                  setEditImageUrls(jersey.image_urls || []);
                  setIsEditing(false);
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
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant="secondary" className="text-[10px]">{jersey.size}</Badge>
                      {!!jersey.sale_price_cents && <Badge variant="default" className="text-[10px]">Kaufen</Badge>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{jersey.condition}/5 · {conditionLabels[jersey.condition]}</span>
                    {jersey.sale_price_cents && <span className="font-semibold text-foreground">{formatEuros(jersey.sale_price_cents)}</span>}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {jersey.verification_status === "verified" && (
                      <Badge variant="default" className="bg-green-600 text-[10px]">
                        <ShieldCheck className="mr-1 h-3 w-3" /> Verifiziert
                      </Badge>
                    )}
                    {jersey.verification_status === "pending" && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Clock className="mr-1 h-3 w-3" /> Wartet auf Prüfung
                      </Badge>
                    )}
                    {jersey.verification_status === "rejected" && (
                      <Badge variant="destructive" className="text-[10px]">
                        <XCircle className="mr-1 h-3 w-3" /> Nicht verifiziert
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Switch
                          checked={jersey.available_for_trade}
                          onCheckedChange={(v) => toggleTrade.mutate({ id: jersey.id, available: v })}
                        />
                        <span className="text-xs text-muted-foreground">
                          {jersey.available_for_trade ? (
                            <span className="flex items-center gap-1 text-primary">
                              <ArrowLeftRight className="h-3 w-3" /> Im Tausch
                            </span>
                          ) : "Zum Tausch anbieten"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteJersey.mutate(jersey.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJersey(jersey);
                        setSalePrice(jersey.sale_price_cents ? (jersey.sale_price_cents / 100).toString() : "");
                        setSaleModalOpen(true);
                      }}
                    >
                      Zum Verkauf anbieten
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Jersey Detail Sheet */}
        <Sheet open={detailSheetOpen} onOpenChange={(open) => {
          setDetailSheetOpen(open);
          if (!open) {
            setIsEditing(false);
            setEditForm(null);
            setEditImageUrls([]);
          }
        }}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
            {selectedJersey && editForm && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-display text-2xl">{isEditing ? "Trikot bearbeiten" : selectedJersey.team}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {!isEditing && (
                    <>
                      {/* Jersey Images */}
                      {(selectedJersey.image_urls && selectedJersey.image_urls.length > 0) || selectedJersey.image_url ? (
                        <div className="space-y-2">
                          {(selectedJersey.image_urls && selectedJersey.image_urls.length > 0) ? (
                            <div className="grid grid-cols-2 gap-2">
                              {selectedJersey.image_urls.map((url: string, index: number) => (
                                <div key={index} className="aspect-square overflow-hidden rounded-sm bg-secondary">
                                  <img src={url} alt={`${selectedJersey.name} ${index + 1}`} className="h-full w-full object-cover" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="aspect-square overflow-hidden rounded-sm bg-secondary">
                              <img src={selectedJersey.image_url} alt={selectedJersey.name} className="h-full w-full object-cover" />
                            </div>
                          )}
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
                            <p className="text-xs text-muted-foreground">Schätzpreis</p>
                            <p className="font-semibold">{selectedJersey.price_cents ? formatEuros(selectedJersey.price_cents) : "—"}</p>
                          </div>
                        </div>
                        {selectedJersey.sale_price_cents && (
                          <div>
                            <p className="text-xs text-muted-foreground">Verkaufspreis</p>
                            <p className="font-semibold text-lg text-primary">{formatEuros(selectedJersey.sale_price_cents)}</p>
                          </div>
                        )}
                        {selectedJersey.description && selectedJersey.description.trim() && (
                          <div>
                            <p className="text-xs text-muted-foreground">Beschreibung</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{selectedJersey.description}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {isEditing && (
                    <>
                      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); }}>
                        <div className="space-y-2">
                          <Label>Bilder</Label>
                          <MultiImageUpload
                            images={editImageUrls}
                            onImagesChange={setEditImageUrls}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Name *</Label>
                          <Input placeholder="Heimtrikot 2024/25" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} required maxLength={200} />
                        </div>
                        <div className="space-y-2">
                          <Label>Team *</Label>
                          <Autocomplete
                            options={COMMON_TEAMS}
                            value={editForm.team}
                            onChange={(value) => setEditForm(f => ({ ...f, team: value }))}
                            placeholder="FC Bayern München"
                            maxLength={200}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Liga</Label>
                          <Autocomplete
                            options={COMMON_LEAGUES}
                            value={editForm.league}
                            onChange={(value) => setEditForm(f => ({ ...f, league: value }))}
                            placeholder="Bundesliga"
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Jahr</Label>
                          <Input placeholder="2024" value={editForm.year} onChange={(e) => setEditForm(f => ({ ...f, year: e.target.value }))} maxLength={10} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Zustand</Label>
                            <Select value={editForm.condition.toString()} onValueChange={(v) => setEditForm(f => ({ ...f, condition: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {[5,4,3,2,1].map(c => <SelectItem key={c} value={String(c)}>{c}/5 · {conditionLabels[c]}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Größe</Label>
                            <Select value={editForm.size} onValueChange={(v) => setEditForm(f => ({ ...f, size: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["XS","S","M","L","XL","XXL"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Schätzpreis (€)</Label>
                          <Input type="number" placeholder="80" value={editForm.price_cents} onChange={(e) => setEditForm(f => ({ ...f, price_cents: e.target.value }))} min={0} max={100000} />
                        </div>
                        <div className="space-y-2">
                          <Label>Beschreibung</Label>
                          <Textarea placeholder="Erzähle die Geschichte dieses Trikots..." value={editForm.description || ""} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} maxLength={500} className="resize-none" rows={4} />
                          <p className="text-xs text-muted-foreground">{(editForm.description || "").length}/500</p>
                        </div>
                      </form>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3 border-t border-border pt-6">
                    {!isEditing && (
                      <>
                        {selectedJersey.available_for_trade ? (
                          <Badge variant="default" className="w-full justify-center py-2">
                            <ArrowLeftRight className="mr-2 h-4 w-4" /> Im Tausch
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTrade.mutate({ id: selectedJersey.id, available: true });
                            }}
                            disabled={toggleTrade.isPending}
                          >
                            {toggleTrade.isPending ? "Wird verarbeitet..." : "Zum Tausch anbieten"}
                          </Button>
                        )}
                        {selectedJersey.sale_price_cents ? (
                          <Badge variant="default" className="w-full justify-center py-2">
                            Zum Verkauf ({formatEuros(selectedJersey.sale_price_cents)})
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSalePrice(selectedJersey.sale_price_cents ? (selectedJersey.sale_price_cents / 100).toString() : "");
                              setSaleModalOpen(true);
                            }}
                          >
                            Zum Verkauf anbieten
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setIsEditing(true)}
                        >
                          Bearbeiten
                        </Button>
                      </>
                    )}
                    {isEditing && (
                      <>
                        <Button
                          variant="hero"
                          className="w-full uppercase tracking-wider"
                          onClick={() => updateJersey.mutate(editForm)}
                          disabled={updateJersey.isPending}
                        >
                          {updateJersey.isPending ? "Wird gespeichert..." : "Speichern"}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setIsEditing(false);
                            setEditForm(selectedJersey);
                          }}
                          disabled={updateJersey.isPending}
                        >
                          Abbrechen
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Sale Price Modal */}
        <Dialog open={saleModalOpen} onOpenChange={setSaleModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Verkaufspreis festlegen</DialogTitle>
            </DialogHeader>
            {selectedJersey && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Legen Sie einen Verkaufspreis für {selectedJersey.team} fest
                </p>
                <div className="space-y-2">
                  <Label htmlFor="sale-price">Preis (€)</Label>
                  <Input
                    id="sale-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSaleModalOpen(false);
                      setSalePrice("");
                    }}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    variant="hero"
                    className="flex-1"
                    onClick={() => {
                      if (selectedJersey && salePrice) {
                        updateSalePrice.mutate({ id: selectedJersey.id, price: salePrice });
                      } else {
                        toast.error("Bitte geben Sie einen Preis ein");
                      }
                    }}
                    disabled={updateSalePrice.isPending || !salePrice}
                  >
                    {updateSalePrice.isPending ? "Wird gespeichert..." : "Speichern"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
};

export default Collection;
