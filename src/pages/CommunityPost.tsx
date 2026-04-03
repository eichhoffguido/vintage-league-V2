import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MessageSquare, Clock, User, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type PostWithRelations = Tables<"forum_posts"> & {
  profiles?: Tables<"profiles"> | null;
  forum_categories?: Tables<"forum_categories"> | null;
};

type CommentWithProfile = Tables<"forum_comments"> & {
  profiles?: Tables<"profiles"> | null;
};

const CommunityPost = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) { fetchPost(); fetchComments(); }
  }, [id]);

  const fetchPost = async () => {
    const { data } = await supabase
      .from("forum_posts")
      .select("*, profiles(*), forum_categories(*)")
      .eq("id", id!)
      .single();
    setPost(data);
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("forum_comments")
      .select("*, profiles(*)")
      .eq("post_id", id!)
      .order("created_at", { ascending: true });
    if (data) setComments(data);
  };

  const handleAddComment = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!newComment.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("forum_comments").insert({
      post_id: id!,
      user_id: user.id,
      content: newComment.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      setNewComment("");
      fetchComments();
    }
  };

  const handleDeletePost = async () => {
    if (!post || post.user_id !== user?.id) return;
    const { error } = await supabase.from("forum_posts").delete().eq("id", post.id);
    if (!error) { navigate("/community"); }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from("forum_comments").delete().eq("id", commentId);
    if (!error) fetchComments();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="h-64 animate-pulse rounded-sm border border-border bg-secondary/30" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Beitrag nicht gefunden.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/community")}>Zurück zur Community</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-8">
        <div className="container mx-auto max-w-3xl px-4">
          {/* Back link */}
          <Link to="/community" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Zurück zur Community
          </Link>

          {/* Post */}
          <article className="rounded-sm border border-border bg-card p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {post.forum_categories && (
                <span className="rounded-sm border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {post.forum_categories.name}
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">{post.title}</h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.profiles?.display_name || "Anonym"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(post.created_at)}
              </span>
            </div>
            <div className="vintage-divider my-6" />
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {post.content}
            </div>
            {user?.id === post.user_id && (
              <div className="mt-6 flex justify-end">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDeletePost}>
                  <Trash2 className="mr-2 h-4 w-4" /> Löschen
                </Button>
              </div>
            )}
          </article>

          {/* Comments */}
          <div className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
              <MessageSquare className="h-5 w-5 text-primary" />
              {comments.length} {comments.length === 1 ? "Antwort" : "Antworten"}
            </h2>

            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-sm border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {comment.profiles?.display_name || "Anonym"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    {user?.id === comment.user_id && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteComment(comment.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>

            {/* New comment */}
            <div className="mt-6 rounded-sm border border-border bg-card p-4">
              {user ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Deine Antwort..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    maxLength={2000}
                  />
                  <Button onClick={handleAddComment} disabled={submitting || !newComment.trim()} size="sm" className="uppercase tracking-wider">
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? "Wird gesendet..." : "Antworten"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Melde dich an, um zu antworten.</p>
                  <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>Login</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CommunityPost;
