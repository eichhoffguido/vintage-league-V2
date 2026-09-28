import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatEuros } from "@/utils/currency";
import { carrierById, orderStage, parseSnapshot, sendOrderEmail, trackingLink, type OrderRow } from "@/lib/orders";

const COLUMNS =
  "id, status, buyer_id, seller_id, jersey_id, amount_cents, paid_at, created_at, shipped_at, shipping_carrier, tracking_number, received_at, shipping_name, shipping_address, jersey_snapshot";

const daysSince = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : 0);

/**
 * CC-ORDERS — Admin: bezahlte Käufe ohne Erhalt-Bestätigung. Bestätigt der Käufer nie, setzt ein Admin
 * „Erhalten“ (Entscheidung Guido 28.09.; Automatik später mit Stripe Connect).
 */
const AdminOpenOrders = () => {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<OrderRow | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-open-orders"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("transactions")
        .select(COLUMNS)
        .eq("status", "completed")
        .is("received_at", null)
        .order("paid_at", { ascending: true });
      if (error) throw error;
      const orders = (rows ?? []) as OrderRow[];
      const ids = [...new Set(orders.flatMap((o) => [o.buyer_id, o.seller_id]).filter((id): id is string => !!id))];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, display_name").in("id", ids)
        : { data: [] as { id: string; display_name: string | null }[] };
      const names = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.display_name ?? "Mitglied"]));
      return { orders, names };
    },
  });

  const markReceived = async () => {
    if (!target) return;
    setBusy(true);
    const { error } = await supabase.rpc("confirm_order_received", { p_transaction_id: target.id });
    setBusy(false);
    setTarget(null);
    if (error) {
      toast.error(error.message || "Speichern fehlgeschlagen.");
      return;
    }
    sendOrderEmail((name, options) => supabase.functions.invoke(name, options), target.id, "received");
    toast.success("Als erhalten markiert.");
    queryClient.invalidateQueries({ queryKey: ["admin-open-orders"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const name = (id: string | null) => (id ? data?.names[id] ?? "Mitglied" : "Gelöschtes Mitglied");

  return (
    <section className="mt-16" aria-labelledby="admin-open-orders">
      <h2 id="admin-open-orders" className="mb-2 font-display text-3xl font-bold">Offene Bestellungen</h2>
      <p className="mb-6 text-muted-foreground">Bezahlt, aber noch nicht als erhalten bestätigt — älteste zuerst.</p>

      {isLoading ? (
        <p className="cap text-xs text-muted-foreground">Laden …</p>
      ) : !data || data.orders.length === 0 ? (
        <div className="border border-dashed border-nero p-8 text-center text-muted-foreground">Keine offenen Bestellungen.</div>
      ) : (
        <ul className="border-t border-nero">
          {data.orders.map((o) => {
            const snap = parseSnapshot(o.jersey_snapshot);
            const shipped = orderStage(o) === "shipped";
            const link = trackingLink(o.shipping_carrier, o.tracking_number);
            return (
              <li key={o.id} className="grid gap-3 border-b border-nero py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto_auto] md:items-center md:gap-6">
                <div className="min-w-0">
                  <p className="font-display text-[17px] font-semibold tracking-[-0.02em]">{snap?.team ?? "Trikot"}</p>
                  <p className="text-sm text-muted-foreground">{[snap?.name, snap?.year].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="text-sm">
                  <p>Verkäufer: {name(o.seller_id)}</p>
                  <p>Käufer: {name(o.buyer_id)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
                  <span className="num text-xl">{formatEuros(o.amount_cents)}</span>
                  <Badge variant={shipped ? "tag-verde" : "tag-rosso"}>
                    {shipped ? `Versendet · ${carrierById(o.shipping_carrier)?.label ?? ""}` : "Nicht versendet"}
                  </Badge>
                  <span className="cap text-[10px] text-muted-foreground">vor {daysSince(o.paid_at ?? o.created_at)} Tagen bezahlt</span>
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="cap text-[10px] underline underline-offset-4">Sendung</a>
                  )}
                </div>
                <Button variant="outline" onClick={() => setTarget(o)}>Als erhalten markieren</Button>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={target !== null} onOpenChange={(v) => { if (!v) setTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="normal-case">Als erhalten markieren?</AlertDialogTitle>
            <AlertDialogDescription>
              {target && orderStage(target) !== "shipped"
                ? "Achtung: Der Verkäufer hat noch keine Sendungsnummer eingetragen. "
                : ""}
              Der Kauf gilt danach als abgeschlossen. Das lässt sich nicht rückgängig machen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={markReceived} disabled={busy}>
              {busy ? "Speichern …" : "Erhalten"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default AdminOpenOrders;
