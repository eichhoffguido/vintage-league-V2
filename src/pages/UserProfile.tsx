import { useEffect, useRef, useState } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/compressImage";
import { getPrimaryImage } from "@/utils/jerseyImage";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { formatEuros } from "@/utils/currency";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import SectionHeader from "@/components/layout/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { COMMON_TEAMS } from "@/data/teams-leagues";
import { FavoriteTeamBadge } from "@/components/FavoriteTeamBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeftRight, Upload, Shirt, AlertCircle, Edit2, CheckCircle2 } from "lucide-react";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";
import { ProfilePageSkeleton } from "@/components/ProfilePageSkeleton";
import { CONDITION_LABELS as conditionLabels } from "@/data/condition";
import DeleteJerseyDialog, { type DeleteJerseyTarget } from "@/components/DeleteJerseyDialog";
import DeleteAccountSection from "@/components/profile/DeleteAccountSection";

// Figurina-Optik für die eigene Sammlung (Skill cc-design §6). Rahmenfarbe rein dekorativ, stabil pro Trikot.
const FRAME_COLORS = ["border-verde", "border-azzurro", "border-giallo", "border-rosso"] as const;
const frameColorFor = (id: string) =>
  FRAME_COLORS[[...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % FRAME_COLORS.length];
const TAG = "inline-flex items-center border px-[7px] py-1 font-body text-[10px] font-medium uppercase leading-none tracking-[0.14em]";

const UserProfile = () => {
  const page = useSiteContent("profile");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedJersey, setSelectedJersey] = useState<any>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [jerseyToDelete, setJerseyToDelete] = useState<DeleteJerseyTarget | null>(null);
  const [profileForm, setProfileForm] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
    favorite_team: "",
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
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profileForm.display_name.trim() || null,
          bio: profileForm.bio.trim() || null,
          favorite_team: profileForm.favorite_team.trim() || null,
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

  // Upload profile avatar
  const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // matches the avatars bucket's file_size_limit
  const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Bitte lade ein JPG-, PNG- oder WebP-Bild hoch.");
      }

      const compressed = await compressImage(file, { maxDimension: 512, maxBytes: AVATAR_MAX_BYTES, square: true });

      // Fixed per-user path (required by the avatars bucket's RLS policies)
      // so re-uploading always replaces the previous avatar.
      const path = `${user!.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      // Cache-bust: the path never changes on re-upload, so without this the
      // browser may keep showing the previous cached image at that URL.
      const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user!.id);
      if (profileError) throw profileError;

      return avatarUrl;
    },
    onSuccess: (avatarUrl) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      setProfileForm((f) => ({ ...f, avatar_url: avatarUrl }));
      toast.success("Profilbild aktualisiert!");
    },
    onError: (e: any) => toast.error(e.message || "Profilbild-Upload fehlgeschlagen."),
  });

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadAvatar.mutate(file);
  };

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setProfileForm({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
        favorite_team: profile.favorite_team || "",
      });
    }
  }, [profile]);

  if (authLoading) return null;

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (profileLoading || jerseysLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PageHeader tone="verde" eyebrow={page.header.eyebrow} headline={page.header.headline} />
        <ProfilePageSkeleton />
        <Footer />
      </div>
    );
  }

  const totalValue = jerseys.reduce((sum, jersey) => sum + (jersey.price_cents || 0), 0);
  const initials = (profileForm.display_name || user?.email || "U").split(" ").map(n => n[0]).join("").toUpperCase();

  // Calculate profile completion
  const profileFields = [
    { name: "Anzeigename", filled: !!profileForm.display_name, nudge: "Füge deinen Anzeigenamen hinzu" },
    { name: "Bio", filled: !!profileForm.bio, nudge: "Erzähl uns etwas über dich" },
    { name: "Profilbild", filled: !!profileForm.avatar_url, nudge: "Lade ein Profilfoto hoch" },
    { name: "Trikot", filled: jerseys.length > 0, nudge: "Füge dein erstes Trikot hinzu" },
  ];
  const completedFields = profileFields.filter(f => f.filled).length;
  const completionPercentage = (completedFields / profileFields.length) * 100;
  const incompleteFields = profileFields.filter(f => !f.filled);

  const stats = [
    { label: "Trikots in Sammlung", value: String(jerseys.length) },
    { label: "Gesamtwert", value: formatEuros(totalValue) },
    { label: "Zum Tausch verfügbar", value: String(jerseys.filter(j => j.available_for_trade).length) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Persönlicher Bereich → grünes Kopfband (Skill cc-design §5.1) */}
      <PageHeader tone="verde" eyebrow={page.header.eyebrow} headline={page.header.headline}>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="flex min-w-0 items-start gap-4 md:gap-6">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 rounded-full border border-nero md:h-24 md:w-24">
                {profileForm.avatar_url && <AvatarImage src={profileForm.avatar_url} />}
                <AvatarFallback className="rounded-full bg-sabbia font-display text-xl font-bold text-nero">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {editMode && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadAvatar.isPending}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-nero/60 text-avorio opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 disabled:opacity-100"
                    aria-label="Profilbild ändern"
                  >
                    {uploadAvatar.isPending ? (
                      <span className="cap text-[10px]">Lädt…</span>
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="break-words font-display text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
                {profileForm.display_name || user?.email?.split("@")[0] || "Benutzer"}
              </h2>
              {profileForm.bio && (
                <p className="mt-2 max-w-md text-avorio/85">{profileForm.bio}</p>
              )}
              <FavoriteTeamBadge team={profileForm.favorite_team} className="mt-3" />
              <p className="cap mt-3 break-all text-[11px] text-avorio/75">{user?.email}</p>
            </div>
          </div>
          {!editMode ? (
            <Button variant="light" onClick={() => setEditMode(true)}>
              <Edit2 className="h-4 w-4" /> Profil bearbeiten
            </Button>
          ) : null}
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 py-10 md:px-10 md:py-16">
        {/* Profilstatus + Kennzahlen */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          {/* Profile Completion Indicator */}
          <div className="border-2 border-nero bg-card p-5 md:p-6">
            <div className="cap text-[11px] text-rosso">Il profilo · Profilstatus</div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-display text-lg font-semibold tracking-[-0.02em]">
                {completionPercentage === 100 ? "Dein Profil ist vollständig! 🎉" : "Profil zu " + Math.round(completionPercentage) + "% fertig"}
              </span>
              {completionPercentage === 100 && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-verde" />
              )}
            </div>
            <Progress value={completionPercentage} className="mt-4 h-2.5 rounded-none border border-nero bg-carta" />
            {incompleteFields.length > 0 && (
              <ul className="mt-4 border-t border-nero">
                {incompleteFields.map(field => (
                  <li key={field.name} className="border-b border-nero py-2.5 text-sm text-muted-foreground">
                    {field.nudge}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Statistics */}
          <dl className="grid grid-cols-1 self-start border-t border-nero sm:grid-cols-3 sm:border-b">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex items-baseline justify-between gap-4 border-b border-nero py-4 sm:flex-col sm:items-start sm:justify-start sm:gap-2 sm:border-b-0 sm:py-6 ${i > 0 ? "sm:border-l sm:pl-5" : ""}`}
              >
                <dt className="cap text-[11px] text-muted-foreground">{stat.label}</dt>
                <dd className="num text-[30px] leading-none md:text-[38px]">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Edit Mode */}
        {editMode && (
          <div className="mt-8 border-2 border-nero bg-card p-5 md:p-8">
            <div className="cap text-[11px] text-rosso">Modifica · Bearbeiten</div>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em]">Profil bearbeiten</h2>
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label className="cap text-[11px]">Profilbild</Label>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadAvatar.isPending}
                  >
                    <Upload className="h-4 w-4" /> {uploadAvatar.isPending ? "Lädt…" : "Profilbild ändern"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="cap text-[11px]">Anzeigename</Label>
                <Input
                  value={profileForm.display_name}
                  onChange={(e) => setProfileForm(f => ({ ...f, display_name: e.target.value }))}
                  placeholder="Dein Name"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label className="cap text-[11px]">Bio</Label>
                <Textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Erzähle etwas über deine Sammlung..."
                  maxLength={500}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label className="cap text-[11px]">Lieblingsverein</Label>
                <Combobox
                  options={COMMON_TEAMS}
                  value={profileForm.favorite_team}
                  onChange={(value) => setProfileForm(f => ({ ...f, favorite_team: value }))}
                  placeholder="z.B. Borussia Dortmund"
                  maxLength={100}
                  strict
                />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={() => updateProfile.mutate()}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Wird gespeichert..." : "Speichern"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  disabled={updateProfile.isPending}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        )}
        {editMode && <DeleteAccountSection />}

        {/* Collection Section */}
        <SectionHeader
          className="mb-6 mt-14 border-b border-nero pb-5 md:mb-8 md:mt-20"
          size="md"
          eyebrow={page.collection.eyebrow}
          headline={page.collection.headline}
          subline={`${jerseys.length} Trikots`}
        />

        {jerseysLoading ? (
          <div className="grid grid-cols-2 gap-2.5 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <JerseyCardSkeleton key={i} />
            ))}
          </div>
        ) : jerseysError ? (
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
            <p className="mt-2 text-sm text-muted-foreground">Gehe zu deiner Sammlung und füge dein erstes Trikot hinzu.</p>
            <Button className="mt-5" onClick={() => navigate("/collection")}>
              <Plus className="h-4 w-4" /> Zur Sammlung
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {jerseys.map((jersey) => (
              <div
                key={jersey.id}
                className="group flex cursor-pointer flex-col gap-2.5 border-2 border-nero bg-card p-2 md:gap-3 md:p-3"
                onClick={() => {
                  setSelectedJersey(jersey);
                  setDetailSheetOpen(true);
                }}
              >
                {/* Kopfzeile */}
                <div className="cap truncate text-[10px] md:text-[11px]">
                  {jersey.league} · {jersey.year}
                </div>

                {/* Bild mit farbigem Rahmen */}
                <div className={`grain grain-photo relative aspect-[4/5] overflow-hidden border-[4px] bg-sabbia md:border-[6px] ${frameColorFor(jersey.id)}`}>
                  {getPrimaryImage(jersey) ? (
                    <img
                      src={getPrimaryImage(jersey)!}
                      alt={jersey.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="display text-6xl text-nero/25">{jersey.team.charAt(0)}</span>
                    </div>
                  )}
                  {jersey.size && (
                    <div className="absolute bottom-1.5 left-1.5 z-[2]">
                      <span className={`${TAG} border-nero bg-card text-nero`}>{jersey.size}</span>
                    </div>
                  )}
                </div>

                {/* Titel */}
                <div>
                  <h3 className="font-display text-[15px] font-semibold leading-tight tracking-[-0.02em] md:text-[17px]">{jersey.team}</h3>
                  <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground md:text-sm">{jersey.name}</p>
                </div>

                {/* Meta */}
                <div className="cap truncate text-[10px] text-muted-foreground">
                  {jersey.condition}/5 · {conditionLabels[jersey.condition]}
                </div>

                {jersey.available_for_trade && (
                  <div className="flex flex-wrap gap-1">
                    <span className={`${TAG} gap-1 border-rosso text-rosso`}>
                      <ArrowLeftRight className="h-3 w-3" /> Tauschbar
                    </span>
                  </div>
                )}

                {/* Preiszeile */}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-nero pt-2">
                  {jersey.price_cents ? (
                    <span className="num text-xl leading-none md:text-2xl">{formatEuros(jersey.price_cents)}</span>
                  ) : (
                    <span />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-mr-1 h-11 w-11 shrink-0 text-muted-foreground hover:bg-transparent hover:text-rosso"
                    aria-label="Trikot entfernen"
                    onClick={(e) => {
                      e.stopPropagation();
                      setJerseyToDelete({ id: jersey.id, team: jersey.team, name: jersey.name });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Jersey Detail Sheet */}
        <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto border-l-2 border-nero bg-card sm:max-w-md">
            {selectedJersey && (
              <>
                <SheetHeader>
                  <div className="cap text-[11px] text-rosso">La maglia · Trikot</div>
                  <SheetTitle className="font-display text-2xl font-semibold tracking-[-0.02em]">{selectedJersey.team}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Jersey Image */}
                  {getPrimaryImage(selectedJersey) ? (
                    <div className={`grain grain-photo relative aspect-[4/5] overflow-hidden border-[6px] bg-sabbia ${frameColorFor(selectedJersey.id)}`}>
                      <img src={getPrimaryImage(selectedJersey)!} alt={selectedJersey.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className={`flex aspect-[4/5] items-center justify-center border-[6px] bg-sabbia ${frameColorFor(selectedJersey.id)}`}>
                      <span className="display text-7xl text-nero/25">{selectedJersey.team.charAt(0)}</span>
                    </div>
                  )}

                  {/* Jersey Info */}
                  <dl className="border-t border-nero">
                    {[
                      { label: "Name", value: selectedJersey.name },
                      { label: "Liga", value: selectedJersey.league || "—" },
                      { label: "Saison", value: selectedJersey.year || "—" },
                      { label: "Größe", value: selectedJersey.size },
                      { label: "Zustand", value: `${selectedJersey.condition}/5` },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-4 border-b border-nero py-3">
                        <dt className="cap text-[11px] text-muted-foreground">{row.label}</dt>
                        <dd className="text-right">{row.value}</dd>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-4 border-b border-nero py-3">
                      <dt className="cap text-[11px] text-muted-foreground">Preis</dt>
                      <dd className="num text-2xl leading-none">{selectedJersey.price_cents ? formatEuros(selectedJersey.price_cents) : "—"}</dd>
                    </div>
                  </dl>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {selectedJersey.available_for_trade ? (
                      <Badge variant="tag-rosso" className="w-full justify-center py-3.5 text-[11px]">
                        <ArrowLeftRight className="mr-1 h-4 w-4" /> Im Tausch
                      </Badge>
                    ) : (
                      <Button className="w-full" onClick={() => navigate("/collection")}>
                        Sammlung bearbeiten →
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        <DeleteJerseyDialog jersey={jerseyToDelete} onClose={() => setJerseyToDelete(null)} />
      </div>
      <Footer />
    </div>
  );
};

export default UserProfile;
