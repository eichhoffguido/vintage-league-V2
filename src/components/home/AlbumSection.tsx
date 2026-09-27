import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import JerseyCard from "@/components/JerseyCard";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";
import SectionHeader from "@/components/layout/SectionHeader";
import type { HomeContent } from "@/content/home";
import { CATEGORY_TO_FILTERS, HEADER_CATEGORY_CHIPS, categoryToShopUrl } from "@/data/categoryFilters";
import { DEFAULT_FILTERS } from "@/hooks/useFilterState";
import { filterJerseys } from "@/utils/filterJerseys";
import { getPrimaryImage } from "@/utils/jerseyImage";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Jersey = Tables<"user_jerseys">;

interface AlbumSectionProps {
  content: HomeContent["album"];
  jerseys: Jersey[];
  loading: boolean;
  onQuickBuy: (jerseyId: string) => void;
}

const VISIBLE = 8;
const ALL = "all";

/**
 * „Neu im Album.“ — neueste Angebote als Figurina-Raster (4 Spalten Desktop, 2 Mobile).
 * Die Chips filtern wirklich (gleiche Logik wie der Marktplatz); „Alle anzeigen“ öffnet den Marktplatz
 * mit derselben Kategorie.
 */
const AlbumSection = ({ content, jerseys, loading, onQuickBuy }: AlbumSectionProps) => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>(ALL);

  const visible = useMemo(() => {
    if (category === ALL) return jerseys.slice(0, VISIBLE);
    const filters = { ...DEFAULT_FILTERS, ...CATEGORY_TO_FILTERS[category] };
    return (filterJerseys(jerseys as unknown as Parameters<typeof filterJerseys>[0], filters) as unknown as Jersey[]).slice(0, VISIBLE);
  }, [category, jerseys]);

  const allLink = category === ALL ? "/shop" : categoryToShopUrl(category);
  const chips = [{ key: ALL, label: "Alle" }, ...HEADER_CATEGORY_CHIPS];

  return (
    <section className="container mx-auto px-4 pt-14 md:px-10 md:pt-[104px]">
      <SectionHeader
        eyebrow={content.eyebrow}
        headline={content.headline}
        subline={content.subline}
        link={{ label: content.allLabel, to: allLink }}
      />

      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:mt-9 md:flex-wrap md:px-0 md:pb-7" role="tablist" aria-label="Kategorien">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            role="tab"
            aria-selected={category === chip.key}
            onClick={() => setCategory(chip.key)}
            className={cn(
              "cap shrink-0 border border-nero px-3.5 py-2.5 text-[11px] transition-colors md:text-xs",
              category === chip.key ? "bg-nero text-avorio" : "hover:bg-nero/5",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 md:mt-0 md:gap-6 lg:grid-cols-4">
        {loading
          ? Array.from({ length: VISIBLE }).map((_, i) => (
              <div key={i} className={cn(i >= 4 && "hidden md:block")}>
                <JerseyCardSkeleton />
              </div>
            ))
          : visible.map((jersey, i) => (
              <div key={jersey.id} className={cn(i >= 4 && "hidden md:block")}>
                <JerseyCard
                  id={jersey.id}
                  name={jersey.name}
                  team={jersey.team}
                  league={jersey.league}
                  year={jersey.year}
                  price_cents={jersey.price_cents ?? 0}
                  imageUrl={getPrimaryImage(jersey) ?? undefined}
                  verification_status={jersey.verification_status as "pending" | "verified" | "rejected"}
                  condition={jersey.condition as 1 | 2 | 3 | 4 | 5}
                  size={jersey.size}
                  user_id={jersey.user_id}
                  sale_price_cents={jersey.sale_price_cents ?? undefined}
                  available_for_trade={jersey.available_for_trade ?? false}
                  listing_type={jersey.listing_type ?? undefined}
                  onClick={() => navigate(`/jersey/${jersey.id}`)}
                  onQuickBuy={() => onQuickBuy(jersey.id)}
                />
              </div>
            ))}
      </div>

      {!loading && visible.length === 0 && (
        <div className="border-2 border-nero bg-card px-6 py-10 text-center">
          <p className="font-display text-lg font-semibold tracking-[-0.02em]">In dieser Kategorie ist gerade nichts Neues.</p>
          <Link to={allLink} className="cap mt-3 inline-block border-b border-nero pb-1 text-xs">
            Im Marktplatz stöbern →
          </Link>
        </div>
      )}
    </section>
  );
};

export default AlbumSection;
