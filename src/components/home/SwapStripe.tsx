import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { HomeContent } from "@/content/home";
import Headline from "@/components/brand/Headline";

interface SwapStripeProps {
  content: HomeContent["swap"];
  tradeCount?: number;
}

const SwapIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M17 3l4 4-4 4M21 7H8M7 21l-4-4 4-4M3 17h13" />
  </svg>
);

/** Zwei Trikots als Silhouetten-Masken mit verde ⇄-Scheibe (Skill cc-design §5). */
const ShirtPair = ({ content, size }: { content: HomeContent["swap"]; size: "sm" | "lg" }) => {
  const shirt = size === "lg" ? "w-[330px] h-[385px]" : "w-[44%] aspect-[330/385]";
  return (
    <div className={size === "lg" ? "flex items-start gap-5" : "relative flex items-start justify-between"}>
      {[content.offer, content.search].map((side, i) => (
        <figure key={side.label} className={size === "lg" ? "w-[330px]" : "w-[44%]"}>
          <div className={`shirt-mask grain grain-dark relative overflow-hidden bg-nero ${size === "lg" ? shirt : "aspect-[330/385] w-full"}`}>
            <img
              src={side.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              style={i === 1 ? { transform: "scale(1.3)", transformOrigin: "50% 30%", objectPosition: "50% 30%" } : undefined}
            />
          </div>
          <figcaption className="cap mt-3 border-t border-avorio pt-2.5 text-[10px] leading-[1.7] md:text-[11px]">
            <span className="text-avorio/60">{side.label}</span>
            <br />
            {side.caption}
          </figcaption>
        </figure>
      ))}
      <div
        className={
          size === "lg"
            ? "absolute left-1/2 top-[150px] z-[3] flex h-[84px] w-[84px] -translate-x-1/2 items-center justify-center rounded-full bg-verde text-avorio"
            : "absolute left-1/2 top-[28%] z-[3] flex h-[52px] w-[52px] -translate-x-1/2 items-center justify-center rounded-full bg-verde text-avorio"
        }
      >
        <SwapIcon className={size === "lg" ? "h-9 w-9" : "h-6 w-6"} />
      </div>
    </div>
  );
};

/** Schwarzer Streifen „Scambio.“ — Trikottausch (Skill cc-design §5 „Nero stripes“). */
const SwapStripe = ({ content, tradeCount }: SwapStripeProps) => (
  <section className="nero-stripe mt-14 overflow-hidden md:mt-28" aria-label="Trikottausch">
    <div className="container relative mx-auto px-4 pb-9 pt-8 md:px-10 xl:h-[760px] xl:py-0">
      <div className="cap relative z-[2] text-[11px] md:text-xs xl:absolute xl:left-10 xl:top-12">
        <span className="text-rosso">{content.eyebrow.split(" · ")[0]}</span>
        {content.eyebrow.includes(" · ") ? ` · ${content.eyebrow.split(" · ").slice(1).join(" · ")}` : ""}
      </div>
      <div
        aria-hidden
        className="display hollow relative z-[1] mt-3.5 text-[70px] leading-[0.8] md:text-[150px] xl:absolute xl:left-8 xl:top-[92px] xl:mt-0 xl:text-[236px]"
      >
        {content.word}
      </div>

      {/* Trikots */}
      <div className="relative z-[2] -mt-6 md:-mt-12 xl:absolute xl:left-[520px] xl:top-[150px] xl:mt-0">
        <div className="xl:hidden">
          <ShirtPair content={content} size="sm" />
        </div>
        <div className="relative hidden xl:block">
          <ShirtPair content={content} size="lg" />
        </div>
      </div>

      {/* Text + CTAs */}
      <div className="relative z-[3] mt-6 xl:absolute xl:left-10 xl:top-[380px] xl:mt-0 xl:w-[420px]">
        <h2 className="display text-[30px] leading-[0.92] md:text-[52px]">
          <Headline text={content.headline} ground="nero" />
        </h2>
        <p className="mt-3 text-[15px] leading-[1.45] text-avorio/85 md:mt-5 md:text-lg">{content.text}</p>
        <div className="mt-5 grid gap-2 sm:flex sm:gap-3 md:mt-7">
          <Button asChild variant="light" size="lg">
            <Link to={content.primaryCta.to}>{content.primaryCta.label}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-avorio text-avorio hover:bg-avorio hover:text-nero">
            <Link to={content.secondaryCta.to}>{content.secondaryCta.label}</Link>
          </Button>
        </div>
      </div>

      {tradeCount !== undefined && tradeCount > 0 && (
        <div className="cap relative z-[2] mt-6 text-[11px] text-avorio/75 xl:absolute xl:bottom-12 xl:right-10 xl:mt-0 xl:text-right">
          <span className="num mr-2 align-baseline text-[32px] tracking-normal text-avorio">{tradeCount}</span>
          {content.countLabel}
        </div>
      )}
    </div>
  </section>
);

export default SwapStripe;
