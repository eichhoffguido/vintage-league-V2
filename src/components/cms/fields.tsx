import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { uploadSiteImage } from "@/lib/cms";
import { siteMediaUrl } from "@/hooks/useSiteContent";
import type { CmsListItemField } from "@/content/cmsSchema";

export const INPUT =
  "w-full border border-nero bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

const Counter = ({ length, max }: { length: number; max?: number }) =>
  max ? <span className={cn("num text-sm text-muted-foreground", length > max && "text-rosso")}>{length}/{max}</span> : null;

export const TextField = ({ id, value, onChange, max, multiline }: { id: string; value: string; onChange: (v: string) => void; max?: number; multiline?: boolean }) => (
  <div>
    {multiline ? (
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cn(INPUT, "resize-y")} />
    ) : (
      <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} className={INPUT} />
    )}
    {max && (
      <div className="mt-1 text-right">
        <Counter length={value.length} max={max} />
      </div>
    )}
  </div>
);

export const LinkField = ({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) => {
  const invalid = value.trim() !== "" && !/^(\/|https?:\/\/|mailto:)/.test(value.trim());
  return (
    <div>
      <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="/shop" className={cn(INPUT, invalid && "border-rosso")} />
      {invalid && <p className="mt-1 text-sm text-rosso">Bitte mit „/“ (interne Seite) oder „https://“ beginnen.</p>}
    </div>
  );
};

export const ToggleField = ({ id, value, onChange }: { id: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex min-h-11 items-center gap-3">
    <Switch id={id} checked={value} onCheckedChange={onChange} />
    <span className="cap text-[11px]">{value ? "An" : "Aus"}</span>
  </div>
);

/** Bildwert (Storage-Pfad, Asset-URL oder volle URL) → anzeigbare URL. */
export const imageSrc = (value: string) => (/^(https?:|\/|data:)/.test(value) ? value : siteMediaUrl(value));

export const ImageField = ({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadSiteImage(file));
      toast.success("Bild hochgeladen — jetzt noch speichern.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hochladen fehlgeschlagen.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="grain grain-photo h-32 w-40 overflow-hidden border-2 border-nero bg-sabbia">
        {value && <img src={imageSrc(value)} alt="" className="h-full w-full object-cover" />}
      </div>
      <div>
        <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {busy ? "Lädt hoch …" : "Bild ersetzen"}
        </Button>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">JPG, PNG oder WebP. Wird automatisch verkleinert.</p>
      </div>
    </div>
  );
};

type ListItem = string | Record<string, string>;

/** Liste bearbeiten: Einträge hinzufügen, löschen, mit ▲▼ sortieren. */
export const ListField = ({
  id,
  value,
  onChange,
  itemFields,
  itemLabel = "Eintrag",
}: {
  id: string;
  value: ListItem[];
  onChange: (v: ListItem[]) => void;
  itemFields?: CmsListItemField[];
  itemLabel?: string;
}) => {
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  const update = (i: number, item: ListItem) => onChange(value.map((v, j) => (j === i ? item : v)));
  const add = () => onChange([...value, itemFields ? Object.fromEntries(itemFields.map((f) => [f.key, ""])) : ""]);
  const remove = (i: number) => {
    if (window.confirm(`${itemLabel} ${i + 1} wirklich entfernen?`)) onChange(value.filter((_, j) => j !== i));
  };

  return (
    <div id={id} className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex gap-2 border border-nero bg-card p-2.5">
          <div className="num w-6 shrink-0 pt-2 text-center text-lg text-muted-foreground">{i + 1}</div>
          <div className="min-w-0 flex-1 space-y-2">
            {itemFields && typeof item === "object" ? (
              itemFields.map((f) => (
                <label key={f.key} className="block">
                  <span className="cap text-[10px] text-muted-foreground">{f.label}</span>
                  {f.type === "textarea" ? (
                    <textarea value={item[f.key] ?? ""} onChange={(e) => update(i, { ...item, [f.key]: e.target.value })} rows={2} className={cn(INPUT, "mt-1 resize-y")} />
                  ) : (
                    <input type="text" value={item[f.key] ?? ""} onChange={(e) => update(i, { ...item, [f.key]: e.target.value })} className={cn(INPUT, "mt-1")} />
                  )}
                </label>
              ))
            ) : (
              <input type="text" value={typeof item === "string" ? item : ""} onChange={(e) => update(i, e.target.value)} className={INPUT} aria-label={`${itemLabel} ${i + 1}`} />
            )}
          </div>
          <div className="flex shrink-0 flex-col">
            <button type="button" className="flex h-9 w-9 items-center justify-center hover:bg-nero/10 disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Nach oben">
              <ArrowUp className="h-4 w-4" />
            </button>
            <button type="button" className="flex h-9 w-9 items-center justify-center hover:bg-nero/10 disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Nach unten">
              <ArrowDown className="h-4 w-4" />
            </button>
            <button type="button" className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:bg-rosso hover:text-avorio" onClick={() => remove(i)} aria-label={`${itemLabel} entfernen`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={add}>
        <Plus className="h-4 w-4" /> {itemLabel} hinzufügen
      </Button>
    </div>
  );
};
