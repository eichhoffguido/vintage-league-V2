import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useWatchlist = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's favorites
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const loadFavorites = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_favorites")
          .select("jersey_id")
          .eq("user_id", user.id);

        if (error) throw error;

        setFavorites(data?.map((fav) => fav.jersey_id) || []);
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  const toggleFavorite = async (jerseyId: string) => {
    if (!user) {
      console.warn("User must be logged in to add favorites");
      return;
    }

    const isFavorited = favorites.includes(jerseyId);

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("jersey_id", jerseyId);

        if (error) throw error;

        setFavorites(favorites.filter((id) => id !== jerseyId));
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("user_favorites")
          .insert({
            user_id: user.id,
            jersey_id: jerseyId,
          });

        if (error) throw error;

        setFavorites([...favorites, jerseyId]);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const isFavorited = (jerseyId: string) => favorites.includes(jerseyId);

  return {
    favorites,
    isFavorited,
    toggleFavorite,
    loading,
  };
};
