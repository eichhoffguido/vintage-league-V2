import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const usePendingTradeCount = () => {
  const { user } = useAuth();

  const { data: count = 0 } = useQuery({
    queryKey: ["pending-trade-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { data, error } = await supabase
        .from("trade_requests")
        .select(`
          *,
          owner_jersey:user_jerseys!trade_requests_owner_jersey_id_fkey(user_id)
        `)
        .eq("status", "pending")
        .throwOnError();

      if (error) throw error;

      // Filter for incoming trades (where user is the owner of the jersey being offered)
      const incomingCount = (data || []).filter(
        (t: any) => (t.owner_jersey as any)?.user_id === user.id
      ).length;

      return incomingCount;
    },
    enabled: !!user,
  });

  return count;
};
