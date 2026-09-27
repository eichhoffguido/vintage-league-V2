import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatEuros } from "@/utils/currency";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useCreateTradeRating, useUpdateTradeStatus, useConfirmTradeCompletion } from "@/hooks/useTradeRating";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import TradeShirts from "@/components/trade/TradeShirts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, ArrowLeftRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CONDITION_LABELS as conditionLabels } from "@/data/condition";
import { getPrimaryImage } from "@/utils/jerseyImage";
import { authPath } from "@/utils/postLoginRedirect";

const TAG = "inline-flex items-center border px-[7px] py-1 font-body text-[10px] font-medium uppercase leading-none tracking-[0.14em]";
const CHIP = "cap flex shrink-0 items-center gap-2 border border-nero px-3.5 py-2.5 text-[11px] transition-colors md:text-xs";

// Status-Tags nach Status-Tokens (Skill cc-design §2): warning=giallo (nero Text), success=verde, danger=rosso
const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Ausstehend", className: "border-giallo bg-giallo text-nero" },
  accepted: { label: "Angenommen", className: "border-verde bg-verde text-avorio" },
  declined: { label: "Abgelehnt", className: "border-rosso text-rosso" },
  completed: { label: "Abgeschlossen", className: "border-nero bg-nero text-avorio" },
};

const SwapDisc = () => (
  <div aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full bg-verde text-avorio md:h-11 md:w-11">
    <ArrowLeftRight className="h-4 w-4 md:h-5 md:w-5" />
  </div>
);

/** Eine Seite des Tauschs: Bild im Rahmen + Team, Name, Größe · Zustand, Richtwert. */
const TradeSide = ({ label, jersey }: { label: string; jersey: any }) => {
  const image = jersey ? getPrimaryImage(jersey) : null;
  return (
    <div className="min-w-0 flex-1">
      <div className="cap truncate text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-2 aspect-[4/5] w-full border-2 border-nero bg-sabbia">
        {image ? (
          <img src={image} alt={jersey ? `${jersey.team} ${jersey.name}` : ""} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-3xl text-nero/40">{jersey?.team?.charAt(0)}</div>
        )}
      </div>
      <p className="mt-2 truncate font-display text-[15px] font-semibold leading-tight tracking-[-0.02em] md:text-[17px]">{jersey?.team}</p>
      <p className="truncate text-sm text-muted-foreground">{jersey?.name}</p>
      <p className="cap mt-1 text-[10px] text-muted-foreground">
        {jersey?.size} · {conditionLabels[jersey?.condition] ?? "–"}
      </p>
      {jersey?.price_cents && <p className="num mt-1 text-base">≈ {formatEuros(jersey.price_cents)}</p>}
    </div>
  );
};

