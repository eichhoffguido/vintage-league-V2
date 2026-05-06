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
        trade_id: tradeId,
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

export function useConfirmTradeCompletion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tradeId: string) => {
      if (!user) throw new Error("User not authenticated");

      // Insert confirmation record
      const { error: confirmError } = await supabase
        .from("trade_confirmations")
        .insert({
          trade_id: tradeId,
          user_id: user.id,
        });

      if (confirmError) throw confirmError;

      // Check if both parties have confirmed
      const { data: confirmations, error: queryError } = await supabase
        .from("trade_confirmations")
        .select("user_id")
        .eq("trade_id", tradeId);

      if (queryError) throw queryError;

      // If both parties confirmed (2 confirmations), update trade status
      if (confirmations && confirmations.length === 2) {
        const { error: updateError } = await supabase
          .from("trade_requests")
          .update({ status: "completed" })
          .eq("id", tradeId);

        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trade-requests"] });
    },
  });
}
