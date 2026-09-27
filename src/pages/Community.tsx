import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Plus } from "lucide-react";
import { COMMUNITY_ICONS, isCategoryVisible } from "@/content/communityIcons";
import { LikeButton } from "@/components/LikeButton";
import { useLikes } from "@/hooks/useLikes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUploader from "@/components/ImageUploader";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import Headline from "@/components/brand/Headline";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { authPath } from "@/utils/postLoginRedirect";
import type { Tables } from "@/integrations/supabase/types";
import { authorName } from "@/utils/authorName";

const CategoryIcon = ({ name }: { name: string | null }) => {
  const entry = name ? COMMUNITY_ICONS[name] : undefined;
  return entry ? <entry.icon className="h-3.5 w-3.5" /> : null;
};

const TAG = "inline-flex items-center border px-[7px] py-1 font-body text-[10px] font-medium uppercase leading-none tracking-[0.14em]";
const CHIP = "cap flex shrink-0 items-center gap-2 border border-nero px-3.5 py-2.5 text-[11px] transition-colors md:text-xs";
const LABEL = "cap text-[11px] leading-none text-nero";

/** Erstes Bild eines Beitrags: angehängtes Foto, sonst erstes <img> (z. B. GIF) im Text. */
const coverImage = (post: { image_urls: string[] | null; content: string }): string | null =>
  post.image_urls?.[0] ?? post.content.match(/<img[^>]+src="([^"]+)"/i)?.[1] ?? null;

