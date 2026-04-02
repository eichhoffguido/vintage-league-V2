import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, ArrowLeftRight, ArrowRight } from "lucide-react";
import { useEffect } from "react";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Ausstehend", variant: "outline" },
  accepted: { label: "Angenommen", variant: "default" },
  declined: { label: "Abgelehnt", variant: "destructive" },
  completed: { label: "Abgeschlossen", variant: "secondary" },
};

const Trades = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trade-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trade_requests")
        .select(`
          *,
          requester_jersey:user_jerseys!trade_requests_requester_jersey_id_fkey(id, name, team, league, year, condition, size, image_url, price_estimate, user_id, profiles!user_jerseys_user_id_fkey(display_name)),
          owner_jersey:user_jerseys!trade_requests_owner_jersey_id_fkey(id, name, team, league, year, condition, size, image_url, price_estimate, user_id, profiles!user_jerseys_user_id_fkey(display_name))
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const updateTrade = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("trade_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["trade-requests"] });
      toast.success(status === "accepted" ? "Tausch angenommen!" : "Tausch abgelehnt");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (authLoading) return null;

  const incomingTrades = trades.filter((t: any) => (t.owner_jersey as any)?.user_id === user?.id);
  const outgoingTrades = trades.filter((t: any) => (t.requester_jersey as any)?.user_id === user?.id);

  const TradeCard = ({ trade, isIncoming }: { trade: any; isIncoming: boolean }) => {
    const reqJersey = trade.requester_jersey;
    const ownJersey = trade.owner_jersey;
    const status = statusLabels[trade.status] || statusLabels.pending;

    return (
      <div className="rounded-sm border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
          <span className="text-[10px] text-muted-foreground">
            {new Date(trade.created_at).toLocaleDateString("de-DE")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Requester's jersey */}
          <div className="flex-1 rounded-sm border border-border bg-secondary/50 p-3">
            <p className="text-[10px] text-muted-foreground">
              {isIncoming ? `${(reqJersey?.profiles as any)?.display_name || "Anonym"} bietet` : "Du bietest"}
            </p>
            <p className="font-display text-sm font-semibold">{reqJersey?.team}</p>
            <p className="text-xs text-muted-foreground">{reqJersey?.name}</p>
            <p className="text-[10px] text-muted-foreground">{reqJersey?.size} · {reqJersey?.condition}/5</p>
          </div>

          <ArrowLeftRight className="h-5 w-5 shrink-0 text-primary" />

          {/* Owner's jersey */}
          <div className="flex-1 rounded-sm border border-border bg-secondary/50 p-3">
            <p className="text-[10px] text-muted-foreground">
              {isIncoming ? "Dein Trikot" : `${(ownJersey?.profiles as any)?.display_name || "Anonym"}'s Trikot`}
            </p>
            <p className="font-display text-sm font-semibold">{ownJersey?.team}</p>
            <p className="text-xs text-muted-foreground">{ownJersey?.name}</p>
            <p className="text-[10px] text-muted-foreground">{ownJersey?.size} · {ownJersey?.condition}/5</p>
          </div>
        </div>

        {trade.message && (
          <p className="mt-3 rounded-sm bg-secondary/30 p-2 text-xs italic text-muted-foreground">
            „{trade.message}"
          </p>
        )}

        {isIncoming && trade.status === "pending" && (
          <div className="mt-3 flex gap-2">
            <Button
              variant="hero"
              size="sm"
              className="flex-1 uppercase tracking-wider"
              onClick={() => updateTrade.mutate({ id: trade.id, status: "accepted" })}
              disabled={updateTrade.isPending}
            >
              <Check className="mr-1 h-4 w-4" /> Annehmen
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => updateTrade.mutate({ id: trade.id, status: "declined" })}
              disabled={updateTrade.isPending}
            >
              <X className="mr-1 h-4 w-4" /> Ablehnen
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <h1 className="mb-8 font-display text-4xl font-bold">Meine Tausch-Anfragen</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Lade Anfragen...</p>
        ) : trades.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-12 text-center">
            <ArrowLeftRight className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-display text-xl text-muted-foreground">Noch keine Tausch-Anfragen</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/trade")}>
              Zur Tauschbörse <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 font-display text-xl font-semibold">
                Eingehend <Badge variant="secondary" className="ml-2">{incomingTrades.length}</Badge>
              </h2>
              <div className="space-y-3">
                {incomingTrades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine eingehenden Anfragen</p>
                ) : incomingTrades.map((t: any) => <TradeCard key={t.id} trade={t} isIncoming />)}
              </div>
            </div>
            <div>
              <h2 className="mb-4 font-display text-xl font-semibold">
                Ausgehend <Badge variant="secondary" className="ml-2">{outgoingTrades.length}</Badge>
              </h2>
              <div className="space-y-3">
                {outgoingTrades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine ausgehenden Anfragen</p>
                ) : outgoingTrades.map((t: any) => <TradeCard key={t.id} trade={t} isIncoming={false} />)}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Trades;
