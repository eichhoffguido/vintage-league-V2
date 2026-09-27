import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import RichTextEditor from "@/components/RichTextEditor";
import RichTextViewer from "@/components/RichTextViewer";
import ImageUploader from "@/components/ImageUploader";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLikes } from "@/hooks/useLikes";
import { LikeButton } from "@/components/LikeButton";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { authorName } from "@/utils/authorName";

type PostWithRelations = Tables<"forum_posts"> & {
  profiles?: Tables<"profiles"> | null;
  forum_categories?: Tables<"forum_categories"> | null;
};

type CommentWithProfile = Tables<"forum_comments"> & {
  profiles?: Tables<"profiles"> | null;
};

const TAG = "inline-flex items-center border px-[7px] py-1 font-body text-[10px] font-medium uppercase leading-none tracking-[0.14em]";

/** Bilder zu Beitrag/Antwort: 2 px nero Rahmen, eckig (Skill cc-design §4). */
const AttachedImages = ({ urls }: { urls: string[] | null }) =>
  urls && urls.length > 0 ? (
    <div className="mt-5 flex flex-wrap gap-3">
      {urls.map((url, i) => (
        <img key={i} src={url} alt={`Bild ${i + 1}`} className="max-h-72 max-w-full border-2 border-nero object-contain" />
      ))}
    </div>
  ) : null;

