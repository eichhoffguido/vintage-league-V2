import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/layout/SectionHeader";
import type { HomeContent } from "@/content/home";

/** Community-Band: Text 5/12 links, Bild 7/12 rechts, durch 2-px-Linien gefasst. */
const CommunityBand = ({ content }: { content: HomeContent["community"] }) => (
  <section className="border-b-2 border-nero lg:grid lg:grid-cols-[5fr_7fr]">
    <div className="grain grain-photo relative h-[240px] overflow-hidden md:h-[420px] lg:order-2 lg:h-[720px]">
      <img src={content.image} alt={content.imageAlt} loading="lazy" className="h-full w-full object-cover" />
      <div className="cap absolute bottom-3 left-3 z-[2] bg-avorio px-2.5 py-2 text-[10px] text-nero md:bottom-6 md:left-6 md:px-3.5 md:py-2.5 md:text-[11px]">
        {content.caption}
      </div>
    </div>
    <div className="flex flex-col justify-between px-4 pb-10 pt-7 md:px-10 md:pb-16 md:pt-20 lg:order-1 lg:border-r-2 lg:border-nero lg:pr-12">
      <SectionHeader eyebrow={content.eyebrow} headline={content.headline} subline={content.text} size="md" />
      <div className="mt-8 md:mt-10">
        <ul className="hidden md:block">
          {content.topics.map((topic) => (
            <li key={topic.title} className="flex items-baseline justify-between gap-4 border-t border-nero py-3.5 last:border-b">
              <span className="font-display text-[19px] font-semibold">{topic.title}</span>
              <span className="cap text-[11px] text-muted-foreground">{topic.hint}</span>
            </li>
          ))}
        </ul>
        <Button asChild variant="dark" size="lg" className="w-full md:mt-7 md:w-auto">
          <Link to={content.cta.to}>{content.cta.label}</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default CommunityBand;
