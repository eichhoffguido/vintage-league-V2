import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Plus, Wrench, Shield, Search, TrendingUp, Trophy, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const iconMap: Record<string, React.ReactNode> = {
  Wrench: <Wrench className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Search: <Search className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Trophy: <Trophy className="h-5 w-5" />,
};

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Tables<"forum_categories">[]>([]);
  const [posts, setPosts] = useState<(Tables<"forum_posts"> & { profiles?: Tables<"profiles"> | null; forum_categories?: Tables<"forum_categories"> | null; comment_count?: number })[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category_id: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [activeCategory]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("forum_categories").select("*").order("sort_order");
    if (data) setCategories(data);
  };

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from("forum_posts")
      .select("*, profiles(*), forum_categories(*)")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (activeCategory !== "all") {
      query = query.eq("category_id", activeCategory);
    }

    const { data } = await query;
    if (data) {
      // Fetch comment counts
      const postIds = data.map((p) => p.id);
      const { data: comments } = await supabase
        .from("forum_comments")
        .select("post_id")
        .in("post_id", postIds);

      const countMap: Record<string, number> = {};
      comments?.forEach((c) => {
        countMap[c.post_id] = (countMap[c.post_id] || 0) + 1;
      });

      setPosts(data.map((p) => ({ ...p, comment_count: countMap[p.id] || 0 })));
    }
    setLoading(false);
  };

  const handleCreatePost = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!newPost.title.trim() || !newPost.content.trim() || !newPost.category_id) {
      toast({ title: "Bitte alle Felder ausfüllen", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("forum_posts").insert({
      title: newPost.title.trim(),
      content: newPost.content.trim(),
      category_id: newPost.category_id,
      user_id: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Fehler beim Erstellen", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Beitrag erstellt!" });
      setNewPost({ title: "", content: "", category_id: "" });
      setDialogOpen(false);
      fetchPosts();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="grain relative border-b border-border bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-px w-6 bg-primary/50" />
            <span className="font-display text-xs tracking-[0.2em] text-primary">COMMUNITY</span>
          </div>
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Wissen <span className="text-gradient">teilen</span>
          </h1>
          <p className="mt-3 max-w-lg font-serif italic text-muted-foreground">
            Tipps zur Restaurierung, Pflege und Lagerung — von Sammlern für Sammler.
          </p>
          <div className="mt-6">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" className="uppercase tracking-wider" onClick={() => { if (!user) navigate("/auth"); }}>
                  <Plus className="mr-2 h-4 w-4" /> Beitrag erstellen
                </Button>
              </DialogTrigger>
              {user && (
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-display">Neuer Beitrag</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <Select value={newPost.category_id} onValueChange={(v) => setNewPost((p) => ({ ...p, category_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Titel" value={newPost.title} onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))} maxLength={200} />
                    <Textarea placeholder="Dein Beitrag..." value={newPost.content} onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))} rows={6} maxLength={5000} />
                    <Button onClick={handleCreatePost} disabled={submitting} className="w-full uppercase tracking-wider">
                      {submitting ? "Wird erstellt..." : "Veröffentlichen"}
                    </Button>
                  </div>
                </DialogContent>
              )}
            </Dialog>
          </div>
        </div>
      </section>

      {/* Categories + Posts */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Category filter */}
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`rounded-sm border px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                activeCategory === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Alle
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 rounded-sm border px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeCategory === cat.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {cat.icon && iconMap[cat.icon]}
                {cat.name}
              </button>
            ))}
          </div>

          {/* Posts list */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-sm border border-border bg-secondary/30" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">Noch keine Beiträge in dieser Kategorie.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => navigate(`/community/${post.id}`)}
                  className="group flex w-full items-start gap-4 rounded-sm border border-border bg-card p-5 text-left transition-colors hover:border-primary/30 hover:bg-secondary/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {post.pinned && (
                        <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          Angepinnt
                        </span>
                      )}
                      {post.forum_categories && (
                        <span className="rounded-sm border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {post.forum_categories.name}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-base font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.profiles?.display_name || "Anonym"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(post.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.comment_count} {post.comment_count === 1 ? "Antwort" : "Antworten"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Community;
