import { useState, useEffect, type ReactNode } from "react";
import Headline from "@/components/brand/Headline";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MarketDepth from "@/components/MarketDepth";
import PlaceBidModal from "@/components/PlaceBidModal";
import PriceIntelligence from "@/components/PriceIntelligence";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatEuros } from "@/utils/currency";
import { getImageUrl } from "@/utils/imageUrl";
import { getLowestAsk, getHighestBid } from "@/utils/market";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { CONDITION_LABELS as conditionLabels } from "@/data/condition";
import { getPrimaryImage } from "@/utils/jerseyImage";
import { getAgeTier, getVintageBonus } from "@/utils/priceIntelligence";
import { cn } from "@/lib/utils";
import { startCheckout } from "@/lib/checkout";

type JerseyWithProfile = Tables<"user_jerseys"> & {
  profiles?: Tables<"profiles"> | null;
};

type SaleHistory = {
  id: string;
  team: string;
  league: string;
  year: string;
  price_cents: number | null;
  condition: number;
  sold_at: string;
};

// Zustand als Status-Tag mit Design-Tokens (Skill cc-design §2): 4–5 verde, 3 giallo, 1–2 rosso
const conditionTagClass = (condition: number): string => {
  if (condition >= 4) return "border-verde text-verde";
  if (condition === 3) return "border-giallo bg-giallo text-nero";
  return "border-rosso text-rosso";
};

