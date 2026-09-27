import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/RichTextEditor";
import { useAuth } from "@/hooks/useAuth";
import { useLegalContent } from "@/hooks/useSiteContent";
import { IMPRINT_DEFAULT, IMPRINT_LABELS, IMPRINT_REQUIRED, type ImprintContent } from "@/content/legal";
import { cn } from "@/lib/utils";
import { INPUT } from "./fields";

const CARD = "border-2 border-nero bg-card";

function useSaveLegal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return async (key: "legal.imprint" | "legal.privacy" | "legal.terms", value: Json) => {
    const { error } = await supabase.from("site_content").upsert({ key, value, updated_by: user?.id ?? null }, { onConflict: "key" });
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["site-content"] });
  };
}

const ImprintForm = ({ initial }: { initial: ImprintContent }) => {
  const saveLegal = useSaveLegal();
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const missing = IMPRINT_REQUIRED.filter((k) => !draft[k].trim());

  const save = async () => {
    setBusy(true);
    try {
      await saveLegal("legal.imprint", draft as unknown as Json);
      toast.success(missing.length ? "Impressum gespeichert — es fehlen noch Pflichtangaben." : "Impressum gespeichert — ist jetzt live.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={CARD}>
      <header className="border-b border-nero px-4 py-4 md:px-6">
        <h3 className="font-display text-xl font-semibold normal-case tracking-[-0.02em] md:text-2xl">Impressum</h3>
        <p className="mt-1 text-base text-muted-foreground">
          Gesetzlich vorgeschrieben. Felder mit * sind Pflicht — bis sie ausgefüllt sind, sehen Admins auf der Seite einen Warnhinweis.
        </p>
      </header>
      <div className="grid gap-4 px-4 py-5 md:grid-cols-2 md:px-6">
        {(Object.keys(IMPRINT_DEFAULT) as (keyof ImprintContent)[]).map((k) => {
          const required = IMPRINT_REQUIRED.includes(k);
          return (
            <label key={k} className="block">
              <span className="cap text-[11px] text-nero">
                {IMPRINT_LABELS[k]}
                {required && " *"}
              </span>
              <input
                className={cn(INPUT, "mt-2", required && !draft[k].trim() && "border-rosso")}
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
              />
            </label>
          );
        })}
      </div>
      <footer className="flex flex-wrap items-center gap-3 border-t border-nero px-4 py-4 md:px-6">
        <Button onClick={save} disabled={!dirty || busy}>{busy ? "Speichert …" : "Speichern"}</Button>
        {dirty && <Button variant="outline" onClick={() => setDraft(initial)}>Verwerfen</Button>}
        <a href="/imprint" target="_blank" rel="noopener noreferrer" className="cap text-xs underline underline-offset-4 md:ml-auto">Auf der Seite ansehen ↗</a>
      </footer>
    </section>
  );
};

const RichLegalForm = ({ title, where, url, storageKey, initial }: { title: string; where: string; url: string; storageKey: "legal.privacy" | "legal.terms"; initial: string }) => {
  const saveLegal = useSaveLegal();
  const [html, setHtml] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const dirty = html !== initial;

  const save = async () => {
    setBusy(true);
    try {
      await saveLegal(storageKey, { html });
      toast.success(`${title} gespeichert — ist jetzt live.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={CARD}>
      <header className="border-b border-nero px-4 py-4 md:px-6">
        <h3 className="font-display text-xl font-semibold normal-case tracking-[-0.02em] md:text-2xl">{title}</h3>
        <p className="mt-1 text-base text-muted-foreground">{where}</p>
      </header>
      <div className="px-4 py-5 md:px-6">
        <RichTextEditor key={version} content={html} onChange={setHtml} placeholder={`${title} …`} />
        <p className="mt-2 text-sm text-muted-foreground">Zwischenüberschriften mit „H2“ setzen — sie bekommen auf der Seite automatisch eine Trennlinie.</p>
      </div>
      <footer className="flex flex-wrap items-center gap-3 border-t border-nero px-4 py-4 md:px-6">
        <Button onClick={save} disabled={!dirty || busy}>{busy ? "Speichert …" : "Speichern"}</Button>
        {dirty && (
          <Button variant="outline" onClick={() => { setHtml(initial); setVersion((v) => v + 1); }}>
            Verwerfen
          </Button>
        )}
        <a href={url} target="_blank" rel="noopener noreferrer" className="cap text-xs underline underline-offset-4 md:ml-auto">Auf der Seite ansehen ↗</a>
      </footer>
    </section>
  );
};

/** Rechtliches: Impressum (Formular), Datenschutz und AGB (Text-Editor). */
const LegalEditor = () => {
  const { imprint, privacyHtml, termsHtml } = useLegalContent();
  return (
    <div className="space-y-8">
      <ImprintForm initial={imprint} />
      <RichLegalForm title="Datenschutzerklärung" where="Seite /privacy, verlinkt im Footer." url="/privacy" storageKey="legal.privacy" initial={privacyHtml} />
      <RichLegalForm
        title="AGB"
        where="Seite /agb. Der Link im Footer erscheint automatisch, sobald hier Text steht."
        url="/agb"
        storageKey="legal.terms"
        initial={termsHtml}
      />
    </div>
  );
};

export default LegalEditor;
