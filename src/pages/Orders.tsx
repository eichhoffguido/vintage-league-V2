import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Check, ExternalLink, Package, Truck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useAuth } from "@/hooks/useAuth";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useInvalidateOrders, useOrders } from "@/hooks/useOrders";
import { supabase } from "@/integrations/supabase/client";
import { formatEuros } from "@/utils/currency";
import { getImageUrl } from "@/utils/imageUrl";
import { cn } from "@/lib/utils";
import {
  addressLines,
  CARRIERS,
  carrierById,
  isValidTrackingNumber,
  needsAction,
  orderStage,
  parseSnapshot,
  sendOrderEmail,
  trackingLink,
  type CarrierId,
  type OrderRow,
} from "@/lib/orders";

type Tab = "sold" | "bought";

const CONTACT = "kontakt@calcioclassics.de";

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

/** Drei eckige Schritte: Bezahlt → Versendet → Erhalten (Skill cc-design: eckig, verde = erledigt). */
const Steps = ({ order }: { order: OrderRow }) => {
  const steps = [
    { label: "Bezahlt", date: order.paid_at ?? order.created_at, done: true },
    { label: "Versendet", date: order.shipped_at, done: !!order.shipped_at },
    { label: "Erhalten", date: order.received_at, done: !!order.received_at },
  ];
  return (
    <ol className="grid grid-cols-3 border border-nero" aria-label="Status der Bestellung">
      {steps.map((step, i) => (
        <li
          key={step.label}
          className={cn(
            "flex min-h-[56px] flex-col justify-center px-3 py-2",
            i > 0 && "border-l border-nero",
            step.done ? "bg-verde text-avorio" : "bg-transparent text-muted-foreground",
          )}
        >
          <span className="cap flex items-center gap-1.5 text-[10px] md:text-[11px]">
            {step.done && <Check className="h-3.5 w-3.5" aria-hidden />}
            {step.label}
          </span>
          <span className="num text-sm leading-tight">{step.done ? formatDate(step.date) : "—"}</span>
        </li>
      ))}
    </ol>
  );
};

interface OrderCardProps {
  order: OrderRow;
  role: Tab;
  counterpart: string;
  /** Muss der Nutzer hier etwas tun? (versenden bzw. Erhalt bestätigen) */
  open: boolean;
  onChanged: () => void;
}