const JerseyDetail = () => {
  const page = useSiteContent("detail");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [jersey, setJersey] = useState<JerseyWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saleHistory, setSaleHistory] = useState<SaleHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [lowestAsk, setLowestAsk] = useState<number | null | undefined>(undefined);
  const [highestBid, setHighestBid] = useState<number | null | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchJersey();
    }
  }, [id]);

  useEffect(() => {
    if (searchParams.get("cancelled") === "1") {
      toast({ title: "Zahlung abgebrochen", description: "Du kannst jederzeit erneut kaufen.", variant: "default" });
      navigate(`/jersey/${id}`, { replace: true });
    }
  }, [searchParams, id]);

  useEffect(() => {
    if (jersey && searchParams.get("buy") === "1" && user?.id !== jersey.user_id && jersey.sale_price_cents) {
      handleKaufen();
    }
  }, [jersey, searchParams, user]);

  useEffect(() => {
    if (jersey) {
      fetchSaleHistory();
    }
  }, [jersey]);

  useEffect(() => {
    if (!id) return;
    Promise.all([getLowestAsk(id), getHighestBid(id)]).then(([ask, bid]) => {
      setLowestAsk(ask);
      setHighestBid(bid);
    });
  }, [id]);

  const fetchJersey = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("user_jerseys")
        .select("*")
        .eq("id", id!)
        .is("deleted_at", null)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user_id)
          .single();

        setJersey({ ...data, profiles: profile });
      }
    } catch (err: any) {
      setError(err.message || "Jersey konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleHistory = async () => {
    if (!jersey) return;
    setLoadingHistory(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("user_jerseys")
        .select("id, team, league, year, price_cents, condition, updated_at")
        .eq("team", jersey.team)
        .eq("league", jersey.league)
        .eq("year", jersey.year)
        .neq("id", jersey.id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (fetchError) throw fetchError;

      if (data) {
        const history: SaleHistory[] = data.map((item: any) => ({
          id: item.id,
          team: item.team,
          league: item.league,
          year: item.year,
          price_cents: item.price_cents,
          condition: item.condition,
          sold_at: item.updated_at,
        }));
        setSaleHistory(history);
      }
    } catch (err: any) {
      console.error("Error fetching sale history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleKaufen = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCheckoutLoading(true);
    try {
      await startCheckout({ jersey_id: jersey!.id });
    } catch (err) {
      toast({ title: "Kauf nicht möglich", description: err instanceof Error ? err.message : "Checkout konnte nicht gestartet werden.", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <Skeleton className="h-10 w-40 mb-4" />
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square " />
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-2/3" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !jersey) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
          </Button>
          <div className="border border-dashed border-border p-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive/30" />
            <p className="font-display text-xl text-muted-foreground">Trikot nicht gefunden</p>
            <p className="mt-2 text-sm text-muted-foreground">{error || "Das angeforderte Trikot existiert nicht."}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const vintageBonus = getVintageBonus(jersey.year);
  const ageTier = getAgeTier(jersey.year);
  const isOwner = user?.id === jersey.user_id;
  const isSold = jersey.listing_type === "sold";
  const age = Number.isNaN(parseInt(jersey.year, 10)) ? null : new Date().getFullYear() - parseInt(jersey.year, 10);
  const images = (jersey.image_urls && jersey.image_urls.length > 0 ? jersey.image_urls : [jersey.image_url])
    .map((url) => getImageUrl(url))
    .filter((url): url is string => !!url);
  const mainImage = images[Math.min(activeImage, Math.max(0, images.length - 1))];
  const isVerified = jersey.verification_status === "verified";
  const isPending = jersey.verification_status === "pending";
  const verificationState = isVerified ? page.verification.verified : isPending ? page.verification.pending : page.verification.unverified;
  const sellerName = jersey.profiles?.display_name || "Anonym";

  const specs: { label: string; value: ReactNode }[] = [
    { label: "Größe", value: <span className="num text-xl">{jersey.size}</span> },
    {
      label: "Zustand",
      value: (
        <span className="flex items-center gap-2">
          <span className="num text-xl">{jersey.condition}/5</span>
          <span className={cn("inline-flex border px-[7px] py-1 font-body text-[10px] font-medium uppercase leading-none tracking-[0.14em]", conditionTagClass(jersey.condition))}>
            {conditionLabels[jersey.condition]}
          </span>
        </span>
      ),
    },
    {
      label: "Alter",
      value: (
        <span className="flex items-center gap-2">
          <span className="num text-xl">{age !== null ? `${age} Jahre` : "—"}</span>
          {ageTier && (
            <span className="inline-flex border border-nero px-[7px] py-1 font-body text-[10px] font-medium uppercase leading-none tracking-[0.14em]">
              {ageTier}
            </span>
          )}
        </span>
      ),
    },
    { label: "Vintage-Faktor", value: <span className="num text-xl">{vintageBonus}×</span> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="container mx-auto px-4 pb-14 pt-6 md:px-10 md:pb-24 md:pt-10">
          <button
            type="button"
            className="cap mb-6 inline-flex items-center gap-2 text-xs underline-offset-4 hover:underline md:mb-8"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" /> Zurück
          </button>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
            {/* Bilder */}
            <div>
              <div className="lg:sticky lg:top-32">
                <div className="grain grain-photo relative aspect-[4/5] overflow-hidden border-2 border-nero bg-sabbia">
                  {mainImage ? (
                    <img src={mainImage} alt={`${jersey.team} ${jersey.name}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="display text-9xl text-nero/25">{jersey.team.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute left-3 top-3 z-[2] flex flex-wrap gap-1.5">
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 border border-verde bg-verde px-2 py-1 font-body text-[11px] font-medium uppercase leading-none tracking-[0.14em] text-avorio">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verificato
                      </span>
                    )}
                    {jersey.available_for_trade && !isSold && (
                      <span className="inline-flex border border-rosso bg-card px-2 py-1 font-body text-[11px] font-medium uppercase leading-none tracking-[0.14em] text-rosso">
                        Tausch möglich
                      </span>
                    )}
                    {isSold && (
                      <span className="inline-flex border border-nero bg-nero px-2 py-1 font-body text-[11px] font-medium uppercase leading-none tracking-[0.14em] text-avorio">
                        Verkauft
                      </span>
                    )}
                  </div>
                  {ageTier && (
                    <span className="absolute bottom-3 left-3 z-[2] inline-flex border border-nero bg-card px-2 py-1 font-body text-[11px] font-medium uppercase leading-none tracking-[0.14em]">
                      {ageTier}
                    </span>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {images.map((url, index) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={`Bild ${index + 1} anzeigen`}
                        aria-pressed={index === activeImage}
                        className={cn(
                          "aspect-square overflow-hidden border-2 bg-sabbia",
                          index === activeImage ? "border-nero" : "border-transparent opacity-70 hover:opacity-100",
                        )}
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Infos */}
            <div className="space-y-7">
              <div>
                <div className="cap text-rosso">
                  {[jersey.league, jersey.year && `Saison ${jersey.year}`].filter(Boolean).join(" · ")}
                </div>
                <h1 className="display mt-3 text-[40px] leading-[0.9] md:text-[64px]">{jersey.team}</h1>
                {jersey.name && <p className="mt-3 text-lg text-muted-foreground">{jersey.name}</p>}
              </div>

              {/* Preis + Preiseinschätzung */}
              {(jersey.sale_price_cents || jersey.price_cents) && (
                <div className="space-y-4 border-2 border-nero bg-card p-5">
                  <div>
                    <div className="cap text-[11px] text-muted-foreground">{jersey.sale_price_cents ? "Verkaufspreis" : "Schätzpreis"}</div>
                    <div className="num mt-1 text-[44px] leading-none">
                      {formatEuros(jersey.sale_price_cents || jersey.price_cents)}
                    </div>
                  </div>
                  <PriceIntelligence
                    team={jersey.team}
                    year={parseInt(jersey.year) || 0}
                    condition={String(jersey.condition)}
                    size={jersey.size}
                    listingPriceCents={jersey.sale_price_cents || jersey.price_cents || undefined}
                  />
                </div>
              )}

              {/* Marktpreise */}
              <div className="grid grid-cols-2 border-y border-nero">
                <div className="py-4 pr-4">
                  <div className="cap text-[11px] text-muted-foreground">Sofort kaufen ab</div>
                  {lowestAsk === undefined ? (
                    <Skeleton className="mt-2 h-7 w-24" />
                  ) : lowestAsk !== null ? (
                    <div className="num mt-1 text-2xl">{formatEuros(lowestAsk)}</div>
                  ) : (
                    <div className="mt-1 text-sm text-muted-foreground">Kein Angebot verfügbar</div>
                  )}
                </div>
                <div className="border-l border-nero py-4 pl-4">
                  <div className="cap text-[11px] text-muted-foreground">Höchstes Gebot</div>
                  {highestBid === undefined ? (
                    <Skeleton className="mt-2 h-7 w-24" />
                  ) : highestBid !== null ? (
                    <div className="num mt-1 text-2xl text-verde">{formatEuros(highestBid)}</div>
                  ) : (
                    <div className="mt-1 text-sm text-muted-foreground">Noch kein Gebot</div>
                  )}
                </div>
              </div>

              {/* Aktionen */}
              <div className="space-y-2.5">
                {isOwner ? (
                  <Button variant="outline" size="lg" className="w-full" onClick={() => navigate("/collection")}>
                    <Package className="h-4 w-4" /> Sammlung bearbeiten
                  </Button>
                ) : isSold ? (
                  <div className="border-2 border-nero bg-card p-4 text-center">
                    <div className="cap text-xs">Bereits verkauft</div>
                    <p className="mt-2 text-sm text-muted-foreground">Dieses Trikot wurde bereits verkauft.</p>
                  </div>
                ) : (
                  <>
                    {jersey.sale_price_cents && (
                      <Button variant="dark" size="lg" className="w-full" onClick={handleKaufen} disabled={checkoutLoading}>
                        {checkoutLoading ? "Wird geladen …" : `Sofort kaufen — ${formatEuros(jersey.sale_price_cents)}`}
                      </Button>
                    )}
                    <Button
                      variant={jersey.sale_price_cents ? "outline" : "default"}
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        if (!user) {
                          navigate("/auth");
                          return;
                        }
                        setBidModalOpen(true);
                      }}
                    >
                      Gebot abgeben
                    </Button>
                    {jersey.available_for_trade && (
                      <Button variant="outline" size="lg" className="w-full border-rosso text-rosso hover:bg-rosso hover:text-avorio" onClick={() => navigate(user ? `/trade?jersey=${jersey.id}` : "/auth")}>
                        ⇄ Tausch vorschlagen
                      </Button>
                    )}
                    {!jersey.sale_price_cents && !jersey.available_for_trade && (
                      <p className="py-2 text-center text-sm text-muted-foreground">Dieses Trikot ist derzeit nicht verfügbar</p>
                    )}
                  </>
                )}
              </div>

              {/* Spezifikationen */}
              <dl className="border-t border-nero">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex items-center justify-between gap-4 border-b border-nero py-3">
                    <dt className="cap text-[11px] text-muted-foreground">{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>

              {/* Beschreibung */}
              {jersey.description && jersey.description.trim() && (
                <div>
                  <div className="cap text-[11px] text-muted-foreground">Beschreibung</div>
                  <div
                    className="prose prose-sm mt-3 max-w-none text-foreground prose-headings:font-display prose-headings:tracking-[-0.03em] prose-a:text-verde"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(jersey.description) }}
                  />
                </div>
              )}

              {/* Verkäufer */}
              <div className="border-2 border-nero bg-card p-5">
                <div className="cap text-[11px] text-muted-foreground">Il venditore · Verkäufer</div>
                <div className="mt-4 flex items-start gap-4">
                  {jersey.profiles?.avatar_url ? (
                    <img src={jersey.profiles.avatar_url} alt={sellerName} className="h-12 w-12 rounded-full border border-nero object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-nero bg-sabbia font-display text-lg font-bold">
                      {sellerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="break-words text-left font-display text-lg font-semibold tracking-[-0.02em] underline-offset-4 hover:underline"
                      onClick={() => navigate(`/seller/${jersey.user_id}`)}
                    >
                      {sellerName}
                    </button>
                    {jersey.profiles?.average_rating !== null && jersey.profiles?.average_rating !== undefined && (
                      <div className="mt-1 flex items-center gap-1">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn("h-3.5 w-3.5", i < Math.round(jersey.profiles!.average_rating!) ? "fill-giallo text-giallo" : "text-nero/20")}
                            />
                          ))}
                        </div>
                        <span className="num ml-1 text-sm">{jersey.profiles.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                    {jersey.profiles?.bio && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{jersey.profiles.bio}</p>}
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full" onClick={() => navigate(`/seller/${jersey.user_id}`)}>
                  Verkäuferprofil besuchen →
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Schwarzer Streifen: Echtheit & Prüfung (Skill cc-design §5.1) */}
        <section className="nero-stripe" aria-label="Echtheit und Prüfung">
          <div className="container mx-auto grid gap-8 px-4 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
            <div>
              <div className="cap text-avorio/75">
                <span className="text-rosso">{page.verification.eyebrow}</span> · {page.verification.label}
              </div>
              <h2 className="display mt-3 text-[36px] md:text-[56px]">
                <Headline text={verificationState.headline} ground="nero" />
              </h2>
              <p className="mt-4 max-w-md text-base text-avorio/85">
                {verificationState.text}
              </p>
            </div>
            <div className="grid grid-cols-1 border-t border-avorio/35 sm:grid-cols-3 sm:border-t-0">
              {page.verification.points.map(({ title, text }, i) => [String(i + 1).padStart(2, "0"), title, text] as const).map(([nr, title, text], i) => (
                <div key={nr} className={cn("border-b border-avorio/35 py-5 sm:border-b-0 sm:py-0", i > 0 && "sm:border-l sm:pl-6", i < 2 && "sm:pr-6")}>
                  <div className="display hollow text-[44px] leading-[0.8] md:text-[64px]" aria-hidden>{nr}</div>
                  <h3 className="mt-3 text-base md:mt-5 md:text-lg">{title}</h3>
                  <p className="mt-1.5 text-sm text-avorio/80">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Markttiefe + Zuletzt verkauft */}
        <div className="container mx-auto grid gap-10 px-4 py-14 md:px-10 md:py-20 lg:grid-cols-2 lg:gap-14">
          <MarketDepth jerseyId={id!} />
          {saleHistory.length > 0 && (
            <div>
              <div className="cap text-rosso">{page.historyEyebrow}</div>
              <h2 className="display mt-2.5 text-[32px] md:text-[44px]">
                Zuletzt <span className="hollow-dark">verkauft.</span>
              </h2>
              <ul className="mt-6 border-t border-nero">
                {saleHistory.map((sale) => (
                  <li key={sale.id} className="flex items-center justify-between gap-4 border-b border-nero py-3 text-sm">
                    <span className="text-muted-foreground">
                      Zustand {sale.condition}/5 · {new Date(sale.sold_at).toLocaleDateString("de-DE", { month: "short", day: "numeric" })}
                    </span>
                    {sale.price_cents ? (
                      <span className="num text-lg">{formatEuros(sale.price_cents)}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Preis nicht angegeben</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <PlaceBidModal
        open={bidModalOpen}
        onClose={() => setBidModalOpen(false)}
        jersey={jersey}
        highestBid={highestBid}
        lowestAsk={lowestAsk}
      />
    </div>
  );
};

export default JerseyDetail;
