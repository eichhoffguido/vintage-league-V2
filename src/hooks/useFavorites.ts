import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's favorited jersey IDs
  const { data: favoriteIds = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("jersey_favorites")
        .select("jersey_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((fav) => fav.jersey_id);
    },
    enabled: !!user,
  });

  // Toggle favorite (add or remove)
  const toggleFavorite = useMutation({
    mutationFn: async (jerseyId: string) => {
      if (!user) throw new Error("User not authenticated");

      const isFavorited = favoriteIds.includes(jerseyId);

      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from("jersey_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("jersey_id", jerseyId);
        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("jersey_favorites")
          .insert({ user_id: user.id, jersey_id: jerseyId });
        if (error) throw error;
      }
    },
    onMutate: async (jerseyId: string) => {
      // Optimistic UI: immediately update the favorite IDs
      await queryClient.cancelQueries({ queryKey: ["favorites", user?.id] });
      const previousFavorites = queryClient.getQueryData<string[]>([
        "favorites",
        user?.id,
      ]);
      const isFavorited = (previousFavorites || []).includes(jerseyId);
      const newFavorites = isFavorited
        ? (previousFavorites || []).filter((id) => id !== jerseyId)
        : [...(previousFavorites || []), jerseyId];
      queryClient.setQueryData(["favorites", user?.id], newFavorites);
      return { previousFavorites };
    },
    onError: (_error, _jerseyId, context) => {
      // Revert optimistic update on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          ["favorites", user?.id],
          context.previousFavorites
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
  });

  // Fetch full favorite jersey objects
  const { data: favoriteJerseys = [], isLoading: isFavoritesLoading } =
    useQuery({
      queryKey: ["favorite-jerseys", user?.id, favoriteIds],
      queryFn: async () => {
        if (!user || favoriteIds.length === 0) return [];
        const { data, error } = await supabase
          .from("user_jerseys")
          .select("*")
          .in("id", favoriteIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      },
      enabled: !!user && favoriteIds.length > 0,
    });

  return {
    favoriteIds,
    favoriteJerseys,
    isFavorited: (jerseyId: string) => favoriteIds.includes(jerseyId),
    toggleFavorite,
    isLoading,
    isFavoritesLoading,
  };
}
