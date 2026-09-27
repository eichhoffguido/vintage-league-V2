import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import SectionCard from "@/components/cms/SectionCard";
import { FaqEditor, HeroSlidesEditor } from "@/components/cms/TableListEditors";
import LegalEditor from "@/components/cms/LegalEditor";
import MediaLibrary from "@/components/cms/MediaLibrary";
import CategoryEditor from "@/components/cms/CategoryEditor";
import { CMS_PAGES, type CmsPage } from "@/content/cmsSchema";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSiteContentRows } from "@/hooks/useSiteContent";
import { cn } from "@/lib/utils";

const EXTRA = [
  { id: "categories", title: "Community-Kategorien" },
  { id: "legal", title: "Rechtliches" },
  { id: "media", title: "Medien" },
] as const;

/** CMS (CC-C3): Inhalte aller Seiten pflegen — einfach, seitenweise, in der Reihenfolge wie auf der Seite. */
const AdminCms = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const area = params.get("bereich") ?? "home";

  const admin = useQuery({
    queryKey: ["is-admin-strict", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data?.is_admin === true;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
    else if (admin.data === false || admin.isError) navigate("/", { replace: true });
  }, [authLoading, user, admin.data, admin.isError, navigate]);

  const rows = useSiteContentRows();
  const updaterIds = [...new Set((rows.data ?? []).map((r) => r.updated_by).filter(Boolean))] as string[];
  const names = useQuery({
    queryKey: ["cms", "names", updaterIds.join(",")],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, display_name").in("id", updaterIds);
      return Object.fromEntries((data ?? []).map((p) => [p.id, p.display_name ?? "Admin"])) as Record<string, string>;
    },
    enabled: updaterIds.length > 0,
  });

  const choose = (id: string) => {
    setParams({ bereich: id });
    window.scrollTo({ top: 0 });
  };

  if (authLoading || !user || admin.data !== true) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="nero-stripe h-56" />
      </div>
    );
  }

  const page: CmsPage | undefined = CMS_PAGES.find((p) => p.page === area);
  const areaTitle = page?.title ?? EXTRA.find((e) => e.id === area)?.title ?? "Startseite";

  const navButton = (id: string, title: string) => (
    <button
      key={id}
      type="button"
      onClick={() => choose(id)}
      aria-current={area === id ? "page" : undefined}
      className={cn(
        "block w-full border-b border-nero/20 px-3 py-2.5 text-left font-display text-[15px] font-semibold tracking-[-0.02em] transition-colors",
        area === id ? "bg-nero text-avorio" : "hover:bg-nero/5",
      )}
    >
      {title}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageHeader
        tone="nero"
        eyebrow="Redazione · CMS"
        headline="Inhalte *pflegen.*"
        subline="Texte, Bilder und Rechtliches aller Seiten. Speichern wirkt sofort. Leere Felder zeigen den Standardtext."
      />

      <div className="container mx-auto px-4 py-8 md:px-10 md:py-12 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        {/* Navigation: Desktop Liste, mobil Auswahl */}
        <nav aria-label="CMS-Bereiche" className="mb-6 lg:mb-0">
          <label className="lg:hidden">
            <span className="cap text-[11px]">Bereich</span>
            <select
              value={area}
              onChange={(e) => choose(e.target.value)}
              className="cap mt-2 h-11 w-full border border-nero bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <optgroup label="Seiten">
                {CMS_PAGES.map((p) => <option key={p.page} value={p.page}>{p.title}</option>)}
              </optgroup>
              <optgroup label="Weiteres">
                {EXTRA.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </optgroup>
            </select>
          </label>
          <div className="sticky top-40 hidden border-2 border-nero bg-card lg:block">
            <div className="cap border-b border-nero px-3 py-2 text-[10px] text-muted-foreground">Seiten</div>
            {CMS_PAGES.map((p) => navButton(p.page, p.title))}
            <div className="cap border-b border-nero px-3 py-2 text-[10px] text-muted-foreground">Weiteres</div>
            {EXTRA.map((e) => navButton(e.id, e.title))}
          </div>
        </nav>

        <main className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-nero pb-3">
            <h2 className="display text-[30px] md:text-[44px]">{areaTitle}</h2>
            {page && (
              <a href={page.url} target="_blank" rel="noopener noreferrer" className="cap text-xs underline underline-offset-4">
                Auf der Seite ansehen ↗
              </a>
            )}
          </div>

          {rows.isLoading ? (
            <div className="h-64 animate-pulse bg-sabbia" />
          ) : rows.isError ? (
            <p className="text-base text-rosso">Inhalte konnten nicht geladen werden. Bitte Seite neu laden.</p>
          ) : area === "legal" ? (
            <LegalEditor />
          ) : area === "media" ? (
            <MediaLibrary />
          ) : area === "categories" ? (
            <CategoryEditor />
          ) : page ? (
            page.sections.map((section) =>
              section.special === "heroSlides" ? (
                <section key={section.id} className="space-y-3">
                  <h3 className="font-display text-xl font-semibold normal-case tracking-[-0.02em] md:text-2xl">{section.title}</h3>
                  <p className="text-base text-muted-foreground">{section.where}</p>
                  <HeroSlidesEditor />
                </section>
              ) : section.special === "faqItems" ? (
                <section key={section.id} className="space-y-3">
                  <h3 className="font-display text-xl font-semibold normal-case tracking-[-0.02em] md:text-2xl">{section.title}</h3>
                  <p className="text-base text-muted-foreground">{section.where}</p>
                  <FaqEditor />
                </section>
              ) : (
                <SectionCard key={`${page.page}-${section.id}`} page={page.page} section={section} rows={rows.data ?? []} names={names.data ?? {}} />
              ),
            )
          ) : (
            <p className="text-base text-muted-foreground">Bereich nicht gefunden.</p>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminCms;