const OrderCard = ({ order, role, counterpart, open, onChanged }: OrderCardProps) => {
  const snapshot = parseSnapshot(order.jersey_snapshot);
  const stage = orderStage(order);
  const image = getImageUrl(snapshot?.image ?? null);
  const counterpartId = role === "sold" ? order.buyer_id : order.seller_id;
  const link = trackingLink(order.shipping_carrier, order.tracking_number);
  const carrier = carrierById(order.shipping_carrier);
  const address = addressLines(order.shipping_name, order.shipping_address);

  const [carrierId, setCarrierId] = useState<CarrierId | "">("");
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const trackingInvalid = tracking !== "" && !isValidTrackingNumber(tracking);

  const markShipped = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrierId || !isValidTrackingNumber(tracking)) return;
    setBusy(true);
    const { error } = await supabase.rpc("mark_order_shipped", {
      p_transaction_id: order.id,
      p_carrier: carrierId,
      p_tracking_number: tracking.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message || "Speichern fehlgeschlagen.");
      return;
    }
    sendOrderEmail((name, options) => supabase.functions.invoke(name, options), order.id, "shipped");
    toast.success("Als versendet markiert. Der Käufer bekommt die Sendungsnummer per Mail.");
    onChanged();
  };

  const confirmReceived = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("confirm_order_received", { p_transaction_id: order.id });
    setBusy(false);
    setConfirmOpen(false);
    if (error) {
      toast.error(error.message || "Bestätigen fehlgeschlagen.");
      return;
    }
    sendOrderEmail((name, options) => supabase.functions.invoke(name, options), order.id, "received");
    toast.success("Danke! Der Kauf ist abgeschlossen.");
    onChanged();
  };

  return (
    <li className="border-2 border-nero bg-card p-3 md:p-4">
      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 md:grid-cols-[96px_minmax(0,1fr)_auto] md:gap-5">
        {/* Bild */}
        {image ? (
          <img src={image} alt={snapshot ? `${snapshot.team} ${snapshot.name}` : "Trikot"} className="aspect-[4/5] w-full border border-nero bg-sabbia object-cover" />
        ) : (
          <div className="flex aspect-[4/5] w-full items-center justify-center border border-nero bg-sabbia font-display text-2xl font-bold text-nero/40">
            {(snapshot?.team ?? "?").charAt(0)}
          </div>
        )}

        {/* Trikot + Gegenseite */}
        <div className="min-w-0">
          <div className="cap text-[10px] text-muted-foreground md:text-[11px]">
            {[snapshot?.league, snapshot?.year, snapshot?.size && `Größe ${snapshot.size}`].filter(Boolean).join(" · ")}
          </div>
          {order.jersey_id && snapshot ? (
            <Link to={`/jersey/${order.jersey_id}`} className="mt-1 block font-display text-[17px] font-semibold tracking-[-0.02em] underline-offset-4 hover:underline">
              {snapshot.team}
            </Link>
          ) : (
            <p className="mt-1 font-display text-[17px] font-semibold tracking-[-0.02em]">{snapshot?.team ?? "Trikot"}</p>
          )}
          {snapshot?.name && <p className="text-sm text-muted-foreground">{snapshot.name}</p>}
          <p className="mt-2 text-sm">
            {role === "sold" ? "Käufer: " : "Verkäufer: "}
            {counterpartId && role === "bought" ? (
              <Link to={`/seller/${counterpartId}`} className="underline underline-offset-4">{counterpart}</Link>
            ) : (
              <span>{counterpart}</span>
            )}
          </p>
        </div>

        {/* Preis + Status-Tag */}
        <div className="col-span-2 flex items-center justify-between gap-3 md:col-span-1 md:flex-col md:items-end md:justify-start">
          <span className="num text-2xl leading-none">{formatEuros(order.amount_cents)}</span>
          {stage === "refunded" ? (
            <Badge variant="tag" className="border-nero bg-nero text-avorio">Erstattet</Badge>
          ) : open ? (
            <Badge variant="tag" className="border-rosso text-rosso">{role === "sold" ? "Bitte versenden" : "Erhalt bestätigen"}</Badge>
          ) : null}
        </div>
      </div>

      {stage !== "refunded" && (
        <div className="mt-4 space-y-4">
          <Steps order={order} />

          {/* Versandinfo, sobald versendet */}
          {order.shipped_at && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Truck className="h-4 w-4" aria-hidden />
              {carrier?.label ?? "Versand"} · Sendungsnummer <span className="num text-base">{order.tracking_number}</span>
              {link && (
                <a href={link} target="_blank" rel="noopener noreferrer" className="cap inline-flex items-center gap-1 text-xs underline underline-offset-4">
                  Sendung verfolgen <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              )}
            </p>
          )}

          {/* Verkäufer: Adresse + Versandformular */}
          {role === "sold" && stage === "awaiting_shipment" && (
            <div className="grid gap-4 border-t border-nero pt-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-8">
              <div>
                <div className="cap text-[11px] text-rosso">Lieferadresse</div>
                {address.length > 0 ? (
                  <address className="mt-2 not-italic leading-relaxed">
                    {address.map((line) => (
                      <span key={line} className="block">{line}</span>
                    ))}
                  </address>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Für diesen Kauf ist keine Lieferadresse gespeichert (Kauf vor Einführung der Adressabfrage). Bitte melde dich bei{" "}
                    <a href={`mailto:${CONTACT}`} className="underline underline-offset-4">{CONTACT}</a>.
                  </p>
                )}
              </div>
              <form onSubmit={markShipped} className="space-y-3">
                <p className="text-sm text-muted-foreground">Verschicke das Trikot mit Sendungsnummer und trag sie hier ein — sie schützt dich bei Streitfällen.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`carrier-${order.id}`} className="cap text-[11px]">Versanddienst</Label>
                    <Select value={carrierId} onValueChange={(v) => setCarrierId(v as CarrierId)}>
                      <SelectTrigger id={`carrier-${order.id}`} className="h-12"><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                      <SelectContent>
                        {CARRIERS.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`tracking-${order.id}`} className="cap text-[11px]">Sendungsnummer</Label>
                    <Input
                      id={`tracking-${order.id}`}
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      className={cn("h-12", trackingInvalid && "border-rosso")}
                      maxLength={64}
                      autoComplete="off"
                      aria-invalid={trackingInvalid || undefined}
                      placeholder="z. B. 00340434…"
                    />
                  </div>
                </div>
                {trackingInvalid && <p className="text-sm text-rosso">Die Sendungsnummer hat 5 bis 64 Zeichen.</p>}
                <Button type="submit" variant="dark" size="lg" className="w-full sm:w-auto" disabled={busy || !carrierId || !isValidTrackingNumber(tracking)}>
                  <Package className="h-4 w-4" /> {busy ? "Speichern …" : "Als versendet markieren"}
                </Button>
              </form>
            </div>
          )}

          {role === "sold" && stage === "shipped" && (
            <p className="text-sm text-muted-foreground">Unterwegs. Sobald der Käufer den Erhalt bestätigt, ist der Verkauf abgeschlossen.</p>
          )}

          {/* Käufer */}
          {role === "bought" && stage === "awaiting_shipment" && (
            <p className="text-sm text-muted-foreground">Der Verkäufer verschickt dein Trikot. Die Sendungsnummer erscheint hier, sobald es unterwegs ist.</p>
          )}
          {role === "bought" && stage === "shipped" && (
            <div className="flex flex-col gap-3 border-t border-nero pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">Ist das Trikot angekommen und so wie beschrieben? Dann bestätige den Erhalt.</p>
              <Button variant="default" size="lg" onClick={() => setConfirmOpen(true)} disabled={busy}>
                <Check className="h-4 w-4" /> Erhalt bestätigen
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="normal-case">Trikot erhalten?</AlertDialogTitle>
            <AlertDialogDescription>
              Bestätige nur, wenn das Trikot angekommen ist und der Beschreibung entspricht. Danach ist der Kauf abgeschlossen. Stimmt etwas nicht, schreib uns an {CONTACT}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReceived} disabled={busy}>
              {busy ? "Speichern …" : "Ja, erhalten"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
};

/** CC-ORDERS — Käufe & Verkäufe mit Versand und Erhalt. */
const Orders = () => {
  const page = useSiteContent("orders");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, isError } = useOrders(user?.id);
  const invalidate = useInvalidateOrders();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?next=%2Forders");
  }, [user, authLoading, navigate]);

  const sold = useMemo(() => (data?.orders ?? []).filter((o) => o.seller_id === user?.id), [data, user]);
  const bought = useMemo(() => (data?.orders ?? []).filter((o) => o.buyer_id === user?.id), [data, user]);
  const openSold = user ? sold.filter((o) => needsAction(o, user.id)).length : 0;
  const openBought = user ? bought.filter((o) => needsAction(o, user.id)).length : 0;

  // Reiter: ?tab=… oder dort, wo etwas zu tun ist
  const requested = searchParams.get("tab");
  const tab: Tab = requested === "sold" || requested === "bought" ? requested : openSold > 0 || (bought.length === 0 && sold.length > 0) ? "sold" : "bought";
  const list = tab === "sold" ? sold : bought;

  const setTab = (t: Tab) => setSearchParams({ tab: t }, { replace: true });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Persönlicher Bereich → grünes Kopfband (Skill cc-design §5.1) */}
      <PageHeader tone="verde" eyebrow={page.header.eyebrow} headline={page.header.headline} subline={page.header.subline} />

      <div className="container mx-auto px-4 py-8 md:px-10 md:py-12">
        <div role="tablist" aria-label="Verkauft oder gekauft" className="grid max-w-md grid-cols-2">
          {([
            ["sold", "Verkauft", openSold],
            ["bought", "Gekauft", openBought],
          ] as const).map(([key, label, open], i) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "cap flex h-11 items-center justify-center gap-2 border border-nero text-xs transition-colors",
                i > 0 && "-ml-px",
                tab === key ? "bg-nero text-avorio" : "bg-transparent text-nero hover:bg-sabbia",
              )}
            >
              {label}
              {open > 0 && (
                <span className="num inline-flex h-5 min-w-5 items-center justify-center bg-rosso px-1 text-xs text-avorio" aria-label={`${open} offen`}>
                  {open}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {isLoading || authLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
          ) : isError ? (
            <p className="text-rosso">Deine Bestellungen konnten nicht geladen werden. Bitte lade die Seite neu.</p>
          ) : list.length === 0 ? (
            <div className="border-2 border-nero bg-card px-6 py-12 text-center">
              <p className="font-display text-lg font-semibold normal-case">{tab === "sold" ? page.empty.sold : page.empty.bought}</p>
              <Button variant="outline" className="mt-5" onClick={() => navigate(tab === "sold" ? "/collection" : "/shop")}>
                {tab === "sold" ? "Zur Sammlung →" : "Zum Marktplatz →"}
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {list.map((order) => {
                const otherId = tab === "sold" ? order.buyer_id : order.seller_id;
                const counterpart = otherId ? data?.names[otherId] ?? "Mitglied" : "Gelöschtes Mitglied";
                return (
                  <OrderCard
                    key={order.id}
                    order={order}
                    role={tab}
                    counterpart={counterpart}
                    open={!!user && needsAction(order, user.id)}
                    onChanged={invalidate}
                  />
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Orders;
