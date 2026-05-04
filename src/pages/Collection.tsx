import { useState } from "react";
import { eurosToCents, formatEuros } from "@/utils/currency";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useJerseyImageUpload } from "@/hooks/useJerseyImageUpload";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { upload: uploadImage, isUploading: isUploadingImage } = useJerseyImageUpload();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedJersey, setSelectedJersey] = useState<any>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", team: "", league: "", year: "", condition: "3", size: "M",
    image_url: "", price_cents: "", available_for_trade: false,
    listingType: "trade" as "trade" | "sell" | "both",
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
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addJersey = useMutation({
    mutationFn: async () => {
      let imageUrl: string | null = null;

      // Upload image if selected
      if (selectedFile && user) {
        try {
          const result = await uploadImage(selectedFile, user.id);
          imageUrl = result.publicUrl;
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Image upload failed";
          throw new Error(msg);
        }
      }

      const isForSale = form.listingType === "sell" || form.listingType === "both";
      const availableForTrade = form.listingType === "trade" || form.listingType === "both";
      const salePriceCents = isForSale ? eurosToCents(form.price_cents) : null;

      const { error } = await supabase.from("user_jerseys").insert({
        user_id: user!.id,
        name: form.name.trim(),
        team: form.team.trim(),
        league: form.league.trim(),
        year: form.year.trim(),
        condition: parseInt(form.condition),
        size: form.size,
        image_url: imageUrl || form.image_url.trim() || null,
        price_cents: eurosToCents(form.price_cents),
        available_for_trade: availableForTrade,
        is_for_sale: isForSale,
        sale_price_cents: salePriceCents,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jerseys"] });
      setDialogOpen(false);
      setForm({ name: "", team: "", league: "", year: "", condition: "3", size: "M", image_url: "", price_cents: "", available_for_trade: false, listingType: "trade" });
      setSelectedFile(null);
      setImagePreview(null);
      toast.success("Trikot hinzugefügt!");
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
      const { error } = await supabase.from("user_jerseys").update({ available_for_trade: available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jerseys"] });
      toast.success("Trikot ist jetzt zum Tausch verfügbar!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleSale = useMutation({
    mutationFn: async ({ id, forSale }: { id: string; forSale: boolean }) => {
      const { error } = await supabase.from("user_jerseys").update({ is_for_sale: forSale }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jerseys"] });
      toast.success("Trikot ist jetzt zum Verkauf verfügbar!");
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
              setSelectedFile(null);
              setImagePreview(null);
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
                    <Input placeholder="FC Bayern München" value={form.team} onChange={(e) => setForm(f => ({ ...f, team: e.target.value }))} required maxLength={200} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Liga</Label>
                    <Input placeholder="Bundesliga" value={form.league} onChange={(e) => setForm(f => ({ ...f, league: e.target.value }))} maxLength={100} />
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
                <div className="space-y-2">
                  <Label>Bild</Label>
                  {imagePreview ? (
                    <div className="relative aspect-square overflow-hidden rounded-sm border border-border bg-secondary">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed border-border bg-secondary/50 px-4 py-8 hover:border-primary hover:bg-secondary/80 transition">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium">Bild hochladen</span>
                      <span className="text-xs text-muted-foreground mt-1">JPG, PNG oder WebP (max. 5MB)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setImagePreview(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
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
                  </div>
                )}
                <Button type="submit" variant="hero" className="w-full uppercase tracking-wider" disabled={addJersey.isPending || isUploadingImage}>
                  {addJersey.isPending || isUploadingImage ? "Wird verarbeitet..." : "Trikot speichern"}
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
                      {jersey.is_for_sale && <Badge variant="default" className="text-[10px]">Kaufen</Badge>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{jersey.condition}/5 · {conditionLabels[jersey.condition]}</span>
                    {jersey.sale_price_cents && jersey.is_for_sale && <span className="font-semibold text-foreground">{formatEuros(jersey.sale_price_cents)}</span>}
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
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
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
                            <ArrowLeftRight className="h-3 w-3" /> Tauschbar
                          </span>
                        ) : "Privat"}
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
                        <p className="text-xs text-muted-foreground">Schätzpreis</p>
                        <p className="font-semibold">{selectedJersey.price_cents ? formatEuros(selectedJersey.price_cents) : "—"}</p>
                      </div>
                    </div>
                    {selectedJersey.is_for_sale && selectedJersey.sale_price_cents && (
                      <div>
                        <p className="text-xs text-muted-foreground">Verkaufspreis</p>
                        <p className="font-semibold text-lg text-primary">{formatEuros(selectedJersey.sale_price_cents)}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 border-t border-border pt-6">
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
                    {selectedJersey.is_for_sale ? (
                      <Badge variant="default" className="w-full justify-center py-2">
                        Zum Verkauf
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSale.mutate({ id: selectedJersey.id, forSale: true });
                        }}
                        disabled={toggleSale.isPending}
                      >
                        {toggleSale.isPending ? "Wird verarbeitet..." : "Zum Verkauf anbieten"}
                      </Button>
                    )}
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

export default Collection;
