import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle, XCircle, Loader2, Star } from "lucide-react";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin status
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    const checkAdmin = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (error || !data?.is_admin) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
    };

    if (user) checkAdmin();
  }, [user, authLoading, navigate]);

  // Fetch pending jerseys
  const { data: jerseys = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-pending-jerseys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_jerseys")
        .select(`
          *,
          profiles:user_id (display_name)
        `)
        .eq("verification_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  // Toggle featured mutation
  const toggleFeatured = useMutation({
    mutationFn: async ({ jerseyId, isFeatured }: { jerseyId: string; isFeatured: boolean | null }) => {
      const { error } = await supabase
        .from("user_jerseys")
        .update({ is_featured: !isFeatured })
        .eq("id", jerseyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-jerseys"] });
      toast.success("Featured-Status aktualisiert!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Fetch counts
  const { data: counts = { pending: 0, verified: 0, rejected: 0 } } = useQuery({
    queryKey: ["admin-verification-counts"],
    queryFn: async () => {
      const { count: pending } = await supabase
        .from("user_jerseys")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "pending");

      const { count: verified } = await supabase
        .from("user_jerseys")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "verified");

      const { count: rejected } = await supabase
        .from("user_jerseys")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "rejected");

      return {
        pending: pending || 0,
        verified: verified || 0,
        rejected: rejected || 0,
      };
    },
    enabled: isAdmin === true,
  });

  // Verify jersey mutation
  const verifyJersey = useMutation({
    mutationFn: async (jerseyId: string) => {
      const { error } = await supabase
        .from("user_jerseys")
        .update({
          verification_status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: user!.id,
        })
        .eq("id", jerseyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-jerseys"] });
      queryClient.invalidateQueries({ queryKey: ["admin-verification-counts"] });
      toast.success("Trikot verifiziert!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Reject jersey mutation
  const rejectJersey = useMutation({
    mutationFn: async (jerseyId: string) => {
      const { error } = await supabase
        .from("user_jerseys")
        .update({
          verification_status: "rejected",
        })
        .eq("id", jerseyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-jerseys"] });
      queryClient.invalidateQueries({ queryKey: ["admin-verification-counts"] });
      toast.success("Trikot abgelehnt");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (authLoading || isAdmin === null) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-5xl font-bold md:text-7xl flex items-center gap-3">
            <ShieldCheck className="h-12 w-12 text-primary" />
            Admin Panel
          </h1>
          <p className="mt-2 text-muted-foreground">Trikot-Verifizierung verwalten</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <p className="text-sm text-muted-foreground">Ausstehend</p>
            </div>
            <p className="mt-2 font-display text-4xl font-bold">{counts.pending}</p>
          </div>
          <div className="rounded-sm border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <p className="text-sm text-muted-foreground">Verifiziert</p>
            </div>
            <p className="mt-2 font-display text-4xl font-bold">{counts.verified}</p>
          </div>
          <div className="rounded-sm border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <p className="text-sm text-muted-foreground">Abgelehnt</p>
            </div>
            <p className="mt-2 font-display text-4xl font-bold">{counts.rejected}</p>
          </div>
        </div>

        {/* Pending Jerseys */}
        <h2 className="mb-6 font-display text-3xl font-bold">Ausstehende Trikots</h2>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-sm border border-border bg-card">
                <div className="aspect-square bg-secondary" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-secondary" />
                  <div className="h-4 w-1/2 rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : jerseys.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-12 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500/30" />
            <p className="font-display text-xl text-muted-foreground">Keine ausstehenden Trikots</p>
            <p className="mt-2 text-sm text-muted-foreground">Alle Trikots wurden geprüft.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {jerseys.map((jersey: any) => (
              <div key={jersey.id} className="overflow-hidden rounded-sm border border-border bg-card">
                {jersey.image_url ? (
                  <div className="aspect-square overflow-hidden bg-secondary">
                    <img src={jersey.image_url} alt={jersey.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-secondary">
                    <span className="font-display text-4xl text-muted-foreground/30">{jersey.team.charAt(0)}</span>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">{jersey.league} · {jersey.year}</p>
                  <h3 className="font-display text-xl font-semibold">{jersey.team}</h3>
                  <p className="text-sm text-muted-foreground">{jersey.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Eingereicht von: {jersey.profiles?.display_name || "Unbekannt"}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Größe: {jersey.size}</span>
                    <span>Zustand: {jersey.condition}/5</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => verifyJersey.mutate(jersey.id)}
                      disabled={verifyJersey.isPending || rejectJersey.isPending}
                    >
                      {verifyJersey.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" /> Verifizieren
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => rejectJersey.mutate(jersey.id)}
                      disabled={verifyJersey.isPending || rejectJersey.isPending}
                    >
                      {rejectJersey.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" /> Ablehnen
                        </>
                      )}
                    </Button>
                    <Button
                      variant={jersey.is_featured ? "default" : "outline"}
                      size="sm"
                      className={jersey.is_featured ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                      onClick={() => toggleFeatured.mutate({ jerseyId: jersey.id, isFeatured: jersey.is_featured })}
                      disabled={toggleFeatured.isPending}
                      title="Als featured markieren"
                    >
                      {toggleFeatured.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Star className={`h-4 w-4 ${jersey.is_featured ? "fill-current" : ""}`} />
                      )}
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

export default Admin;