const CommunityPost = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  // Rückfrage vor dem Löschen: "post" oder die ID einer Antwort
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "post" } | { kind: "comment"; id: string } | null>(null);
  const { likeCount, isLikedByMe, toggleLike } = useLikes(post ? [post.id] : []);

  useEffect(() => {
    if (id) { fetchPost(); fetchComments(); }
  }, [id]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("forum_posts")
      .select("*, forum_categories(*)")
      .eq("id", id!)
      .maybeSingle();
    if (error) {
      toast({ title: "Fehler beim Laden", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    if (data) {
      // Use maybeSingle() so a missing profile (deleted user) doesn't crash the page.
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user_id).maybeSingle();
      setPost({ ...data, profiles: profile ?? null });
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("forum_comments")
      .select("*")
      .eq("post_id", id!)
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Fehler beim Laden", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").in("id", userIds);
      if (profilesError) {
        toast({ title: "Fehler beim Laden", description: profilesError.message, variant: "destructive" });
        return;
      }
      const profileMap: Record<string, Tables<"profiles">> = {};
      profiles?.forEach((p) => { profileMap[p.id] = p; });
      setComments(data.map((c) => ({ ...c, profiles: profileMap[c.user_id] || null })));
    }
  };

  const handleAddComment = async () => {
    if (!user) { navigate("/auth"); return; }
    const textContent = newComment.replace(/<[^>]*>/g, "").trim();
    if (!textContent) return;
    setSubmitting(true);
    const { error } = await supabase.from("forum_comments").insert({
      post_id: id!,
      user_id: user.id,
      content: newComment.trim(),
      image_urls: commentImages,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      setNewComment("");
      setCommentImages([]);
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "post") await handleDeletePost();
    else await handleDeleteComment(deleteTarget.id);
    setDeleteTarget(null);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="nero-stripe h-56 md:h-72" />
        <div className="container mx-auto max-w-3xl px-4 py-10">
          <div className="h-64 animate-pulse border-2 border-nero bg-sabbia" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="font-display text-2xl font-semibold">Beitrag nicht gefunden.</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate("/community")}>Zurück zur Community</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Kopfband nero: Kategorie, Titel, Autor, Likes (Skill cc-design §5.1) */}
      <section className="nero-stripe">
        <div className="container mx-auto max-w-3xl px-4 py-10 md:py-16">
          <Link to="/community" className="cap inline-flex min-h-11 items-center gap-2 text-[11px] text-avorio/75 hover:text-avorio">
            <ArrowLeft className="h-4 w-4" /> Zurück zur Community
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {post.pinned && <span className={cn(TAG, "border-verde bg-verde text-avorio")}>Angepinnt</span>}
            {post.forum_categories && <span className={cn(TAG, "border-avorio text-avorio")}>{post.forum_categories.name}</span>}
          </div>
          <h1 className="mt-4 font-display normal-case text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[48px]">{post.title}</h1>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-avorio/35 pt-3">
            <div className="cap text-[11px] text-avorio/75">
              {authorName(post.user_id, post.profiles)} · {formatDate(post.created_at)}
            </div>
            <LikeButton
              size="md"
              className={isLikedByMe(post.id) ? "text-avorio" : "text-avorio/60 hover:text-avorio"}
              liked={isLikedByMe(post.id)}
              count={likeCount(post.id)}
              pending={toggleLike.isPending}
              onClick={() => {
                if (!user) { navigate("/auth"); return; }
                toggleLike.mutate(post.id);
              }}
            />
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-3xl px-4">
          {/* Beitrag */}
          <article>
            <div className="prose prose-cc max-w-none">
              <RichTextViewer content={post.content} />
            </div>
            <AttachedImages urls={post.image_urls} />
            {user?.id === post.user_id && (
              <div className="mt-8 flex justify-end">
                <Button variant="outline" className="hover:border-rosso hover:bg-rosso" onClick={() => setDeleteTarget({ kind: "post" })}>
                  <Trash2 className="h-4 w-4" /> Beitrag löschen
                </Button>
              </div>
            )}
          </article>

          {/* Antworten */}
          <div className="mt-12 md:mt-16">
            <h2 className="flex items-baseline gap-3 border-b-2 border-nero pb-3">
              <span className="num text-[38px] leading-none">{comments.length}</span>
              <span className="display text-[26px] md:text-[34px]">{comments.length === 1 ? "Antwort" : "Antworten"}</span>
            </h2>

            <ol>
              {comments.map((comment) => (
                <li key={comment.id} className="border-b border-nero py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="cap text-[10px] text-muted-foreground md:text-[11px]">
                      <span className="text-nero">{authorName(comment.user_id, comment.profiles)}</span> · {formatDate(comment.created_at)}
                    </div>
                    {user?.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="-mr-2 h-11 w-11 text-muted-foreground hover:bg-transparent hover:text-rosso"
                        aria-label="Antwort löschen"
                        onClick={() => setDeleteTarget({ kind: "comment", id: comment.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="prose prose-cc mt-2 max-w-none">
                    <RichTextViewer content={comment.content} />
                  </div>
                  <AttachedImages urls={comment.image_urls} />
                </li>
              ))}
            </ol>

            {/* Neue Antwort */}
            <div className="mt-8 border-2 border-nero bg-card p-4 md:p-5">
              {user ? (
                <div className="space-y-4">
                  <div className="cap text-[11px] text-nero">Deine Antwort</div>
                  <RichTextEditor
                    content={newComment}
                    onChange={(v) => setNewComment(v)}
                    maxLength={2000}
                    placeholder="Deine Antwort …"
                  />
                  <ImageUploader images={commentImages} onImagesChange={setCommentImages} />
                  <Button onClick={handleAddComment} disabled={submitting || !newComment.replace(/<[^>]*>/g, "").trim()}>
                    {submitting ? "Wird gesendet …" : "Antworten →"}
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="mb-4 text-base text-muted-foreground">Melde dich an, um zu antworten.</p>
                  <Button variant="outline" onClick={() => navigate("/auth")}>Anmelden →</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Rückfrage vor dem Löschen */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.kind === "post" ? "Beitrag wirklich löschen?" : "Antwort wirklich löschen?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.kind === "post"
                ? "Der Beitrag verschwindet mit allen Antworten aus der Community."
                : "Die Antwort verschwindet aus der Diskussion."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction className="border-rosso bg-rosso text-avorio hover:bg-rosso/90" onClick={confirmDelete}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default CommunityPost;
