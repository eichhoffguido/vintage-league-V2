import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useCreateTradeRating() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tradeId,
      rating,
      comment,
    }: {
      tradeId: string;
      rating: number;
      comment?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("trade_ratings").insert({
        trade_request_id: tradeId,
        rater_user_id: user.id,
        rating,
        comment: comment?.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trade-requests"] });
    },
  });
}

export function useUpdateTradeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tradeId,
      status,
    }: {
      tradeId: string;
      status: "pending" | "accepted" | "declined" | "completed";
    }) => {
      const { error } = await supabase
        .from("trade_requests")
        .update({ status })
        .eq("id", tradeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trade-requests"] });
    },
  });
}
