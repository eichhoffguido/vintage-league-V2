import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { formatEuros } from "@/utils/currency";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeftRight, Upload, X, Shirt, AlertCircle, Edit2, Loader2 } from "lucide-react";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";

const conditionLabels: Record<number, string> = {
  5: "Neuwertig",
  4: "Sehr gut",
  3: "Gut erhalten",
  2: "Gebraucht",
  1: "Sammlerstück",
};

const UserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedJersey, setSelectedJersey] = useState<any>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user jerseys
  const { data: jerseys = [], isLoading: jerseysLoading, isError: jerseysError, error, refetch } = useQuery({
    queryKey: ["user-jerseys", user?.id],
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

  // Upload avatar
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Nur JPG, PNG und WebP sind erlaubt");
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Datei muss kleiner als 2MB sein");
      }

      // Upload to Supabase Storage
      const filePath = `${user!.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user!.id);

      if (updateError) throw updateError;

      return data.publicUrl;
    },
    onSuccess: (avatarUrl) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      setProfileForm(f => ({ ...f, avatar_url: avatarUrl }));
      setAvatarPreview(null);
      toast.success("Avatar hochgeladen!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profileForm.display_name.trim() || null,
          bio: profileForm.bio.trim() || null,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      setEditMode(false);
      toast.success("Profil aktualisiert!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete jersey
  const deleteJersey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_jerseys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-jerseys"] });
      toast.success("Trikot entfernt");
    },
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setProfileForm({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      uploadAvatar.mutate(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (authLoading || profileLoading) return null;

  const totalValue = jerseys.reduce((sum, jersey) => sum + (jersey.price_cents || 0), 0);
  const initials = (profileForm.display_name || user?.email || "U").split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        {/* Profile Section */}
        <div className="mb-12 rounded-sm border border-border bg-card p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20 rounded-sm">
                {profileForm.avatar_url && <AvatarImage src={profileForm.avatar_url} />}
                <AvatarFallback className="rounded-sm bg-secondary text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-display text-3xl font-bold">
                  {profileForm.display_name || user?.email?.split("@")[0] || "Benutzer"}
                </h1>
                {profileForm.bio && (
                  <p className="mt-2 max-w-md text-muted-foreground">{profileForm.bio}</p>
                )}
                <p className="mt-3 text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            {!editMode ? (
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
                className="border-primary/30"
              >
                <Edit2 className="mr-2 h-4 w-4" /> Profil bearbeiten
              </Button>
            ) : null}
          </div>

          {/* Edit Mode */}
          {editMode && (
            <div className="mt-8 space-y-4 border-t border-border pt-8">
              <div className="space-y-2">
                <Label>Profilbild</Label>
                <div className="flex items-end gap-4">
                  <Avatar className="h-24 w-24 rounded-sm">
                    {avatarPreview || profileForm.avatar_url ? (
                      <AvatarImage src={avatarPreview || profileForm.avatar_url} />
                    ) : null}
                    <AvatarFallback className="rounded-sm bg-secondary text-lg font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadAvatar.isPending}
                    >
                      {uploadAvatar.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Wird hochgeladen...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Ändern
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG oder WebP • Max. 2MB
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Anzeigename</Label>
                <Input
                  value={profileForm.display_name}
                  onChange={(e) => setProfileForm(f => ({ ...f, display_name: e.target.value }))}
                  placeholder="Dein Name"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Erzähle etwas über deine Sammlung..."
                  maxLength={500}
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="hero"
                  onClick={() => updateProfile.mutate()}
                  disabled={updateProfile.isPending || uploadAvatar.isPending}
                  className="uppercase tracking-wider"
                >
                  {updateProfile.isPending ? "Wird gespeichert..." : "Speichern"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    setAvatarPreview(null);
                  }}
                  disabled={updateProfile.isPending || uploadAvatar.isPending}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Trikots in Sammlung</p>
            <p className="font-display text-4xl font-bold">{jerseys.length}</p>
          </div>
          <div className="rounded-sm border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Gesamtwert</p>
            <p className="font-display text-4xl font-bold">{formatEuros(totalValue)}</p>
          </div>
          <div className="rounded-sm border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Zum Tausch verfügbar</p>
            <p className="font-display text-4xl font-bold">
              {jerseys.filter(j => j.available_for_trade).length}
            </p>
          </div>
        </div>

        {/* Collection Section */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold">Meine Sammlung</h2>
          <p className="mt-1 text-muted-foreground">{jerseys.length} Trikots</p>
        </div>

        {jerseysLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <JerseyCardSkeleton key={i} />
            ))}
          </div>
        ) : jerseysError ? (
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
            <p className="mt-2 text-sm text-muted-foreground">Gehe zu deiner Sammlung und füge dein erstes Trikot hinzu.</p>
            <Button
              variant="hero"
              className="mt-4 uppercase tracking-wider"
              onClick={() => navigate("/collection")}
            >
              <Plus className="mr-2 h-4 w-4" /> Zur Sammlung
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
                    {jersey.available_for_trade && (
                      <span className="text-xs flex items-center gap-1 text-primary">
                        <ArrowLeftRight className="h-3 w-3" /> Tauschbar
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive ml-auto"
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
                        <p className="text-xs text-muted-foreground">Preis</p>
                        <p className="font-semibold">{selectedJersey.price_cents ? formatEuros(selectedJersey.price_cents) : "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 border-t border-border pt-6">
                    {selectedJersey.available_for_trade ? (
                      <Badge variant="default" className="w-full justify-center py-2">
                        <ArrowLeftRight className="mr-2 h-4 w-4" /> Im Tausch
                      </Badge>
                    ) : (
                      <Button variant="hero" className="w-full uppercase tracking-wider" onClick={() => navigate("/collection")}>
                        Sammlung bearbeiten
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

export default UserProfile;
