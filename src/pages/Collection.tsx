import { useState } from "react";
import { eurosToCents, formatEuros } from "@/utils/currency";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useJerseyImageUpload } from "@/hooks/useJerseyImageUpload";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeftRight, Upload, X, Shirt, AlertCircle } from "lucide-react";
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
  const [form, setForm] = useState({
    name: "", team: "", league: "", year: "", condition: "3", size: "M",
    image_url: "", price_cents: "", available_for_trade: false,
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
        available_for_trade: form.available_for_trade,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jerseys"] });
      setDialogOpen(false);
      setForm({ name: "", team: "", league: "", year: "", condition: "3", size: "M", image_url: "", price_cents: "", available_for_trade: false });
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-jerseys"] }),
  });

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold">Meine Sammlung</h1>
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
                <div className="flex items-center gap-3">
                  <Switch checked={form.available_for_trade} onCheckedChange={(v) => setForm(f => ({ ...f, available_for_trade: v }))} />
                  <Label>Zum Tausch verfügbar</Label>
                </div>
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
              <div key={jersey.id} className="overflow-hidden rounded-sm border border-border bg-card">
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
                      <h3 className="font-display text-lg font-semibold">{jersey.team}</h3>
                      <p className="text-sm text-muted-foreground">{jersey.name}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{jersey.size}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{jersey.condition}/5 · {conditionLabels[jersey.condition]}</span>
                    {jersey.price_cents && <span className="font-semibold text-foreground">{formatEuros(jersey.price_cents)}</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-2">
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteJersey.mutate(jersey.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Collection;
