import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Ob der angemeldete Nutzer Admin ist (profiles.is_admin). Nur für die Anzeige
 * (z. B. Menüpunkt „Admin“) — /admin prüft selbst noch einmal.
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", user!.id).maybeSingle();
      if (error) return false;
      return data?.is_admin === true;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  return !!user && data === true;
}