const Trades = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [ratingTradeId, setRatingTradeId] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const createRating = useCreateTradeRating();
  const updateStatus = useUpdateTradeStatus();
  const confirmCompletion = useConfirmTradeCompletion();

  useEffect(() => {
    if (!authLoading && !user) navigate(authPath("/trades"));
  }, [authLoading, user, navigate]);

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trade-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trade_requests")
        .select(`
          *,
          requester_jersey:user_jerseys!trade_requests_requester_jersey_id_fkey(id, name, team, league, year, condition, size, image_url, image_urls, price_cents, user_id),
          owner_jersey:user_jerseys!trade_requests_owner_jersey_id_fkey(id, name, team, league, year, condition, size, image_url, image_urls, price_cents, user_id),
          confirmations:trade_confirmations(user_id)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // user_jerseys hat keinen FK auf profiles (user_id → auth.users) — Namen separat laden.
      const userIds = [...new Set(data.flatMap((t) => [t.requester_jersey?.user_id, t.owner_jersey?.user_id]).filter(Boolean))] as string[];
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
        : { data: [] };
      const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
      const withName = (j: any) => (j ? { ...j, profiles: { display_name: nameById.get(j.user_id) ?? null } } : j);
      return data.map((t) => ({ ...t, requester_jersey: withName(t.requester_jersey), owner_jersey: withName(t.owner_jersey) })) as any[];
    },
    enabled: !!user,
  });

  const updateTrade = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "accepted" | "declined" | "completed" }) => {
      // If accepting a trade, deactivate both jerseys
      if (status === "accepted") {
        // Fetch the trade to get the jersey IDs
        const { data: trade, error: fetchError } = await supabase
          .from("trade_requests")
          .select("requester_jersey_id, owner_jersey_id")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;

        // Fetch both jerseys to get their current sale_price_cents
        const { data: jerseys, error: jerseysFetchError } = await supabase
          .from("user_jerseys")
          .select("id, sale_price_cents")
          .in("id", [trade.requester_jersey_id, trade.owner_jersey_id]);

        if (jerseysFetchError) throw jerseysFetchError;

        // Deactivate both jerseys and update listing_type
        for (const jersey of jerseys) {
          // When deactivating for trade, update listing_type:
          // - If has sale price, set to "buy_now"
          // - Otherwise, set to "trade_only"
          const newListingType = jersey.sale_price_cents ? "buy_now" : "trade_only";

          const { error: updateError } = await supabase
            .from("user_jerseys")
            .update({ available_for_trade: false, listing_type: newListingType })
            .eq("id", jersey.id);

          if (updateError) throw updateError;
        }
      }

      // Update trade status
      const { error } = await supabase
        .from("trade_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["trade-requests"] });
      if (status === "accepted") {
        queryClient.invalidateQueries({ queryKey: ["trade-jerseys"] });
      }
      toast.success(status === "accepted" ? "Tausch angenommen!" : "Tausch abgelehnt");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (authLoading) return null;

  const filterTrades = (trades: any[]) => {
    let filtered = trades;
    if (selectedStatusFilter) {
      filtered = filtered.filter((t: any) => t.status === selectedStatusFilter);
    }
    return filtered;
  };

  const incomingTrades = filterTrades(trades.filter((t: any) => (t.owner_jersey as any)?.user_id === user?.id));
  const outgoingTrades = filterTrades(trades.filter((t: any) => (t.requester_jersey as any)?.user_id === user?.id));

  const TradeCard = ({ trade, isIncoming }: { trade: any; isIncoming: boolean }) => {
    const reqJersey = trade.requester_jersey;
    const ownJersey = trade.owner_jersey;
    const status = statusLabels[trade.status] || statusLabels.pending;
    const isOwner = user?.id === (ownJersey as any)?.user_id;
    const requesterConfirmed = (trade.confirmations as any[])?.some((c: any) => c.user_id === (reqJersey as any)?.user_id);
    const ownerConfirmed = (trade.confirmations as any[])?.some((c: any) => c.user_id === (ownJersey as any)?.user_id);
    const userConfirmed = isOwner ? ownerConfirmed : requesterConfirmed;
    const bothConfirmed = requesterConfirmed && ownerConfirmed;
    const canStartCompletion = trade.status === "accepted";

    const handleConfirmCompletion = async () => {
      try {
        await confirmCompletion.mutateAsync(trade.id);
        toast.success("Tausch bestätigt!");
        if (bothConfirmed) {
          setRatingTradeId(trade.id);
          setRatingStars(5);
          setRatingComment("");
        }
      } catch (error: any) {
        toast.error(error.message || "Fehler beim Bestätigen des Tauschs");
      }
    };

    return (
      <article className="border-2 border-nero bg-card p-3 md:p-4">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(TAG, status.className)}>{status.label}</span>
          <span className="cap text-[10px] text-muted-foreground">
            {new Date(trade.created_at).toLocaleDateString("de-DE")}
          </span>
        </div>

        <div className="mt-3 flex items-start gap-2 md:gap-3">
          <TradeSide
            label={isIncoming ? `${(reqJersey?.profiles as any)?.display_name || "Anonym"} bietet` : "Du bietest"}
            jersey={reqJersey}
          />
          <div className="self-stretch pt-[30%]"><SwapDisc /></div>
          <TradeSide
            label={isIncoming ? "Dein Trikot" : `Trikot von ${(ownJersey?.profiles as any)?.display_name || "Anonym"}`}
            jersey={ownJersey}
          />
        </div>

        {trade.message && (
          <p className="mt-4 border-l-2 border-rosso pl-3 text-base text-muted-foreground">
            „{trade.message}“
          </p>
        )}

        {isIncoming && trade.status === "pending" && (
          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1 px-3"
              onClick={() => updateTrade.mutate({ id: trade.id, status: "accepted" })}
              disabled={updateTrade.isPending}
            >
              <Check className="h-4 w-4" /> Annehmen
            </Button>
            <Button
              variant="outline"
              className="flex-1 px-3 hover:border-rosso hover:bg-rosso"
              onClick={() => updateTrade.mutate({ id: trade.id, status: "declined" })}
              disabled={updateTrade.isPending}
            >
              <X className="h-4 w-4" /> Ablehnen
            </Button>
          </div>
        )}

        {canStartCompletion && (
          <div className="mt-4">
            {userConfirmed ? (
              bothConfirmed ? (
                <Button
                  variant="dark"
                  className="w-full"
                  onClick={() => {
                    setRatingTradeId(trade.id);
                    setRatingStars(5);
                    setRatingComment("");
                  }}
                >
                  <Star className="h-4 w-4" /> Bewertung abgeben
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Warte auf Bestätigung des anderen …
                </Button>
              )
            ) : (
              <Button className="w-full" onClick={handleConfirmCompletion} disabled={confirmCompletion.isPending}>
                <Check className="h-4 w-4" /> Tausch abschließen
              </Button>
            )}
          </div>
        )}
      </article>
    );
  };

  const TradeColumn = ({ title, list, isIncoming, empty }: { title: string; list: any[]; isIncoming: boolean; empty: string }) => (
    <div>
      <h2 className="flex items-baseline gap-3 border-b-2 border-nero pb-3">
        <span className="num text-[38px] leading-none">{list.length}</span>
        <span className="display text-[26px] md:text-[34px]">{title}</span>
      </h2>
      <div className="mt-4 space-y-4">
        {list.length === 0 ? (
          <p className="text-base text-muted-foreground">{empty}</p>
        ) : list.map((t: any) => <TradeCard key={t.id} trade={t} isIncoming={isIncoming} />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Seitenkopf nero mit Trikot-Silhouetten (Skill cc-design §5.1) */}
      <PageHeader
        tone="nero"
        eyebrow="Lo scambio · Tausch-Anfragen"
        title="Meine Tausch-"
        hollowWord="Anfragen."
        subline="Eingehende und ausgehende Anfragen — annehmen, abschließen, bewerten."
        aside={<TradeShirts />}
      >
        <Button variant="outline" className="border-avorio text-avorio hover:bg-avorio hover:text-nero" onClick={() => navigate("/trade")}>
          Zur Tauschbörse →
        </Button>
      </PageHeader>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-10">
          {/* Status-Filter als Chips */}
          <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label="Status">
            <button
              type="button"
              role="tab"
              aria-selected={selectedStatusFilter === null}
              onClick={() => setSelectedStatusFilter(null)}
              className={cn(CHIP, selectedStatusFilter === null ? "bg-nero text-avorio" : "hover:bg-nero/5")}
            >
              Alle
            </button>
            {Object.entries(statusLabels).map(([status, { label }]) => (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={selectedStatusFilter === status}
                onClick={() => setSelectedStatusFilter(status)}
                className={cn(CHIP, selectedStatusFilter === status ? "bg-nero text-avorio" : "hover:bg-nero/5")}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid gap-10 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-80 w-full border-2 border-nero" />
                </div>
              ))}
            </div>
          ) : trades.length === 0 ? (
            <div className="border-2 border-nero bg-card px-6 py-12 text-center">
              <ArrowLeftRight className="mx-auto mb-4 h-10 w-10" />
              <p className="font-display text-lg font-semibold">Noch keine Tausch-Anfragen.</p>
              <Button variant="outline" className="mt-6" onClick={() => navigate("/trade")}>
                Zur Tauschbörse →
              </Button>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
              <TradeColumn title="Eingehend" list={incomingTrades} isIncoming empty="Keine eingehenden Anfragen." />
              <TradeColumn title="Ausgehend" list={outgoingTrades} isIncoming={false} empty="Keine ausgehenden Anfragen." />
            </div>
          )}
        </div>
      </section>

      {/* Bewertung */}
      <Dialog open={!!ratingTradeId} onOpenChange={(open) => !open && setRatingTradeId(null)}>
        <DialogContent className="shadow-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold normal-case tracking-[-0.02em]">Bewertung abgeben</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <Label className="cap mb-2 block text-[11px] text-nero">Bewertung</Label>
              <div className="flex justify-center gap-1" role="radiogroup" aria-label="Sterne">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={star === ratingStars}
                    aria-label={`${star} ${star === 1 ? "Stern" : "Sterne"}`}
                    onClick={() => setRatingStars(star)}
                    className="flex h-12 w-12 items-center justify-center"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        star <= ratingStars ? "fill-giallo text-giallo" : "text-nero/30 hover:text-giallo",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment" className="cap text-[11px] text-nero">
                Deine Erfahrung (optional)
              </Label>
              <Textarea
                id="comment"
                placeholder="Wie war deine Erfahrung mit diesem Tausch?"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 px-3" onClick={() => setRatingTradeId(null)}>
                Überspringen
              </Button>
              <Button
                className="flex-1 px-3"
                disabled={createRating.isPending}
                onClick={async () => {
                  if (!ratingTradeId) return;
                  try {
                    await createRating.mutateAsync({
                      tradeId: ratingTradeId,
                      rating: ratingStars,
                      comment: ratingComment,
                    });
                    toast.success("Bewertung abgegeben!");
                    setRatingTradeId(null);
                  } catch (error: any) {
                    toast.error(error.message || "Fehler beim Speichern der Bewertung");
                  }
                }}
              >
                Bewertung abgeben
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Trades;
