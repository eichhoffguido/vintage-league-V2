import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CONFIRM_WORD = "LÖSCHEN";
const FALLBACK = "Konto konnte nicht gelöscht werden. Bitte versuche es später erneut.";

async function errorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body: unknown = await error.context.json();
      if (body && typeof body === "object" && "error" in body && typeof body.error === "string") return body.error;
    } catch {
      // kein JSON-Body
    }
  }
  return FALLBACK;
}

/**
 * Danger Zone in „Profil bearbeiten“: Konto endgültig löschen über die Edge Function `delete-account`
 * (Daten, Bilder, Login). Community-Beiträge bleiben anonymisiert, abgeschlossene Käufe pseudonymisiert.
 */
const DeleteAccountSection = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);

  const handleDelete = async () => {
    setPending(true);
    const { error } = await supabase.functions.invoke("delete-account", { body: { confirm: CONFIRM_WORD } });
    if (error) {
      setPending(false);
      toast.error(await errorMessage(error));
      return;
    }
    // Sitzung lokal beenden (das Konto existiert nicht mehr), Cache leeren
    await supabase.auth.signOut({ scope: "local" });
    queryClient.clear();
    toast.success("Dein Konto wurde gelöscht.");
    navigate("/", { replace: true });
  };

  return (
    <section className="mt-8 border-2 border-rosso bg-card p-5 md:p-8" aria-labelledby="danger-zone-title">
      <div className="cap text-[11px] text-rosso">Zona pericolosa · Danger Zone</div>
      <h2 id="danger-zone-title" className="mt-2 font-display text-2xl font-semibold normal-case tracking-[-0.02em]">
        Konto löschen
      </h2>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        Dein Konto wird endgültig gelöscht: Profil, Sammlung, Trikotbilder, Merkliste, Gebote und Tausch-Anfragen.
        Das lässt sich nicht rückgängig machen.
      </p>
      <Button
        variant="outline"
        className="mt-5 border-rosso text-rosso hover:bg-rosso hover:text-avorio"
        onClick={() => { setTyped(""); setOpen(true); }}
      >
        Konto löschen …
      </Button>

      <AlertDialog open={open} onOpenChange={(v) => { if (!pending) setOpen(v); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konto endgültig löschen?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Profil, Sammlung und alle hochgeladenen Bilder werden gelöscht.</li>
                  <li>Merkliste, Gebote, Angebote und Tausch-Anfragen verschwinden.</li>
                  <li>Deine Community-Beiträge bleiben ohne Namen stehen („Gelöschtes Mitglied“), angehängte Bilder werden entfernt.</li>
                  <li>Abgeschlossene Käufe und Verkäufe bleiben ohne Bezug zu dir erhalten (Aufbewahrungspflicht).</li>
                </ul>
                <p>
                  Nicht möglich, solange ein Kauf, eine Gebotszahlung oder ein vereinbarter Tausch offen ist, und
                  in den ersten 30 Tagen nach einem Kauf oder Verkauf (Versand, Rückfragen).
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="cap text-[11px] text-nero">
              Zur Bestätigung „{CONFIRM_WORD}“ eingeben
            </Label>
            <Input
              id="confirm-delete"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              disabled={pending}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Abbrechen</AlertDialogCancel>
            <Button
              className="border-rosso bg-rosso text-avorio hover:bg-rosso/90"
              disabled={typed.trim().toUpperCase() !== CONFIRM_WORD || pending}
              onClick={handleDelete}
            >
              {pending ? "Wird gelöscht …" : "Konto endgültig löschen"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default DeleteAccountSection;
