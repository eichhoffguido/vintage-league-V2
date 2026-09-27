import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { INPUT, ImageField, ListField, TextField } from "./fields";

// Hero-Slides und FAQ liegen in eigenen Tabellen (hero_slides, faq_items). Admins sehen auch
// ausgeblendete Einträge (RLS); gelöscht wird weich (deleted_at).

const CARD = "border-2 border-nero bg-card";
const LABEL = "cap block text-[11px] text-nero";

function useAdminList<T extends { id: string; sort: number }>(table: "hero_slides" | "faq_items", publicKey: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["cms", table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").is("deleted_at", null).order("sort");
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cms", table] });
    await queryClient.invalidateQueries({ queryKey: [publicKey] });
  };

  const update = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from(table).update(patch as never).eq("id", id);
    if (error) throw error;
    await refresh();
  };
  /** Eintrag an Position `from` nach `to` verschieben; danach eindeutig durchnummerieren (10, 20, 30 …). */
  const move = async (from: number, to: number) => {
    const items = [...(query.data ?? [])];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    for (const [i, item] of items.entries()) {
      const sort = (i + 1) * 10;
      if (item.sort !== sort) {
        const { error } = await supabase.from(table).update({ sort }).eq("id", item.id);
        if (error) throw error;
      }
    }
    await refresh();
  };
  const remove = async (id: string) => update(id, { deleted_at: new Date().toISOString() });
  const insert = async (row: Record<string, unknown>) => {
    const items = query.data ?? [];
    const sort = (items.length ? Math.max(...items.map((i) => i.sort)) : 0) + 10;
    const { error } = await supabase.from(table).insert({ ...row, sort } as never);
    if (error) throw error;
    await refresh();
  };
  return { ...query, update, move, remove, insert };
}

const run = async (fn: () => Promise<void>, ok: string) => {
  try {
    await fn();
    toast.success(ok);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Das hat nicht geklappt.");
  }
};

const OrderButtons = ({ onUp, onDown, onDelete, first, last, label }: { onUp: () => void; onDown: () => void; onDelete: () => void; first: boolean; last: boolean; label: string }) => (
  <div className="flex gap-1">
    <button type="button" onClick={onUp} disabled={first} aria-label={`${label} nach oben`} className="flex h-10 w-10 items-center justify-center border border-nero hover:bg-nero/10 disabled:opacity-30">
      <ArrowUp className="h-4 w-4" />
    </button>
    <button type="button" onClick={onDown} disabled={last} aria-label={`${label} nach unten`} className="flex h-10 w-10 items-center justify-center border border-nero hover:bg-nero/10 disabled:opacity-30">
      <ArrowDown className="h-4 w-4" />
    </button>
    <button type="button" onClick={onDelete} aria-label={`${label} löschen`} className="flex h-10 w-10 items-center justify-center border border-nero text-muted-foreground hover:border-rosso hover:bg-rosso hover:text-avorio">
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
);

// ---------------------------------------------------------------------------------------------------
interface HeroSlideRow {
  id: string;
  sort: number;
  label: string;
  subline: string;
  image_path: string | null;
  image_alt: string;
  caption: string;
  stamp: string[];
  is_active: boolean;
}

