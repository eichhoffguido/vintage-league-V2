import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { SITE_CONTENT_DEFAULTS, type SiteContentRow, type SitePage } from "@/hooks/useSiteContent";
import { getAtPath, resetCmsFields, sameValue, saveCmsFields } from "@/lib/cms";
import type { CmsField, CmsSection } from "@/content/cmsSchema";
import HeadlineField from "./HeadlineField";
import { ImageField, LinkField, ListField, TextField, ToggleField } from "./fields";

interface SectionCardProps {
  page: SitePage;
  section: CmsSection;
  rows: SiteContentRow[];
  names: Record<string, string>;
}

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Ein Abschnitt einer Seite: Felder bearbeiten, speichern, auf Standard zurücksetzen. */
const SectionCard = ({ page, section, rows, names }: SectionCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const defaults = SITE_CONTENT_DEFAULTS[page];
  const [busy, setBusy] = useState(false);
  // Erhöhen = Felder neu aufbauen (nach Zurücksetzen/Verwerfen)
  const [version, setVersion] = useState(0);

  const rowFor = (path: string) => rows.find((r) => r.key === `${page}.${path}`);
  const stored = (f: CmsField) => {
    const row = rowFor(f.path);
    return row ? row.value : getAtPath(defaults, f.path);
  };

  const [draft, setDraft] = useState<Record<string, unknown>>(() => Object.fromEntries(section.fields.map((f) => [f.path, stored(f)])));
  const set = (path: string, value: unknown) => setDraft((d) => ({ ...d, [path]: value }));

  const dirty = section.fields.some((f) => !sameValue(draft[f.path], stored(f)));
  const sectionRows = section.fields.map((f) => rowFor(f.path)).filter((r): r is SiteContentRow => !!r);
  const lastChange = useMemo(
    () => sectionRows.reduce<SiteContentRow | null>((a, r) => (!a || r.updated_at > a.updated_at ? r : a), null),
    [sectionRows],
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["site-content"] });

  const save = async () => {
    // Links prüfen, Bildbeschreibung verlangen, wenn der Abschnitt ein Bild hat
    const badLink = section.fields.find((f) => f.type === "link" && typeof draft[f.path] === "string" && (draft[f.path] as string).trim() && !/^(\/|https?:\/\/|mailto:)/.test((draft[f.path] as string).trim()));
    if (badLink) return toast.error(`„${badLink.label}“: Link bitte mit „/“ oder „https://“ beginnen.`);
    const altMissing = section.fields.find((f) => f.path.endsWith("imageAlt") && typeof draft[f.path] === "string" && !(draft[f.path] as string).trim());
    if (altMissing) return toast.error("Bitte eine Bildbeschreibung eintragen (für Blinde und Google).");

    setBusy(true);
    try {
      await saveCmsFields(
        page,
        section.fields.map((f) => ({ path: f.path, value: draft[f.path], defaultValue: getAtPath(defaults, f.path) })),
        user?.id,
      );
      await refresh();
      toast.success(`„${section.title}“ gespeichert — ist jetzt live.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const discard = () => {
    setDraft(Object.fromEntries(section.fields.map((f) => [f.path, stored(f)])));
    setVersion((v) => v + 1);
  };

  const reset = async () => {
    if (!window.confirm(`„${section.title}“ auf die Standardtexte zurücksetzen?`)) return;
    setBusy(true);
    try {
      await resetCmsFields(page, section.fields.map((f) => f.path));
      await refresh();
      setDraft(Object.fromEntries(section.fields.map((f) => [f.path, getAtPath(defaults, f.path)])));
      setVersion((v) => v + 1);
      toast.success("Standard wiederhergestellt.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Zurücksetzen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const renderField = (f: CmsField) => {
    const id = `${page}-${f.path}`;
    const value = draft[f.path];
    switch (f.type) {
      case "headline":
        return <HeadlineField id={id} value={String(value ?? "")} onChange={(v) => set(f.path, v)} ground={f.ground} max={f.max} />;
      case "textarea":
        return <TextField id={id} value={String(value ?? "")} onChange={(v) => set(f.path, v)} max={f.max} multiline />;
      case "link":
        return <LinkField id={id} value={String(value ?? "")} onChange={(v) => set(f.path, v)} />;
      case "image":
        return <ImageField id={id} value={String(value ?? "")} onChange={(v) => set(f.path, v)} />;
      case "toggle":
        return <ToggleField id={id} value={value === true} onChange={(v) => set(f.path, v)} />;
      case "list":
        return (
          <ListField
            id={id}
            value={Array.isArray(value) ? (value as (string | Record<string, string>)[]) : []}
            onChange={(v) => set(f.path, v)}
            itemFields={f.itemFields}
            itemLabel={f.itemLabel}
          />
        );
      default:
        return <TextField id={id} value={String(value ?? "")} onChange={(v) => set(f.path, v)} max={f.max} />;
    }
  };

  return (
    <section className="border-2 border-nero bg-card" aria-labelledby={`sec-${page}-${section.id}`}>
      <header className="border-b border-nero px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id={`sec-${page}-${section.id}`} className="font-display text-xl font-semibold normal-case tracking-[-0.02em] md:text-2xl">
            {section.title}
          </h3>
          {sectionRows.length > 0 ? (
            <span className="cap text-[10px] text-verde">Angepasst</span>
          ) : (
            <span className="cap text-[10px] text-muted-foreground">Standardtext</span>
          )}
        </div>
        <p className="mt-1 text-base text-muted-foreground">{section.where}</p>
      </header>

      <div key={version} className="space-y-6 px-4 py-5 md:px-6">
        {section.fields.map((f) => (
          <div key={f.path}>
            <label htmlFor={`${page}-${f.path}`} className="cap block text-[11px] text-nero">
              {f.label}
            </label>
            {f.hint && <p className="mt-0.5 text-sm text-muted-foreground">{f.hint}</p>}
            <div className="mt-2">{renderField(f)}</div>
          </div>
        ))}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-nero px-4 py-4 md:px-6">
        <Button onClick={save} disabled={!dirty || busy}>
          {busy ? "Speichert …" : "Speichern"}
        </Button>
        {dirty && (
          <Button variant="outline" onClick={discard} disabled={busy}>
            Änderungen verwerfen
          </Button>
        )}
        {sectionRows.length > 0 && !dirty && (
          <Button variant="link" onClick={reset} disabled={busy}>
            Auf Standard zurücksetzen
          </Button>
        )}
        <span className="text-sm text-muted-foreground md:ml-auto">
          {dirty
            ? "Ungespeicherte Änderungen"
            : lastChange
              ? `Geändert ${formatWhen(lastChange.updated_at)}${lastChange.updated_by && names[lastChange.updated_by] ? ` von ${names[lastChange.updated_by]}` : ""}`
              : ""}
        </span>
      </footer>
    </section>
  );
};

export default SectionCard;
