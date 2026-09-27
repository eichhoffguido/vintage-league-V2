import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { siteMediaUrl, useSiteContentRows } from "@/hooks/useSiteContent";
import { SITE_MEDIA_BUCKET, uploadSiteImage } from "@/lib/cms";

const FOLDERS = ["uploads", "defaults"] as const;

interface MediaFile {
  path: string;
  created: string | null;
  size: number | null;
}

/** Medien: alle Bilder im Bucket site-media. Löschen nur, wenn das Bild nirgends verwendet wird. */
const MediaLibrary = () => {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { data: rows = [] } = useSiteContentRows();

  const files = useQuery({
    queryKey: ["cms", "media"],
    queryFn: async (): Promise<MediaFile[]> => {
      const all: MediaFile[] = [];
      for (const folder of FOLDERS) {
        const { data, error } = await supabase.storage.from(SITE_MEDIA_BUCKET).list(folder, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
        if (error) throw error;
        for (const f of data ?? []) {
          if (!f.id) continue; // Unterordner
          all.push({ path: `${folder}/${f.name}`, created: f.created_at ?? null, size: (f.metadata?.size as number | undefined) ?? null });
        }
      }
      return all;
    },
  });

  const slides = useQuery({
    queryKey: ["cms", "media-slide-usage"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hero_slides").select("image_path").is("deleted_at", null);
      if (error) throw error;
      return (data ?? []).map((s) => s.image_path).filter(Boolean) as string[];
    },
  });

  const usedPaths = new Set<string>(slides.data ?? []);
  const contentJson = JSON.stringify(rows.map((r) => r.value));
  const isUsed = (path: string) => usedPaths.has(path) || contentJson.includes(`"${path}"`);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      await uploadSiteImage(file);
      await queryClient.invalidateQueries({ queryKey: ["cms", "media"] });
      toast.success("Bild hochgeladen.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hochladen fehlgeschlagen.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const copy = async (path: string) => {
    try {
      await navigator.clipboard.writeText(siteMediaUrl(path));
      toast.success("Link kopiert.");
    } catch {
      toast.error("Kopieren nicht möglich.");
    }
  };

  const remove = async (path: string) => {
    if (!window.confirm("Dieses Bild endgültig löschen?")) return;
    const { error } = await supabase.storage.from(SITE_MEDIA_BUCKET).remove([path]);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["cms", "media"] });
    toast.success("Bild gelöscht.");
  };

  return (
    <section className="border-2 border-nero bg-card">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-nero px-4 py-4 md:px-6">
        <div>
          <h3 className="font-display text-xl font-semibold normal-case tracking-[-0.02em] md:text-2xl">Medien</h3>
          <p className="mt-1 text-base text-muted-foreground">Alle Bilder, die im CMS verwendet werden können. Verwendete Bilder lassen sich nicht löschen.</p>
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        <Button variant="outline" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Bild hochladen
        </Button>
      </header>
      <div className="grid grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-3 md:px-6 lg:grid-cols-4">
        {files.isLoading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-square animate-pulse bg-sabbia" />)}
        {files.data?.map((f) => {
          const used = isUsed(f.path);
          return (
            <figure key={f.path} className="border border-nero bg-background">
              <div className="grain grain-photo aspect-square overflow-hidden bg-sabbia">
                <img src={siteMediaUrl(f.path)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
              <figcaption className="space-y-2 p-2">
                <div className="cap truncate text-[10px] text-muted-foreground" title={f.path}>{f.path.split("/").pop()}</div>
                <div className="flex items-center justify-between gap-1">
                  <span className={used ? "cap text-[10px] text-verde" : "cap text-[10px] text-muted-foreground"}>{used ? "In Verwendung" : "Unbenutzt"}</span>
                  <span className="flex">
                    <button type="button" onClick={() => copy(f.path)} aria-label="Link kopieren" className="flex h-9 w-9 items-center justify-center hover:bg-nero/10">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(f.path)}
                      disabled={used}
                      aria-label="Bild löschen"
                      title={used ? "Wird verwendet — erst dort ersetzen" : "Löschen"}
                      className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:bg-rosso hover:text-avorio disabled:pointer-events-none disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              </figcaption>
            </figure>
          );
        })}
        {files.data?.length === 0 && <p className="col-span-full text-base text-muted-foreground">Noch keine Bilder.</p>}
      </div>
    </section>
  );
};

export default MediaLibrary;
