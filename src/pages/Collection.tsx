import { useState } from "react";
import { eurosToCents, formatEuros } from "@/utils/currency";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceIntelligence from "@/components/PriceIntelligence";
import MultiImageUpload from "@/components/MultiImageUpload";
import RichTextEditor from "@/components/RichTextEditor";
import { Combobox } from "@/components/ui/combobox";
import { COMMON_TEAMS, COMMON_LEAGUES } from "@/data/teams-leagues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/layout/PageHeader";
import { useSiteContent } from "@/hooks/useSiteContent";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, ArrowLeftRight, Shirt, AlertCircle, ShieldCheck, Clock, XCircle } from "lucide-react";
import { useEffect } from "react";
import { CONDITION_LABELS as conditionLabels } from "@/data/condition";
import { getPrimaryImage } from "@/utils/jerseyImage";
import DeleteJerseyDialog, { type DeleteJerseyTarget } from "@/components/DeleteJerseyDialog";

// Rahmenfarbe rotiert rein dekorativ, stabil pro Trikot (Skill cc-design §2, wie Figurina)
const FRAME_COLORS = ["border-verde", "border-azzurro", "border-giallo", "border-rosso"] as const;
const frameColorFor = (id: string) =>
  FRAME_COLORS[[...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % FRAME_COLORS.length];

const TAG = "inline-flex items-center border px-[7px] py-1 font-body text-[10px] font-medium uppercase leading-none tracking-[0.14em]";
const LABEL = "cap text-[11px] leading-none text-nero";
const DIALOG = "max-h-[90vh] overflow-y-auto shadow-none";
const DIALOG_TITLE = "font-display text-2xl font-semibold normal-case tracking-[-0.02em]";
const STATUS_BOX = "cap flex h-11 w-full items-center justify-center gap-2 border";

const Collection = () => {
  const page = useSiteContent("collection");
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
  const [jerseyToDelete, setJerseyToDelete] = useState<DeleteJerseyTarget | null>(null);
  const [form, setForm] = useState({
    name: "", team: "", league: "", year: "", condition: "3", size: "M",
    available_for_trade: false,
    listingType: "trade" as "trade" | "sell" | "both",
    description: "",
    sale_price: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: jerseys = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-jerseys", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_jerseys")
        .select("*")
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile-favorite-team", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("favorite_team")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addJersey = useMutation({
    mutationFn: async () => {
      const isForSale = form.listingType === "sell" || form.listingType === "both";
      const availableForTrade = form.listingType === "trade" || form.listingType === "both";
      const salePriceCents = isForSale ? eurosToCents(form.sale_price) : null;

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
      setForm({ name: "", team: "", league: "", year: "", condition: "3", size: "M", available_for_trade: false, listingType: "trade", description: "", sale_price: "" });
      setImageUrls([]);
      toast.success("Trikot hinzugefügt!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateJersey = useMutation({
    mutationFn: async (jersey: any) => {
      // Determine listing_type based on sale_price_cents and available_for_trade
      let newListingType: "trade_only" | "buy_now" | "both" | "unlisted";
      if (jersey.sale_price_cents !== null && jersey.available_for_trade) {
        newListingType = "both";
      } else if (jersey.sale_price_cents !== null && !jersey.available_for_trade) {
        newListingType = "buy_now";
      } else if (jersey.sale_price_cents === null && jersey.available_for_trade) {
        newListingType = "trade_only";
      } else {
        newListingType = "unlisted";
      }

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
          sale_price_cents: jersey.sale_price_cents,
          listing_type: newListingType,
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
    onError: (e: Error) => toast.error(e.message),
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
      let newListingType: "trade_only" | "buy_now" | "both" | "unlisted";
      if (available) {
        // If toggling to available for trade:
        // - If has sale price, listing_type should be "both"
        // - If no sale price, listing_type should be "trade_only"
        newListingType = jersey.sale_price_cents ? "both" : "trade_only";
      } else {
        // If toggling to unavailable for trade:
        // - If has sale price, listing_type should be "buy_now"
        // - If no sale price either, neither for sale nor trade -> "unlisted"
        newListingType = jersey.sale_price_cents ? "buy_now" : "unlisted";
      }

      const { error } = await supabase
        .from("user_jerseys")
        .update({ available_for_trade: available, listing_type: newListingType })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, { available }) => {
      queryClient.invalidateQueries({ queryKey: ["my-jerseys"] });
      toast.success(available ? "Trikot ist jetzt zum Tausch verfügbar!" : "Tauschangebot zurückgezogen.");
    },
    onError: (e: Error) => toast.error(e.message),
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
      let newListingType: "trade_only" | "buy_now" | "both" | "unlisted";
      if (priceCents !== null && jersey.available_for_trade) {
        newListingType = "both";
      } else if (priceCents !== null && !jersey.available_for_trade) {
        newListingType = "buy_now";
      } else if (priceCents === null && jersey.available_for_trade) {
        newListingType = "trade_only";
      } else {
        // priceCents === null && !available_for_trade -> neither for sale nor trade
        newListingType = "unlisted";
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
    onError: (e: Error) => toast.error(e.message),
  });

  const withdrawSale = useMutation({
    mutationFn: async ({ id, previousSalePriceCents, availableForTrade }: { id: string; previousSalePriceCents: number | null; availableForTrade: boolean }) => {
      const { error } = await supabase
        .from("user_jerseys")
        .update({
          sale_price_cents: null,
          last_sale_price_cents: previousSalePriceCents,
          listing_type: availableForTrade ? "trade_only" : "unlisted",
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jerseys"] });
      toast.success("Verkaufsangebot zurückgezogen.");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Persönlicher Bereich → grünes Kopfband (Skill cc-design §5.1) */}
      <PageHeader
        tone="verde"
        eyebrow={page.header.eyebrow}
        headline={page.header.headline}
        subline={page.header.subline}
      >
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (open && !form.team && profile?.favorite_team) {
            setForm(f => ({ ...f, team: profile.favorite_team! }));
          }
          if (!open) {
            setImageUrls([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="light" size="lg" className="w-full sm:w-auto">
              <Plus /> Trikot hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className={cn(DIALOG, "sm:max-w-lg")}>
            <DialogHeader className="text-left">
              <div className="cap text-rosso">Nuova maglia · Sammlung</div>
              <DialogTitle className={DIALOG_TITLE}>Neues Trikot</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addJersey.mutate(); }} className="space-y-5">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className={LABEL}>Name *</Label>
                    <Input placeholder="Heimtrikot 2024/25" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={200} />
                  </div>
                  <div className="space-y-2">
                    <Label className={LABEL}>Team *</Label>
                    <Combobox
                      options={COMMON_TEAMS}
                      value={form.team}
                      onChange={(value) => setForm(f => ({ ...f, team: value }))}
                      placeholder="FC Bayern München"
                      maxLength={200}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className={LABEL}>Liga</Label>
                    <Combobox
                      options={COMMON_LEAGUES}
                      value={form.league}
                      onChange={(value) => setForm(f => ({ ...f, league: value }))}
                      placeholder="Bundesliga"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={LABEL}>Saison</Label>
                    <Input placeholder="z.B. 1997/98" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))} maxLength={10} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={LABEL}>Zustand</Label>
                    <Select value={form.condition} onValueChange={(v) => setForm(f => ({ ...f, condition: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[5,4,3,2,1].map(c => <SelectItem key={c} value={String(c)}>{c}/5 · {conditionLabels[c]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={LABEL}>Größe</Label>
                    <Select value={form.size} onValueChange={(v) => setForm(f => ({ ...f, size: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["XS","S","M","L","XL","XXL"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.team && form.year && (
                  <div className="mt-3">
                    <PriceIntelligence
                      team={form.team}
                      year={parseInt(form.year) || 0}
                      condition={parseInt(form.condition) || 3}
                      size={form.size}
                      compact={false}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t border-nero pt-5">
                <div className="space-y-2">
                  <Label className={LABEL}>Bilder</Label>
                  <MultiImageUpload
                    images={imageUrls}
                    onImagesChange={setImageUrls}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={LABEL}>Beschreibung</Label>
                  <RichTextEditor
                    content={form.description}
                    onChange={(html) => setForm(f => ({ ...f, description: html }))}
                    maxLength={500}
                    placeholder="Erzähle die Geschichte dieses Trikots..."
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-nero pt-5">
                <div className="space-y-2">
                  <Label className={LABEL}>Listingtyp</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "trade" as const, label: "Zum Tauschen" },
                      { value: "sell" as const, label: "Zum Verkaufen" },
                      { value: "both" as const, label: "Beides" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={form.listingType === option.value ? "dark" : "outline"}
                        aria-pressed={form.listingType === option.value}
                        onClick={() => setForm(f => ({ ...f, listingType: option.value }))}
                        className="h-11 whitespace-normal px-1 text-[10px] leading-tight sm:px-2"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {(form.listingType === "sell" || form.listingType === "both") && (
                  <div className="space-y-2">
                    <Label className={LABEL}>Verkaufspreis (€) *</Label>
                    <Input type="number" placeholder="80" value={form.sale_price} onChange={(e) => setForm(f => ({ ...f, sale_price: e.target.value }))} min={0} max={100000} step={0.01} required />
                  </div>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={addJersey.isPending}>
                {addJersey.isPending ? "Wird verarbeitet..." : "Trikot speichern"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Sammlungs-Raster */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-10">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2.5 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2.5 border-2 border-nero bg-card p-2 md:p-3">
                  <Skeleton className="h-3 w-2/3 bg-sabbia" />
                  <Skeleton className="aspect-[4/5] w-full bg-sabbia" />
                  <Skeleton className="h-4 w-3/4 bg-sabbia" />
                  <Skeleton className="h-3 w-1/2 bg-sabbia" />
                  <Skeleton className="mt-2 h-11 w-full bg-sabbia" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="border-2 border-nero bg-card px-6 py-12 text-center">
              <AlertCircle className="mx-auto mb-4 h-10 w-10 text-rosso" />
              <p className="font-display text-lg font-semibold">Fehler beim Laden deiner Sammlung</p>
              <p className="mt-2 text-sm text-muted-foreground">{error instanceof Error ? error.message : "Bitte versuche es später erneut"}</p>
              <Button className="mt-5" onClick={() => refetch()}>
                Erneut versuchen
              </Button>
            </div>
          ) : jerseys.length === 0 ? (
            <div className="border-2 border-nero bg-card px-6 py-12 text-center">
              <Shirt className="mx-auto mb-4 h-10 w-10" />
              <p className="font-display text-lg font-semibold">{page.empty}</p>
              <p className="mt-2 text-sm text-muted-foreground">Füge dein erstes Trikot hinzu und starte deine Kollektion.</p>
              <Button className="mt-5" onClick={() => setDialogOpen(true)}>
                <Plus /> Trikot hinzufügen
              </Button>
            </div>
          ) : (
            <>
              <div className="cap mb-5 border-b border-nero pb-3 text-[11px] text-muted-foreground">
                <span className="num mr-1 text-base text-nero">{jerseys.length}</span> Trikots in deiner Sammlung
              </div>
              <div className="grid grid-cols-2 gap-2.5 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {jerseys.map((jersey) => {
                  const image = getPrimaryImage(jersey);
                  return (
                    <article
                      key={jersey.id}
                      className="group flex h-full cursor-pointer flex-col gap-2.5 border-2 border-nero bg-card p-2 md:p-3"
                      onClick={() => {
                        setSelectedJersey(jersey);
                        setEditForm(jersey);
                        setEditImageUrls(jersey.image_urls || []);
                        setIsEditing(false);
                        setDetailSheetOpen(true);
                      }}
                    >
                      {/* 1 · Kopfzeile */}
                      <div className="cap truncate text-[10px] md:text-[11px]">
                        {[jersey.league, jersey.year].filter(Boolean).join(" · ") || "—"}
                      </div>

                      {/* 2 · Bild mit farbigem Rahmen */}
                      <div className={cn("grain grain-photo relative aspect-[4/5] overflow-hidden border-[4px] bg-sabbia md:border-[6px]", frameColorFor(jersey.id))}>
                        {image ? (
                          <img
                            src={image}
                            alt={jersey.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="display text-6xl text-nero/25">{jersey.team.charAt(0)}</span>
                          </div>
                        )}
                        {jersey.size && (
                          <div className="absolute bottom-1.5 left-1.5 z-[2]">
                            <span className={cn(TAG, "border-nero bg-card text-nero")}>{jersey.size}</span>
                          </div>
                        )}
                      </div>

                      {/* 3 · Titel */}
                      <div>
                        <h3 className="font-display text-[15px] font-semibold normal-case leading-tight tracking-[-0.02em] md:text-[17px]">{jersey.team}</h3>
                        {jersey.name && <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground md:text-sm">{jersey.name}</p>}
                      </div>

                      {/* 4 · Meta */}
                      <div className="cap text-[10px] leading-relaxed text-muted-foreground">
                        <div className="truncate">Zustand {jersey.condition}/5 · {conditionLabels[jersey.condition]}</div>
                      </div>
                      {jersey.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {jersey.description.replace(/<[^>]*>/g, "")}
                        </p>
                      )}

                      {/* 5 · Status-Tags */}
                      <div className="flex flex-wrap gap-1">
                        {!!jersey.sale_price_cents && <span className={cn(TAG, "border-nero text-nero")}>Verkauf</span>}
                        {jersey.available_for_trade && <span className={cn(TAG, "border-rosso text-rosso")}>Tausch</span>}
                        {jersey.verification_status === "verified" && (
                          <span className={cn(TAG, "gap-1 border-verde text-verde")}>
                            <ShieldCheck className="h-3 w-3" /> Verifiziert
                          </span>
                        )}
                        {jersey.verification_status === "pending" && (
                          <span className={cn(TAG, "gap-1 border-muted-foreground text-muted-foreground")}>
                            <Clock className="h-3 w-3" /> Wartet auf Prüfung
                          </span>
                        )}
                        {jersey.verification_status === "rejected" && (
                          <span className={cn(TAG, "gap-1 border-rosso bg-rosso text-avorio")}>
                            <XCircle className="h-3 w-3" /> Nicht verifiziert
                          </span>
                        )}
                      </div>

                      {/* 6 · Preis + Steuerung, unten angepinnt */}
                      <div className="mt-auto border-t border-nero pt-2">
                        {!!jersey.sale_price_cents && (
                          <div className="mb-1">
                            <div className="cap text-[10px] text-muted-foreground">Verkaufspreis</div>
                            <span className="num text-[20px] leading-none md:text-[24px]">{formatEuros(jersey.sale_price_cents)}</span>
                          </div>
                        )}
                        <div
                          className="flex min-h-11 items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Switch
                            checked={jersey.available_for_trade}
                            onCheckedChange={(v) => toggleTrade.mutate({ id: jersey.id, available: v })}
                            aria-label="Zum Tausch anbieten"
                          />
                          <span className="cap text-[10px] leading-tight text-muted-foreground">
                            {jersey.available_for_trade ? (
                              <span className="flex items-center gap-1 text-rosso">
                                <ArrowLeftRight className="h-3 w-3" /> Im Tausch
                              </span>
                            ) : "Zum Tausch anbieten"}
                          </span>
                        </div>
                        <div
                          className="flex min-h-11 items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Switch
                            checked={!!jersey.sale_price_cents}
                            onCheckedChange={(v) => {
                              if (v) {
                                setSelectedJersey(jersey);
                                const prefillCents = jersey.sale_price_cents ?? jersey.last_sale_price_cents;
                                setSalePrice(prefillCents ? (prefillCents / 100).toString() : "");
                                setSaleModalOpen(true);
                              } else {
                                withdrawSale.mutate({
                                  id: jersey.id,
                                  previousSalePriceCents: jersey.sale_price_cents,
                                  availableForTrade: jersey.available_for_trade,
                                });
                              }
                            }}
                            aria-label="Zum Verkauf anbieten"
                          />
                          <span className="cap text-[10px] leading-tight text-muted-foreground">
                            {jersey.sale_price_cents ? (
                              <span className="text-verde">Zum Verkauf</span>
                            ) : "Zum Verkauf anbieten"}
                          </span>
                        </div>
                        {!!jersey.sale_price_cents && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1 h-11 w-full px-2 text-[10px] md:text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJersey(jersey);
                              setSalePrice((jersey.sale_price_cents / 100).toString());
                              setSaleModalOpen(true);
                            }}
                          >
                            Preis ändern
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Jersey Detail Dialog */}
      <Dialog open={detailSheetOpen} onOpenChange={(open) => {
        setDetailSheetOpen(open);
        if (!open) {
          setIsEditing(false);
          setEditForm(null);
          setEditImageUrls([]);
        }
      }}>
        <DialogContent className={cn(DIALOG, "sm:max-w-[900px]")}>
          {selectedJersey && editForm && (
            <>
              <DialogHeader className="pr-8 text-left">
                <div className="cap text-rosso">
                  {isEditing ? "Modifica · Bearbeiten" : [selectedJersey.league, selectedJersey.year].filter(Boolean).join(" · ") || "La mia collezione"}
                </div>
                <DialogTitle className={DIALOG_TITLE}>{isEditing ? "Trikot bearbeiten" : selectedJersey.team}</DialogTitle>
              </DialogHeader>
              <div className="mt-2 grid gap-6 sm:grid-cols-[1fr_1fr]">
                {/* Left Column: Images and Info (View Mode) / Images (Edit Mode) */}
                <div className="space-y-6">
                  {!isEditing && (
                    <>
                      {/* Jersey Images */}
                      {getPrimaryImage(selectedJersey) ? (
                        <div className="space-y-2">
                          {(selectedJersey.image_urls && selectedJersey.image_urls.length > 0) ? (
                            <div className="grid grid-cols-2 gap-2">
                              {selectedJersey.image_urls.map((url: string, index: number) => (
                                <div
                                  key={index}
                                  className={cn(
                                    "grain grain-photo relative aspect-[4/5] overflow-hidden bg-sabbia",
                                    index === 0 ? cn("border-[4px] md:border-[6px]", frameColorFor(selectedJersey.id)) : "border-2 border-nero",
                                  )}
                                >
                                  <img src={url} alt={`${selectedJersey.name} ${index + 1}`} className="h-full w-full object-cover" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={cn("grain grain-photo relative aspect-[4/5] overflow-hidden border-[4px] bg-sabbia md:border-[6px]", frameColorFor(selectedJersey.id))}>
                              <img src={selectedJersey.image_url} alt={selectedJersey.name} className="h-full w-full object-cover" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={cn("flex aspect-[4/5] items-center justify-center border-[4px] bg-sabbia md:border-[6px]", frameColorFor(selectedJersey.id))}>
                          <span className="display text-7xl text-nero/25">{selectedJersey.team.charAt(0)}</span>
                        </div>
                      )}

                      {/* Jersey Info */}
                      <div className="space-y-4 border-t border-nero pt-4">
                        <div>
                          <p className="cap text-[10px] text-muted-foreground">Name</p>
                          <p className="font-semibold">{selectedJersey.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="cap text-[10px] text-muted-foreground">Liga</p>
                            <p className="font-semibold">{selectedJersey.league || "—"}</p>
                          </div>
                          <div>
                            <p className="cap text-[10px] text-muted-foreground">Saison</p>
                            <p className="font-semibold">{selectedJersey.year || "—"}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 border-t border-nero/25 pt-4">
                          <div>
                            <p className="cap text-[10px] text-muted-foreground">Größe</p>
                            <p className="num text-xl leading-tight">{selectedJersey.size}</p>
                          </div>
                          <div>
                            <p className="cap text-[10px] text-muted-foreground">Zustand</p>
                            <p className="num text-xl leading-tight">{selectedJersey.condition}/5</p>
                          </div>
                          <div>
                            <p className="cap text-[10px] text-muted-foreground">Schätzpreis</p>
                            <p className="num text-xl leading-tight">{selectedJersey.price_cents ? formatEuros(selectedJersey.price_cents) : "—"}</p>
                          </div>
                        </div>
                        {selectedJersey.sale_price_cents && (
                          <div className="border-t border-nero/25 pt-4">
                            <p className="cap text-[10px] text-muted-foreground">Verkaufspreis</p>
                            <p className="num text-[28px] leading-tight">{formatEuros(selectedJersey.sale_price_cents)}</p>
                          </div>
                        )}
                        {selectedJersey.description && selectedJersey.description.trim() && (
                          <div className="border-t border-nero/25 pt-4">
                            <p className="cap text-[10px] text-muted-foreground">Beschreibung</p>
                            <div
                              className="prose prose-sm mt-1 max-w-none text-sm text-foreground"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedJersey.description) }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {isEditing && (
                    <>
                      <div className="space-y-2">
                        <Label className={LABEL}>Bilder</Label>
                        <MultiImageUpload
                          images={editImageUrls}
                          onImagesChange={setEditImageUrls}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column: Form Fields (Edit Mode) / Action Buttons (View Mode) */}
                <div className="space-y-4">
                  {isEditing && (
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); }}>
                      <div className="space-y-2">
                        <Label className={LABEL}>Name *</Label>
                        <Input placeholder="Heimtrikot 2024/25" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} required maxLength={200} />
                      </div>
                      <div className="space-y-2">
                        <Label className={LABEL}>Team *</Label>
                        <Combobox
                          options={COMMON_TEAMS}
                          value={editForm.team}
                          onChange={(value) => setEditForm(f => ({ ...f, team: value }))}
                          placeholder="FC Bayern München"
                          maxLength={200}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={LABEL}>Liga</Label>
                        <Combobox
                          options={COMMON_LEAGUES}
                          value={editForm.league}
                          onChange={(value) => setEditForm(f => ({ ...f, league: value }))}
                          placeholder="Bundesliga"
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={LABEL}>Saison</Label>
                        <Input placeholder="z.B. 1997/98" value={editForm.year} onChange={(e) => setEditForm(f => ({ ...f, year: e.target.value }))} maxLength={10} />
                      </div>
                      {editForm.team && editForm.year && (
                        <div className="mt-3">
                          <PriceIntelligence
                            team={editForm.team}
                            year={parseInt(editForm.year) || 0}
                            condition={editForm.condition || 3}
                            size={editForm.size}
                            compact={false}
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 border-t border-nero pt-4">
                        <div className="space-y-2">
                          <Label className={LABEL}>Zustand</Label>
                          <Select value={editForm.condition.toString()} onValueChange={(v) => setEditForm(f => ({ ...f, condition: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {[5,4,3,2,1].map(c => <SelectItem key={c} value={String(c)}>{c}/5 · {conditionLabels[c]}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className={LABEL}>Größe</Label>
                          <Select value={editForm.size} onValueChange={(v) => setEditForm(f => ({ ...f, size: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["XS","S","M","L","XL","XXL"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className={LABEL}>Verkaufspreis (€)</Label>
                        <Input type="number" placeholder="100" value={editForm.sale_price_cents ? (editForm.sale_price_cents / 100).toString() : ""} onChange={(e) => setEditForm(f => ({ ...f, sale_price_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null }))} min={0} max={100000} step={0.01} />
                      </div>
                      <div className="space-y-2 border-t border-nero pt-4">
                        <Label className={LABEL}>Beschreibung</Label>
                        <RichTextEditor
                          content={editForm.description || ""}
                          onChange={(html) => setEditForm(f => ({ ...f, description: html }))}
                          maxLength={500}
                          placeholder="Erzähle die Geschichte dieses Trikots..."
                        />
                      </div>
                    </form>
                  )}

                  {/* Action Buttons */}
                  <div className={cn("space-y-3", isEditing && "border-t border-nero pt-6")}>
                    {!isEditing && (
                      <>
                        {selectedJersey.available_for_trade ? (
                          <div className={cn(STATUS_BOX, "border-rosso text-rosso")}>
                            <ArrowLeftRight className="h-4 w-4" /> Im Tausch
                          </div>
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
                          <div className={cn(STATUS_BOX, "border-verde text-verde")}>
                            Zum Verkauf ({formatEuros(selectedJersey.sale_price_cents)})
                          </div>
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
                          variant="dark"
                          className="w-full"
                          onClick={() => setIsEditing(true)}
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setJerseyToDelete({ id: selectedJersey.id, team: selectedJersey.team, name: selectedJersey.name });
                          }}
                        >
                          Löschen
                        </Button>
                      </>
                    )}
                    {isEditing && (
                      <>
                        <Button
                          size="lg"
                          className="w-full"
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Sale Price Modal */}
      <Dialog open={saleModalOpen} onOpenChange={setSaleModalOpen}>
        <DialogContent className={DIALOG}>
          <DialogHeader className="text-left">
            <div className="cap text-rosso">In vendita · Verkauf</div>
            <DialogTitle className={DIALOG_TITLE}>Verkaufspreis festlegen</DialogTitle>
          </DialogHeader>
          {selectedJersey && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Leg einen Verkaufspreis für {selectedJersey.team} fest
              </p>
              <div className="space-y-2">
                <Label htmlFor="sale-price" className={LABEL}>Preis (€)</Label>
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
              <div className="flex gap-3 border-t border-nero pt-5">
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
                  className="flex-1"
                  onClick={() => {
                    if (selectedJersey && salePrice) {
                      updateSalePrice.mutate({ id: selectedJersey.id, price: salePrice });
                    } else {
                      toast.error("Bitte gib einen Preis ein.");
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

      <DeleteJerseyDialog
        jersey={jerseyToDelete}
        onClose={() => setJerseyToDelete(null)}
        onDeleted={() => setDetailSheetOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default Collection;
