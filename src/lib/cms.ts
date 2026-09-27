// CC-C3 — Lesen/Schreiben für die CMS-Oberfläche.
// Schlüssel = "<seite>.<pfad>" (z. B. "home.album.headline"). Ein Wert, der dem Standard entspricht,
// wird NICHT gespeichert (Eintrag gelöscht) — so bleibt der Standard aus dem Code maßgeblich.
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { compressImage } from "@/utils/compressImage";

export type CmsValue = unknown;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Wert an einem Pfad wie "dealer.primaryCta.label". */
export function getAtPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((cur, seg) => (isRecord(cur) ? cur[seg] : undefined), obj);
}

export const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Speichert Felder eines Abschnitts. Gleich dem Standard → Eintrag löschen, sonst upsert.
 * Wirft bei Fehlern (RLS: nur Admins dürfen schreiben).
 */
export async function saveCmsFields(
  page: string,
  fields: { path: string; value: CmsValue; defaultValue: CmsValue }[],
  userId: string | undefined,
): Promise<void> {
  const toDelete = fields.filter((f) => sameValue(f.value, f.defaultValue)).map((f) => `${page}.${f.path}`);
  const toUpsert = fields
    .filter((f) => !sameValue(f.value, f.defaultValue))
    .map((f) => ({ key: `${page}.${f.path}`, value: f.value as Json, updated_by: userId ?? null }));

  if (toUpsert.length > 0) {
    const { error } = await supabase.from("site_content").upsert(toUpsert, { onConflict: "key" });
    if (error) throw error;
  }
  if (toDelete.length > 0) {
    const { error } = await supabase.from("site_content").delete().in("key", toDelete);
    if (error) throw error;
  }
}

/** Setzt Felder auf den Standard zurück (Einträge löschen). */
export async function resetCmsFields(page: string, paths: string[]): Promise<void> {
  const { error } = await supabase.from("site_content").delete().in("key", paths.map((p) => `${page}.${p}`));
  if (error) throw error;
}

export const SITE_MEDIA_BUCKET = "site-media";

/** Lädt ein Bild verkleinert (JPEG, ≤ 200 KB, max. 1800 px) nach site-media/uploads/ und gibt den Pfad zurück. */
export async function uploadSiteImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Bitte eine Bilddatei wählen (JPG, PNG oder WebP).");
  const blob = await compressImage(file, { maxDimension: 1800, maxBytes: 200 * 1024 });
  const path = `uploads/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(SITE_MEDIA_BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`Hochladen fehlgeschlagen: ${error.message}`);
  return path;
}
