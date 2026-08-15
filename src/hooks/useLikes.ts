import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LikesData {
  counts: Record<string, number>;
  likedByMe: Set<string>;
}

/**
 * Like counts + current user's like state for a set of forum posts, fetched
 * in a single aggregate query (no N+1 per post). Pass every post id visible
 * on the page (a feed page, or a single post's id for the detail page).
 */
export function useLikes(postIds: string[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sortedIds = useMemo(() => [...postIds].sort(), [postIds]);
  const queryKey = ["forum-post-likes", sortedIds.join(","), user?.id ?? null];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<LikesData> => {
      const { data, error } = await supabase
        .from("forum_post_likes")
        .select("post_id, user_id")
        .in("post_id", sortedIds);
      if (error) throw error;

      const counts: Record<string, number> = {};
      const likedByMe = new Set<string>();
      (data || []).forEach((row) => {
        counts[row.post_id] = (counts[row.post_id] || 0) + 1;
        if (user && row.user_id === user.id) likedByMe.add(row.post_id);
      });
      return { counts, likedByMe };
    },
    enabled: sortedIds.length > 0,
  });

  const counts = data?.counts ?? {};
  const likedByMe = data?.likedByMe ?? new Set<string>();

  const toggleLike = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Not authenticated");
      if (likedByMe.has(postId)) {
        const { error } = await supabase
          .from("forum_post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("forum_post_likes")
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<LikesData>(queryKey);
      if (previous) {
        const wasLiked = previous.likedByMe.has(postId);
        const nextLikedByMe = new Set(previous.likedByMe);
        const nextCounts = { ...previous.counts };
        if (wasLiked) {
          nextLikedByMe.delete(postId);
          nextCounts[postId] = Math.max(0, (nextCounts[postId] || 1) - 1);
        } else {
          nextLikedByMe.add(postId);
          nextCounts[postId] = (nextCounts[postId] || 0) + 1;
        }
        queryClient.setQueryData(queryKey, { counts: nextCounts, likedByMe: nextLikedByMe });
      }
      return { previous };
    },
    onError: (_error, _postId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    likeCount: (postId: string) => counts[postId] || 0,
    isLikedByMe: (postId: string) => likedByMe.has(postId),
    toggleLike,
    isLoading,
  };
}
