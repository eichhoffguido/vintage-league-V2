import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { COMMUNITY_ICONS, isCategoryVisible } from "@/content/communityIcons";
import { cn } from "@/lib/utils";
import { INPUT } from "./fields";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  posts: number;
}

const LABEL = "cap block text-[11px] text-nero";

const run = async (fn: () => Promise<void>, ok: string) => {
  try {
    await fn();
    toast.success(ok);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Das hat nicht geklappt.");
  }
};

/** Community-Kategorien (CC-C4): Name, Beschreibung, Icon, Reihenfolge, sichtbar. Löschen nur ohne Beiträge. */
const CategoryEditor = () => {
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: ["cms", "categories"],
    queryFn: async (): Promise<CategoryRow[]> => {
      const [{ data: cats, error }, { data: posts, error: postsError }] = await Promise.all([
        supabase.from("forum_categories").select("*").order("sort_order"),
        supabase.from("forum_posts").select("category_id"),
      ]);
      if (error) throw error;
      if (postsError) throw postsError;
      const count: Record<string, number> = {};
      (posts ?? []).forEach((p) => { count[p.category_id] = (count[p.category_id] ?? 0) + 1; });
      return (cats ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        icon: c.icon,
        sort_order: c.sort_order ?? 0,
        is_active: isCategoryVisible(c),
        posts: count[c.id] ?? 0,
      }));
    },
  });
  const items = list.data ?? [];

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cms", "categories"] });
    await queryClient.invalidateQueries({ queryKey: ["forum-categories"] });
  };
  const update = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("forum_categories").update(patch as never).eq("id", id);
    if (error) throw error;
    await refresh();
  };
  const move = async (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    for (const [i, c] of next.entries()) {
      if (c.sort_order !== i + 1) {
        const { error } = await supabase.from("forum_categories").update({ sort_order: i + 1 }).eq("id", c.id);
        if (error) throw error;
      }
    }
    await refresh();
  };
  const add = async () => {
    const sort = (items.length ? Math.max(...items.map((c) => c.sort_order)) : 0) + 1;
    const { error } = await supabase.from("forum_categories").insert({ name: "Neue Kategorie", icon: "MessageSquare", sort_order: sort, is_active: false } as never);
    if (error) throw error;
    await refresh();
  };
  const remove = async (c: CategoryRow) => {
    const { error } = await supabase.from("forum_categories").delete().eq("id", c.id);
    if (error) throw error;
    await refresh();
  };

  if (list.isLoading) return <div className="h-40 animate-pulse bg-sabbia" />;

  return (
    <section className="border-2 border-nero bg-card">
      <header className="border-b border-nero px-4 py-4 md:px-6">
        <h3 className="font-display text-xl font-semibold normal-case tracking-[-0.02em] md:text-2xl">Community-Kategorien</h3>
        <p className="mt-1 text-base text-muted-foreground">
          Die Themen-Chips in der Community und die Auswahl beim Schreiben eines Beitrags. Kategorien mit Beiträgen lassen sich nur ausblenden, nicht löschen.
        </p>
      </header>
      <div className="space-y-3 px-4 py-5 md:px-6">
        {items.map((c, i) => (
          <CategoryCard
            key={c.id}
            cat={c}
            first={i === 0}
            last={i === items.length - 1}
            onSave={(patch) => run(() => update(c.id, patch), "Kategorie gespeichert — ist jetzt live.")}
            onToggle={(v) => run(() => update(c.id, { is_active: v }), v ? "Kategorie sichtbar." : "Kategorie ausgeblendet.")}
            onUp={() => run(() => move(i, i - 1), "Reihenfolge geändert.")}
            onDown={() => run(() => move(i, i + 1), "Reihenfolge geändert.")}
            onDelete={() => window.confirm(`Kategorie „${c.name}“ löschen?`) && run(() => remove(c), "Kategorie gelöscht.")}
          />
        ))}
        <Button variant="outline" onClick={() => run(add, "Kategorie angelegt — noch ausgeblendet.")}>
          <Plus className="h-4 w-4" /> Kategorie hinzufügen
        </Button>
      </div>
    </section>
  );
};

const CategoryCard = ({
  cat,
  first,
  last,
  onSave,
  onToggle,
  onUp,
  onDown,
  onDelete,
}: {
  cat: CategoryRow;
  first: boolean;
  last: boolean;
  onSave: (patch: Record<string, unknown>) => void;
  onToggle: (v: boolean) => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) => {
  const [draft, setDraft] = useState({ name: cat.name, description: cat.description ?? "", icon: cat.icon ?? "MessageSquare" });
  useEffect(() => setDraft({ name: cat.name, description: cat.description ?? "", icon: cat.icon ?? "MessageSquare" }), [cat]);
  const dirty = draft.name !== cat.name || draft.description !== (cat.description ?? "") || draft.icon !== (cat.icon ?? "MessageSquare");
  const Icon = COMMUNITY_ICONS[draft.icon]?.icon;

  return (
    <div className={cn("border border-nero bg-background p-3", !cat.is_active && "opacity-70")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          {Icon && <Icon className="h-4 w-4" />}
          {cat.name}
          <span className="cap ml-2 text-[10px] font-normal text-muted-foreground">{cat.posts} {cat.posts === 1 ? "Beitrag" : "Beiträge"}</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <Switch checked={cat.is_active} onCheckedChange={onToggle} />
            <span className="cap text-[10px]">{cat.is_active ? "Sichtbar" : "Ausgeblendet"}</span>
          </label>
          <div className="flex gap-1">
            <button type="button" onClick={onUp} disabled={first} aria-label="Nach oben" className="flex h-10 w-10 items-center justify-center border border-nero hover:bg-nero/10 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
            <button type="button" onClick={onDown} disabled={last} aria-label="Nach unten" className="flex h-10 w-10 items-center justify-center border border-nero hover:bg-nero/10 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
            <button
              type="button"
              onClick={onDelete}
              disabled={cat.posts > 0}
              title={cat.posts > 0 ? "Hat Beiträge — bitte ausblenden statt löschen" : "Löschen"}
              aria-label="Kategorie löschen"
              className="flex h-10 w-10 items-center justify-center border border-nero text-muted-foreground hover:border-rosso hover:bg-rosso hover:text-avorio disabled:pointer-events-none disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_200px]">
        <label className="block">
          <span className={LABEL}>Name</span>
          <input className={cn(INPUT, "mt-1")} value={draft.name} maxLength={40} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label className="block">
          <span className={LABEL}>Kurzbeschreibung (optional)</span>
          <input className={cn(INPUT, "mt-1")} value={draft.description} maxLength={120} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </label>
        <label className="block">
          <span className={LABEL}>Icon</span>
          <select className={cn(INPUT, "mt-1 h-[46px]")} value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })}>
            {Object.entries(COMMUNITY_ICONS).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
      </div>
      {dirty && (
        <div className="mt-3 flex gap-3">
          <Button
            onClick={() => {
              if (!draft.name.trim()) return toast.error("Bitte einen Namen eintragen.");
              onSave({ name: draft.name.trim(), description: draft.description.trim() || null, icon: draft.icon });
            }}
          >
            Speichern
          </Button>
          <Button variant="outline" onClick={() => setDraft({ name: cat.name, description: cat.description ?? "", icon: cat.icon ?? "MessageSquare" })}>
            Verwerfen
          </Button>
        </div>
      )}
    </div>
  );
};

export default CategoryEditor;
