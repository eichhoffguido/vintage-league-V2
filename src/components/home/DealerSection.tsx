import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/layout/SectionHeader";
import type { HomeContent } from "@/content/home";

const NUMERALS = ["I", "II", "III", "IV", "V"];

/** „Deine Bühne für besondere Trikots.“ — Bild links, nummerierte Punkte rechts. */
const DealerSection = ({ content }: { content: HomeContent["dealer"] }) => (
  <section className="container mx-auto grid gap-5 px-4 pt-14 md:px-10 md:pt-28 lg:grid-cols-[minmax(0,640px)_1fr] lg:gap-[72px]">
    <div className="order-2 lg:order-1">
      <div className="grain grain-photo h-[220px] overflow-hidden border-2 border-nero md:h-[420px] lg:h-[620px]">
        <img src={content.image} alt={content.imageAlt} loading="lazy" className="h-full w-full object-cover" />
      </div>
    </div>
    <div className="order-1 flex flex-col justify-between lg:order-2">
      <SectionHeader eyebrow={content.eyebrow} headline={content.headline} subline={content.subline} size="md" />
      <div className="order-3 mt-2 lg:mt-8">
        <ol>
          {content.points.map((point, i) => (
            <li key={point.title} className="grid grid-cols-[34px_1fr] gap-3 border-t border-nero py-3 last:border-b md:grid-cols-[56px_1fr] md:gap-4 md:py-[18px]">
              <span className="num text-xl text-verde md:text-[26px]">{NUMERALS[i]}</span>
              <div>
                <div className="font-display text-[15px] font-semibold tracking-[-0.02em] md:text-[19px]">{point.title}</div>
                <div className="mt-1 hidden text-base leading-snug text-muted-foreground md:block">{point.text}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 grid gap-2 sm:flex sm:gap-3 md:mt-7">
          <Button asChild size="lg">
            <Link to={content.primaryCta.to}>{content.primaryCta.label}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="hidden sm:inline-flex">
            <Link to={content.secondaryCta.to}>{content.secondaryCta.label}</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default DealerSection;
