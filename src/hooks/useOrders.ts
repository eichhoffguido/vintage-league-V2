import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { needsAction, type OrderRow } from "@/lib/orders";

// CC-ORDERS — eigene Käufe und Verkäufe (RLS: nur Zeilen als Käufer oder Verkäufer; Admins sehen alle,
// deshalb filtert die Abfrage zusätzlich auf den Nutzer).
const ORDER_COLUMNS =
  "id, status, buyer_id, seller_id, jersey_id, amount_cents, paid_at, created_at, shipped_at, shipping_carrier, tracking_number, received_at, shipping_name, shipping_address, jersey_snapshot";

export interface OrdersData {
  orders: OrderRow[];
  /** Anzeigenamen der Gegenseite (profiles.display_name) */
  names: Record<string, string>;
}

async function fetchNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  // Kein FK transactions → profiles: Namen per zweiter Abfrage (siehe STAND, PGRST200)
  const { data } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.display_name ?? "Mitglied"]));
}

export const ordersQueryKey = (userId: string | undefined) => ["orders", userId] as const;

export function useOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ordersQueryKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<OrdersData> => {
      const { data, error } = await supabase
        .from("transactions")
        .select(ORDER_COLUMNS)
        .in("status", ["completed", "refunded"])
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const orders = (data ?? []) as OrderRow[];
      const others = new Set<string>();
      for (const o of orders) {
        const other = o.seller_id === userId ? o.buyer_id : o.seller_id;
        if (other) others.add(other);
      }
      return { orders, names: await fetchNames([...others]) };
    },
    staleTime: 30 * 1000,
  });
}

/** Anzahl der Bestellungen, bei denen der Nutzer etwas tun muss (Zähler im Konto-Menü). */
export function useOpenOrderCount(userId: string | undefined): number {
  const { data } = useOrders(userId);
  if (!data || !userId) return 0;
  return data.orders.filter((o) => needsAction(o, userId)).length;
}

export function useInvalidateOrders() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["orders"] });
}
