import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeftRight, Send } from "lucide-react";
import { useEffect } from "react";

const conditionLabels: Record<number, string> = {
  5: "Neuwertig", 4: "Sehr gut", 3: "Gut erhalten", 2: "Gebraucht", 1: "Sammlerstück",
};

const Trade = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedJersey, setSelectedJersey] = useState<any>(null);
  const [myOfferJerseyId, setMyOfferJerseyId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // Available jerseys from OTHER users
  const { data: availableJerseys = [], isLoading } = useQuery({
    queryKey: ["trade-jerseys", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_jerseys")
        .select("*, profiles!user_jerseys_user_id_fkey(display_name)")
        .eq("available_for_trade", true)
        .neq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // My jerseys (to offer in trade)
  const { data: myJerseys = [] } = useQuery({
    queryKey: ["my-jerseys-for-trade", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_jerseys")
        .select("*")
        .eq("user_id", user!.id)
        .order("team");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const proposeTrade = useMutation({
    mutationFn: async () => {
      if (!myOfferJerseyId || !selectedJersey) throw new Error("Bitte wähle ein Trikot zum Tauschen");
      const { error } = await supabase.from("trade_requests").insert({
        requester_jersey_id: myOfferJerseyId,
        owner_jersey_id: selectedJersey.id,
        message: message.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tausch-Anfrage gesendet!");
      setSelectedJersey(null);
      setMyOfferJerseyId("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["trade-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold">Tauschbörse</h1>
          <p className="mt-1 text-muted-foreground">Finde Trikots anderer Sammler und schlage einen Tausch vor</p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Lade verfügbare Trikots...</p>
        ) : availableJerseys.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-12 text-center">
            <ArrowLeftRight className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-display text-xl text-muted-foreground">Aktuell keine Trikots zum Tausch verfügbar</p>
            <p className="mt-2 text-sm text-muted-foreground">Markiere deine eigenen Trikots als tauschbar, um loszulegen!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {availableJerseys.map((jersey: any) => (
              <div key={jersey.id} className="group overflow-hidden rounded-sm border border-border bg-card transition-colors hover:border-primary/30">
                {jersey.image_url ? (
                  <div className="aspect-square overflow-hidden bg-secondary">
                    <img src={jersey.image_url} alt={jersey.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-secondary">
                    <span className="font-display text-4xl text-muted-foreground/30">{jersey.team.charAt(0)}</span>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">{jersey.league} · {jersey.year}</p>
                  <h3 className="font-display text-lg font-semibold">{jersey.team}</h3>
                  <p className="text-sm text-muted-foreground">{jersey.name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{jersey.size}</Badge>
                    <span className="text-xs text-muted-foreground">{jersey.condition}/5 · {conditionLabels[jersey.condition]}</span>
                  </div>
                  {jersey.price_estimate && (
                    <p className="mt-1 text-sm font-semibold text-primary">≈ €{jersey.price_estimate}</p>
                  )}
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Sammler: {(jersey.profiles as any)?.display_name || "Anonym"}
                  </p>
                  <Button
                    variant="hero"
                    size="sm"
                    className="mt-3 w-full uppercase tracking-wider"
                    onClick={() => setSelectedJersey(jersey)}
                  >
                    <ArrowLeftRight className="mr-2 h-4 w-4" /> Tausch vorschlagen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trade proposal dialog */}
      <Dialog open={!!selectedJersey} onOpenChange={(open) => !open && setSelectedJersey(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Tausch vorschlagen</DialogTitle>
          </DialogHeader>
          {selectedJersey && (
            <div className="space-y-4">
              <div className="rounded-sm border border-border bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground">Du möchtest tauschen gegen:</p>
                <p className="font-display font-semibold">{selectedJersey.team} — {selectedJersey.name}</p>
                <p className="text-xs text-muted-foreground">{selectedJersey.condition}/5 · {selectedJersey.size}</p>
              </div>

              <div className="space-y-2">
                <Label>Dein Trikot zum Tauschen *</Label>
                <Select value={myOfferJerseyId} onValueChange={setMyOfferJerseyId}>
                  <SelectTrigger><SelectValue placeholder="Wähle ein Trikot aus deiner Sammlung" /></SelectTrigger>
                  <SelectContent>
                    {myJerseys.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.team} — {j.name} ({j.size}, {j.condition}/5)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {myJerseys.length === 0 && (
                  <p className="text-xs text-destructive">Du hast noch keine Trikots in deiner Sammlung.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nachricht (optional)</Label>
                <Textarea
                  placeholder="Hallo! Ich interessiere mich für dein Trikot..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                />
              </div>

              <Button
                variant="hero"
                className="w-full uppercase tracking-wider"
                disabled={!myOfferJerseyId || proposeTrade.isPending}
                onClick={() => proposeTrade.mutate()}
              >
                <Send className="mr-2 h-4 w-4" />
                {proposeTrade.isPending ? "Wird gesendet..." : "Tausch-Anfrage senden"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Trade;