const HeroSlideCard = ({ slide, index, count, list }: { slide: HeroSlideRow; index: number; count: number; list: ReturnType<typeof useAdminList<HeroSlideRow>> }) => {
  const [draft, setDraft] = useState(slide);
  useEffect(() => setDraft(slide), [slide]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(slide);

  const save = () => {
    if (!draft.image_alt.trim()) return toast.error("Bitte eine Bildbeschreibung eintragen (für Blinde und Google).");
    run(
      () => list.update(slide.id, { label: draft.label, subline: draft.subline, image_path: draft.image_path, image_alt: draft.image_alt, caption: draft.caption, stamp: draft.stamp.filter((s) => s.trim()) }),
      "Slide gespeichert — ist jetzt live.",
    );
  };

  return (
    <div className={cn(CARD, !slide.is_active && "opacity-70")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-nero px-4 py-3">
        <div className="font-display text-lg font-semibold">
          <span className="num mr-2 text-muted-foreground">{index + 1}</span>
          {slide.label || "Neuer Slide"}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <Switch checked={slide.is_active} onCheckedChange={(v) => run(() => list.update(slide.id, { is_active: v }), v ? "Slide sichtbar." : "Slide ausgeblendet.")} />
            <span className="cap text-[10px]">{slide.is_active ? "Sichtbar" : "Ausgeblendet"}</span>
          </label>
          <OrderButtons
            label="Slide"
            first={index === 0}
            last={index === count - 1}
            onUp={() => run(() => list.move(index, index - 1), "Reihenfolge geändert.")}
            onDown={() => run(() => list.move(index, index + 1), "Reihenfolge geändert.")}
            onDelete={() => window.confirm("Diesen Slide löschen?") && run(() => list.remove(slide.id), "Slide gelöscht.")}
          />
        </div>
      </div>
      <div className="grid gap-5 px-4 py-4 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <span className={LABEL}>Bild</span>
            <p className="mb-2 text-sm text-muted-foreground">Hochformat wirkt am besten (Ausschnitt 4:5).</p>
            <ImageField id={`slide-img-${slide.id}`} value={draft.image_path ?? ""} onChange={(v) => setDraft({ ...draft, image_path: v })} />
          </div>
          <div>
            <label className={LABEL} htmlFor={`slide-alt-${slide.id}`}>Bildbeschreibung *</label>
            <input id={`slide-alt-${slide.id}`} className={cn(INPUT, "mt-2", !draft.image_alt.trim() && "border-rosso")} value={draft.image_alt} onChange={(e) => setDraft({ ...draft, image_alt: e.target.value })} />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className={LABEL} htmlFor={`slide-label-${slide.id}`}>Stichwort (Navigation im Hero)</label>
            <input id={`slide-label-${slide.id}`} className={cn(INPUT, "mt-2")} value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          </div>
          <div>
            <label className={LABEL} htmlFor={`slide-sub-${slide.id}`}>Unterzeile</label>
            <div className="mt-2"><TextField id={`slide-sub-${slide.id}`} value={draft.subline} onChange={(v) => setDraft({ ...draft, subline: v })} max={240} multiline /></div>
          </div>
          <div>
            <label className={LABEL} htmlFor={`slide-cap-${slide.id}`}>Bildunterschrift</label>
            <input id={`slide-cap-${slide.id}`} className={cn(INPUT, "mt-2")} value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} />
          </div>
          <div>
            <span className={LABEL}>Runder Stempel (erste Zeile grün, max. 3 Zeilen)</span>
            <div className="mt-2">
              <ListField id={`slide-stamp-${slide.id}`} value={draft.stamp} onChange={(v) => setDraft({ ...draft, stamp: (v as string[]).slice(0, 3) })} itemLabel="Zeile" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 border-t border-nero px-4 py-3">
        <Button onClick={save} disabled={!dirty}>Speichern</Button>
        {dirty && <Button variant="outline" onClick={() => setDraft(slide)}>Verwerfen</Button>}
      </div>
    </div>
  );
};

export const HeroSlidesEditor = () => {
  const list = useAdminList<HeroSlideRow>("hero_slides", "hero-slides");
  const items = list.data ?? [];
  if (list.isLoading) return <div className="h-40 animate-pulse bg-sabbia" />;
  return (
    <div className="space-y-4">
      {items.length === 0 && <p className="text-base text-muted-foreground">Keine Slides — die Startseite zeigt die Standard-Bilder.</p>}
      {items.map((s, i) => <HeroSlideCard key={s.id} slide={s} index={i} count={items.length} list={list} />)}
      <Button variant="outline" onClick={() => run(() => list.insert({ label: "Neu", image_alt: "", is_active: false }), "Slide angelegt — noch ausgeblendet.")}>
        <Plus className="h-4 w-4" /> Slide hinzufügen
      </Button>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------
interface FaqRow {
  id: string;
  sort: number;
  question: string;
  answer: string;
  is_active: boolean;
}

const FaqCard = ({ item, index, count, list }: { item: FaqRow; index: number; count: number; list: ReturnType<typeof useAdminList<FaqRow>> }) => {
  const [draft, setDraft] = useState(item);
  useEffect(() => setDraft(item), [item]);
  const dirty = draft.question !== item.question || draft.answer !== item.answer;

  return (
    <div className={cn(CARD, "px-4 py-4", !item.is_active && "opacity-70")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="num text-lg text-muted-foreground">{index + 1}</span>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <Switch checked={item.is_active} onCheckedChange={(v) => run(() => list.update(item.id, { is_active: v }), v ? "Frage sichtbar." : "Frage ausgeblendet.")} />
            <span className="cap text-[10px]">{item.is_active ? "Sichtbar" : "Ausgeblendet"}</span>
          </label>
          <OrderButtons
            label="Frage"
            first={index === 0}
            last={index === count - 1}
            onUp={() => run(() => list.move(index, index - 1), "Reihenfolge geändert.")}
            onDown={() => run(() => list.move(index, index + 1), "Reihenfolge geändert.")}
            onDelete={() => window.confirm("Diese Frage löschen?") && run(() => list.remove(item.id), "Frage gelöscht.")}
          />
        </div>
      </div>
      <label className={cn(LABEL, "mt-3")} htmlFor={`faq-q-${item.id}`}>Frage</label>
      <input id={`faq-q-${item.id}`} className={cn(INPUT, "mt-2")} value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} />
      <label className={cn(LABEL, "mt-3")} htmlFor={`faq-a-${item.id}`}>Antwort</label>
      <div className="mt-2"><TextField id={`faq-a-${item.id}`} value={draft.answer} onChange={(v) => setDraft({ ...draft, answer: v })} max={500} multiline /></div>
      {dirty && (
        <div className="mt-3 flex gap-3">
          <Button
            onClick={() => {
              if (!draft.question.trim() || !draft.answer.trim()) return toast.error("Frage und Antwort dürfen nicht leer sein.");
              run(() => list.update(item.id, { question: draft.question.trim(), answer: draft.answer.trim() }), "Frage gespeichert — ist jetzt live.");
            }}
          >
            Speichern
          </Button>
          <Button variant="outline" onClick={() => setDraft(item)}>Verwerfen</Button>
        </div>
      )}
    </div>
  );
};

export const FaqEditor = () => {
  const list = useAdminList<FaqRow>("faq_items", "faq-items");
  const items = list.data ?? [];
  if (list.isLoading) return <div className="h-40 animate-pulse bg-sabbia" />;
  return (
    <div className="space-y-3">
      {items.map((f, i) => <FaqCard key={f.id} item={f} index={i} count={items.length} list={list} />)}
      <Button variant="outline" onClick={() => run(() => list.insert({ question: "Neue Frage?", answer: "Antwort …", is_active: false }), "Frage angelegt — noch ausgeblendet.")}>
        <Plus className="h-4 w-4" /> Frage hinzufügen
      </Button>
    </div>
  );
};
