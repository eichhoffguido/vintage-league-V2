import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import { useSiteContent } from "@/hooks/useSiteContent";
import TradeShirts from "@/components/trade/TradeShirts";
import JerseyCard from "@/components/JerseyCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeftRight } from "lucide-react";
import { useEffect } from "react";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";
import { CONDITION_LABELS as conditionLabels } from "@/data/condition";
import { getPrimaryImage } from "@/utils/jerseyImage";
import { authPath } from "@/utils/postLoginRedirect";

const LABEL = "cap text-[11px] leading-none text-nero";

const Trade = () => {
  const page = useSiteContent("trade");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedJersey, setSelectedJersey] = useState<any>(null);
  const [myOfferJerseyId, setMyOfferJerseyId] = useState("");
  const [message, setMessage] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!authLoading && !user) navigate(authPath("/trade"));
  }, [authLoading, user, navigate]);

  // Available jerseys from OTHER users
  const { data: availableJerseys = [], isLoading } = useQuery({
    queryKey: ["trade-jerseys", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_jerseys")
        .select("*")
        .eq("available_for_trade", true)
        .neq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // user_jerseys hat keinen FK auf profiles (user_id → auth.users) — Namen separat laden.
      const userIds = [...new Set(data.map((j) => j.user_id))];
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
        : { data: [] };
      const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
      return data.map((j) => ({ ...j, profiles: { display_name: nameById.get(j.user_id) ?? null } }));
    },
    enabled: !!user,
  });

  // Einstieg von der Detailseite: /trade?jersey=<id> öffnet direkt den Dialog.
  const preselectId = searchParams.get("jersey");
  useEffect(() => {
    if (!preselectId || !user || isLoading) return;
    const target = availableJerseys.find((j) => j.id === preselectId);
    if (target) setSelectedJersey(target);
    else toast.error("Dieses Trikot ist nicht (mehr) zum Tausch verfügbar.");
    setSearchParams({}, { replace: true });
  }, [preselectId, user, isLoading, availableJerseys, setSearchParams]);

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
    onError: (e: Error) => toast.error(e.message),
  });

  if (authLoading) return null;

  const selectedImage = selectedJersey ? getPrimaryImage(selectedJersey) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Seitenkopf nero mit Trikot-Silhouetten (Skill cc-design §5.1) */}
      <PageHeader
        tone="nero"
        eyebrow={page.header.eyebrow}
        headline={page.header.headline}
        subline={page.header.subline}
        aside={<TradeShirts />}
      >
        <Button variant="outline" className="border-avorio text-avorio hover:bg-avorio hover:text-nero" onClick={() => navigate("/trades")}>
          Meine Tausch-Anfragen →
        </Button>
      </PageHeader>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-10">
          {!isLoading && availableJerseys.length > 0 && (
            <div className="cap mb-5 border-b border-nero pb-3 text-[11px] text-muted-foreground">
              <span className="num mr-1 text-base text-nero">{availableJerseys.length}</span> Trikots zum Tausch
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 gap-2.5 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <JerseyCardSkeleton key={i} />
              ))}
            </div>
          ) : availableJerseys.length === 0 ? (
            <div className="border-2 border-nero bg-card px-6 py-12 text-center">
              <ArrowLeftRight className="mx-auto mb-4 h-10 w-10" />
              <p className="font-display text-lg font-semibold">Aktuell keine Trikots zum Tausch verfügbar.</p>
              <p className="mt-2 text-base text-muted-foreground">Markiere deine eigenen Trikots als tauschbar, um loszulegen.</p>
              <Button variant="outline" className="mt-6" onClick={() => navigate("/collection")}>
                Zur Sammlung →
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {availableJerseys.map((jersey: any) => (
                <JerseyCard
                  key={jersey.id}
                  id={jersey.id}
                  name={jersey.name}
                  team={jersey.team}
                  league={jersey.league}
                  year={jersey.year}
                  price_cents={jersey.price_cents}
                  imageUrl={getPrimaryImage(jersey) ?? undefined}
                  verification_status={jersey.verification_status}
                  condition={jersey.condition as 1 | 2 | 3 | 4 | 5}
                  size={jersey.size}
                  available_for_trade={jersey.available_for_trade}
                  listing_type={jersey.listing_type}
                  user_id={jersey.user_id}
                  sale_price_cents={jersey.sale_price_cents}
                  onClick={() => navigate(`/jersey/${jersey.id}`)}
                  footer={
                    <div className="space-y-2">
                      <div className="cap truncate text-[10px] text-muted-foreground">
                        Sammler: <span className="text-nero">{jersey.profiles?.display_name || "Anonym"}</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full px-2 text-[10px] md:text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJersey(jersey);
                        }}
                      >
                        Tausch vorschlagen ⇄
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tausch vorschlagen */}
      <Dialog open={!!selectedJersey} onOpenChange={(open) => !open && setSelectedJersey(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto shadow-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold normal-case tracking-[-0.02em]">Tausch vorschlagen</DialogTitle>
          </DialogHeader>
          {selectedJersey && (
            <div className="space-y-5">
              {/* Gewünschtes Trikot */}
              <div className="flex gap-3 border border-nero bg-background p-3">
                <div className="h-20 w-16 shrink-0 border-2 border-nero bg-sabbia">
                  {selectedImage ? (
                    <img src={selectedImage} alt={`${selectedJersey.team} ${selectedJersey.name}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-2xl text-nero/40">{selectedJersey.team.charAt(0)}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="cap text-[10px] text-rosso">Du möchtest</div>
                  <p className="mt-1 font-display text-[17px] font-semibold leading-tight tracking-[-0.02em]">{selectedJersey.team}</p>
                  <p className="text-sm text-muted-foreground">{selectedJersey.name}</p>
                  <p className="cap mt-1 text-[10px] text-muted-foreground">
                    {selectedJersey.size} · {conditionLabels[selectedJersey.condition]}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className={LABEL}>Dein Trikot zum Tauschen *</Label>
                {myJerseys.length === 0 ? (
                  <div className="border border-dashed border-nero p-4 text-center">
                    <p className="mb-3 text-base text-muted-foreground">Du hast noch keine Trikots in deiner Sammlung.</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedJersey(null);
                        navigate("/collection");
                      }}
                      className="w-full"
                    >
                      Zur Sammlung →
                    </Button>
                  </div>
                ) : (
                  <Select value={myOfferJerseyId} onValueChange={setMyOfferJerseyId}>
                    <SelectTrigger><SelectValue placeholder="Wähle ein Trikot aus deiner Sammlung" /></SelectTrigger>
                    <SelectContent>
                      {myJerseys.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.team} — {j.name} ({j.size}, {conditionLabels[j.condition]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-message" className={LABEL}>Nachricht (optional)</Label>
                <Textarea
                  id="trade-message"
                  placeholder="Hallo! Ich interessiere mich für dein Trikot …"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                />
              </div>

              <Button
                className="w-full"
                disabled={!myOfferJerseyId || proposeTrade.isPending}
                onClick={() => proposeTrade.mutate()}
              >
                {proposeTrade.isPending ? "Wird gesendet …" : "Tausch-Anfrage senden ⇄"}
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