// Kreis-Akzente auf der Bildecke (Kreisgeometrie der Startseite, Skill cc-design §5) —
// stabil pro Beitrag, damit die Kacheln abwechslungsreich, aber ruhig wirken.
const ACCENTS = [
  { circle: "h-[72px] w-[72px] bg-giallo", pos: "right-0 top-0 translate-x-1/2 -translate-y-1/2", aspect: "aspect-[16/10]" },
  { circle: "h-11 w-11 bg-rosso", pos: "right-0 top-0 translate-x-1/2 -translate-y-1/2", aspect: "aspect-[4/3]" },
  { circle: "h-24 w-24 border-2 border-nero", pos: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", aspect: "aspect-[16/10]" },
  { circle: "h-[72px] w-[72px] bg-giallo", pos: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", aspect: "aspect-[4/3]" },
  { circle: "h-8 w-8 bg-rosso", pos: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2", aspect: "aspect-[16/10]" },
] as const;
const accentFor = (id: string) => ACCENTS[[...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % ACCENTS.length];

const Community = () => {
  const page = useSiteContent("community");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [newPost, setNewPost] = useState({ title: "", content: "", category_id: "", images: [] as string[] });

  const resetDialog = () => {
    setNewPost({ title: "", content: "", category_id: "", images: [] });
  };

  const { data: allCategories = [], isError: categoriesError } = useQuery({
    queryKey: ["forum-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("forum_categories").select("*").order("sort_order");
      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
      if (!data) return [];
      return data;
    },
  });

  // Ausgeblendete Kategorien (CMS → Community-Kategorien) erscheinen nicht als Chip und nicht im Dialog
  const categories = allCategories.filter(isCategoryVisible);

  const { data: postsRaw = [], isLoading } = useQuery({
    queryKey: ["forum-posts", activeCategory],
    queryFn: async () => {
      let query = supabase
        .from("forum_posts")
        .select("*, forum_categories(*)")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (activeCategory !== "all") {
        query = query.eq("category_id", activeCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data) return [];

      // Fetch profiles and comment counts
      const userIds = [...new Set(data.map((p) => p.user_id))];
      const postIds = data.map((p) => p.id);

      // Fetch with graceful error handling
      const [profilesResult, commentsResult] = await Promise.all([
        supabase.from("profiles").select("*").in("id", userIds).then(r => ({ data: r.data, error: r.error })),
        supabase.from("forum_comments").select("post_id").in("post_id", postIds).then(r => ({ data: r.data, error: r.error })),
      ]);

      const profileMap: Record<string, Tables<"profiles">> = {};
      profilesResult.data?.forEach((p) => { profileMap[p.id] = p; });

      const countMap: Record<string, number> = {};
      commentsResult.data?.forEach((c) => { countMap[c.post_id] = (countMap[c.post_id] || 0) + 1; });

      return data.map((p) => ({ ...p, profiles: profileMap[p.user_id] || null, comment_count: countMap[p.id] || 0 }));
    },
    // Beiträge nur für Mitglieder (RLS erlaubt Gästen kein Lesen, Migration 20260928100000)
    enabled: !!user,
  });

  // Gäste sehen nur die Anzahl (öffentliche Funktion, keine Inhalte)
  const { data: postCount } = useQuery({
    queryKey: ["community-post-count"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("community_post_count");
      if (error) throw error;
      return data ?? 0;
    },
    enabled: !authLoading && !user,
  });

  const postIds = useMemo(() => postsRaw.map((p) => p.id), [postsRaw]);
  const { likeCount, isLikedByMe, toggleLike } = useLikes(postIds);

  // Filter and sort posts client-side
  const posts = postsRaw
    .filter((post) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Pinned posts always come first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Then apply selected sort
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "most-comments":
          return b.comment_count - a.comment_count;
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const textContent = newPost.content.replace(/<[^>]*>/g, "").trim();
      if (!newPost.title.trim() || !textContent || !newPost.category_id) {
        throw new Error("Bitte alle Felder ausfüllen");
      }
      const { error } = await supabase.from("forum_posts").insert({
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        category_id: newPost.category_id,
        user_id: user.id,
        image_urls: newPost.images,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Beitrag erstellt!");
      resetDialog();
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Fehler beim Erstellen");
    },
  });

  const handleCreatePost = () => {
    if (!user) { navigate("/auth"); return; }
    createPostMutation.mutate();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Seitenkopf: schwarzes Band (Skill cc-design §5.1) */}
      <PageHeader
        tone="nero"
        eyebrow={page.header.eyebrow}
        headline={page.header.headline}
        subline={page.header.subline}
      >
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button variant="light" onClick={() => { if (!user) navigate(authPath("/community")); }}>
              <Plus className="h-4 w-4" /> Beitrag erstellen
            </Button>
          </DialogTrigger>
          {user && (
            <DialogContent className="max-h-[90vh] overflow-y-auto shadow-none sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-semibold normal-case tracking-[-0.02em]">Neuer Beitrag</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-1">
                {categoriesError && (
                  <div className="border border-rosso bg-rosso/5 p-3 text-sm text-rosso">
                    Fehler beim Laden der Kategorien. Bitte versuche es später erneut.
                  </div>
                )}
                <div className="space-y-2">
                  <Label className={LABEL}>Kategorie</Label>
                  <Select value={newPost.category_id} onValueChange={(v) => setNewPost((p) => ({ ...p, category_id: v }))}>
                    <SelectTrigger disabled={categories.length === 0}><SelectValue placeholder={categories.length === 0 ? "Kategorien werden geladen …" : "Kategorie wählen"} /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-title" className={LABEL}>Titel</Label>
                  <Input id="post-title" placeholder="Worum geht es?" value={newPost.title} onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))} maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label className={LABEL}>Beitrag</Label>
                  <RichTextEditor content={newPost.content} onChange={(v) => setNewPost((p) => ({ ...p, content: v }))} maxLength={5000} placeholder="Dein Beitrag …" />
                </div>
                <ImageUploader images={newPost.images} onImagesChange={(imgs) => setNewPost((p) => ({ ...p, images: imgs }))} />
                <Button onClick={handleCreatePost} disabled={createPostMutation.isPending || categories.length === 0} className="w-full">
                  {createPostMutation.isPending ? "Wird veröffentlicht …" : "Veröffentlichen →"}
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </PageHeader>

      {!user ? (
        /* Gäste: Mitglieder-Teaser statt Beiträgen */
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4 md:px-10">
            {!authLoading && (
              <div className="relative overflow-hidden border-2 border-nero bg-card p-6 md:p-10">
                <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-giallo md:-right-14 md:-top-14 md:h-44 md:w-44" />
                <div className="relative max-w-2xl">
                  <div className="cap text-[11px] text-rosso">{page.teaser.eyebrow}</div>
                  <h2 className="display mt-3 text-[32px] md:text-[52px]">
                    <Headline text={page.teaser.headline} />
                  </h2>
                  <p className="mt-4 text-base text-muted-foreground md:text-lg">
                    {page.teaser.text}{" "}
                    {postCount ? (
                      <>Schon <span className="num text-lg text-nero">{postCount}</span> Beiträge zu Restaurierung, Pflege, Echtheit und Fundstücken warten auf dich.</>
                    ) : (
                      "Tipps zu Restaurierung, Pflege und Echtheit warten auf dich."
                    )}
                  </p>
                  {categories.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <span key={cat.id} className={cn(TAG, "border-nero text-nero")}>{cat.name}</span>
                      ))}
                    </div>
                  )}
                  <Button className="mt-8" onClick={() => navigate(authPath("/community"))}>
                    {page.teaser.cta}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
      /* Werkzeugleiste + Beiträge */
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-10">
          {/* Suche · Sortierung (wie Marktplatz) */}
          <div className="mb-4 flex flex-wrap items-stretch gap-2 md:gap-3">
            <input
              type="text"
              placeholder="Beiträge durchsuchen …"
              aria-label="Beiträge durchsuchen"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 min-w-0 flex-[1_1_100%] border border-nero bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:flex-[1_1_240px] md:text-sm"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sortierung"
              className="cap h-11 flex-1 border border-nero bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:flex-none"
            >
              <option value="newest">Neueste</option>
              <option value="oldest">Älteste</option>
              <option value="most-comments">Meiste Antworten</option>
            </select>
          </div>

          {/* Kategorien als Chips — mobil horizontal scrollbar */}
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label="Kategorien">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              className={cn(CHIP, activeCategory === "all" ? "bg-nero text-avorio" : "hover:bg-nero/5")}
            >
              Alle
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(CHIP, activeCategory === cat.id ? "bg-nero text-avorio" : "hover:bg-nero/5")}
              >
                <CategoryIcon name={cat.icon} />
                {cat.name}
              </button>
            ))}
          </div>

          {/* Trefferzahl */}
          <div className="cap mb-5 border-b border-nero pb-3 text-[11px] text-muted-foreground">
            <span className="num mr-1 text-base text-nero">{posts.length}</span> {posts.length === 1 ? "Beitrag" : "Beiträge"}
          </div>

          {/* Beiträge */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 animate-pulse border-2 border-nero bg-sabbia" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="border-2 border-nero bg-card px-6 py-12 text-center">
              <MessageSquare className="mx-auto mb-4 h-10 w-10" />
              <p className="font-display text-lg font-semibold">
                {searchQuery ? "Keine Beiträge zu deiner Suche." : "Noch keine Beiträge in dieser Kategorie."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => navigate(`/community/${post.id}`)}
                  className="group relative flex h-full flex-col items-stretch overflow-hidden border-2 border-nero bg-card p-4 text-left md:p-5"
                >
                  {/* Titelbild mit Kreis-Akzent auf der Ecke — nur wenn der Beitrag ein Bild hat */}
                  {(() => {
                    const cover = coverImage(post);
                    if (!cover) return null;
                    const accent = accentFor(post.id);
                    return (
                      <div className="relative mb-4">
                        <div className={cn("grain grain-photo overflow-hidden border-2 border-nero bg-sabbia", accent.aspect)}>
                          <img
                            src={cover}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                        <span aria-hidden className={cn("pointer-events-none absolute z-[2] rounded-full", accent.circle, accent.pos)} />
                      </div>
                    );
                  })()}

                  {/* Kopfzeile: Anpinnung + Kategorie */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {post.pinned && <span className={cn(TAG, "border-verde bg-verde text-avorio")}>Angepinnt</span>}
                    {post.forum_categories && (
                      <span className={cn(TAG, "border-nero text-nero")}>{post.forum_categories.name}</span>
                    )}
                  </div>

                  <h3 className="mt-3 line-clamp-2 font-display normal-case text-[19px] font-semibold leading-tight tracking-[-0.02em] decoration-1 underline-offset-4 group-hover:underline md:text-[21px]">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-base leading-snug text-muted-foreground">
                    {post.content.replace(/<[^>]*>/g, "")}
                  </p>

                  {/* Meta: Autor · Datum | Antworten · Likes — unten angeheftet */}
                  <div className="min-h-4 flex-1" />
                  <div className="flex items-center justify-between gap-3 border-t border-nero pt-1">
                    <div className="cap min-w-0 truncate text-[10px] text-muted-foreground md:text-[11px]">
                      {authorName(post.user_id, post.profiles)} · {formatDate(post.created_at)}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="num flex items-center gap-1.5 text-sm text-muted-foreground" aria-label={`${post.comment_count} Antworten`}>
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post.comment_count}
                      </span>
                      <LikeButton
                        liked={isLikedByMe(post.id)}
                        count={likeCount(post.id)}
                        pending={toggleLike.isPending && toggleLike.variables === post.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) { navigate("/auth"); return; }
                          toggleLike.mutate(post.id);
                        }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      <Footer />
    </div>
  );
};

export default Community;
