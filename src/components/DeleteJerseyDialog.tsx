import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { FEATURES } from "@/config/features";

export interface DeleteJerseyTarget {
  id: string;
  team: string;
  name: string;
}

interface DeleteJerseyDialogProps {
  jersey: DeleteJerseyTarget | null;
  onClose: () => void;
  onDeleted?: () => void;
}

// Rückfrage + Soft Delete über soft_delete_user_jersey() (setzt deleted_at,
// zieht Gebote zurück, lehnt offene Tausch-Anfragen ab). Genutzt in Sammlung und Profil.
const DeleteJerseyDialog = ({ jersey, onClose, onDeleted }: DeleteJerseyDialogProps) => {
  const queryClient = useQueryClient();

  const softDelete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("soft_delete_user_jersey", { p_jersey_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jerseys"] });
      queryClient.invalidateQueries({ queryKey: ["user-jerseys"] });
      toast.success("Trikot entfernt");
      onClose();
      onDeleted?.();
    },
    onError: (e: Error) => toast.error(e.message || "Trikot konnte nicht entfernt werden."),
  });

  return (
    <AlertDialog open={jersey !== null} onOpenChange={(open) => { if (!open && !softDelete.isPending) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Trikot wirklich entfernen?</AlertDialogTitle>
          <AlertDialogDescription>
            {jersey && <>„{jersey.team} {jersey.name}“ verschwindet aus deiner Sammlung und vom Marktplatz. </>}
            Offene Gebote auf dieses Trikot werden zurückgezogen{FEATURES.trade ? ", offene Tausch-Anfragen abgelehnt" : ""}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={softDelete.isPending}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            className="border-rosso bg-rosso text-avorio hover:bg-rosso/90"
            disabled={softDelete.isPending}
            onClick={(e) => {
              e.preventDefault();
              if (jersey) softDelete.mutate(jersey.id);
            }}
          >
            {softDelete.isPending ? "Wird entfernt…" : "Entfernen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteJerseyDialog;
