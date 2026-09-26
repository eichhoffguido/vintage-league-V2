import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HomeContent } from "@/content/home";
import { cn } from "@/lib/utils";

export interface HomeStats {
  jerseys: number;
  profiles: number;
  trades: number;
}

interface HomeHeroProps {
  content: HomeContent["hero"];
  stats?: HomeStats;
  onSell: () => void;
}

const SLIDE_MS = 6000;
const VERDE_FILL = { "--fill": "hsl(var(--verde))" } as CSSProperties;

/** Suche + CTAs + Kennzahlen — auf Verde (Desktop, im grünen Block) oder auf Avorio (Mobile, unter dem Foto). */
const HeroActions = ({ content, stats, onSell, tone }: HomeHeroProps & { tone: "verde" | "avorio" }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const onVerde = tone === "verde";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  };

  // Kennzahlen mit 0 werden ausgeblendet statt eine falsche Null zu zeigen
  const statItems = stats
    ? ([
        [stats.jerseys, content.stats.jerseys],
        [stats.profiles, content.stats.profiles],
        [stats.trades, content.stats.trades],
      ] as const).filter(([value]) => value > 0)
    : [];

  return (
    <div>
      <form onSubmit={submit} className={cn("flex w-full max-w-[500px] border", onVerde ? "border-avorio" : "border-nero")}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={content.searchPlaceholder}
          aria-label="Trikots durchsuchen"
          className={cn(
            "h-[52px] min-w-0 flex-1 px-4 text-[17px] text-nero placeholder:text-nero/50 focus:outline-none",
            onVerde ? "bg-avorio" : "bg-card",
          )}
        />
        <button type="submit" className="cap flex items-center gap-2 bg-nero px-4 text-xs text-avorio md:px-5" aria-label="Suchen">
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Suchen</span>
        </button>
      </form>

      <div className="mt-3.5 grid grid-cols-1 gap-2 sm:flex sm:gap-3">
        <Button asChild variant={onVerde ? "light" : "dark"} size="lg">
          <a
            href={content.primaryCta.to}
            onClick={(e) => {
              e.preventDefault();
              navigate(content.primaryCta.to);
            }}
          >
            {content.primaryCta.label}
          </a>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className={onVerde ? "border-avorio text-avorio hover:bg-avorio hover:text-nero" : undefined}
          onClick={onSell}
        >
          {content.secondaryCta.label}
        </Button>
      </div>

      {statItems.length > 0 && (
        <div className={cn("mt-6 flex max-w-[480px] border-t pt-4", onVerde ? "border-avorio/50" : "border-nero")}>
          {statItems.map(([value, label], i) => (
            <div key={label} className={cn("flex-1", i > 0 && cn("border-l pl-3 md:pl-[18px]", onVerde ? "border-avorio/50" : "border-nero"))}>
              <div className="num text-[28px] leading-none md:text-[38px]">{value.toLocaleString("de-DE")}</div>
              <div className={cn("cap mt-1 text-[10px] md:text-[11px]", onVerde ? "text-avorio/80" : "text-muted-foreground")}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Hero „Il tuo album di maglie.“ (Skill cc-design §5): verde Block + Foto, gelber Kreis wird vom Block
 * angeschnitten und läuft mit 30 % Deckkraft ins Foto weiter (gleicher Mittelpunkt/Radius).
 * Der Slider (Maglie · Cimeli · Rarità) wechselt Foto, Unterzeile, Stempel.
 */
const HomeHero = ({ content, stats, onSell }: HomeHeroProps) => {
  const [active, setActive] = useState(0);
  const slides = content.slides;
  const slide = slides[active];

  useEffect(() => {
    const timer = setInterval(() => setActive((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slideNav = (
    <div className="cap relative flex flex-wrap items-center gap-3 text-[10px] md:text-[11px]">
      {slides.map((s, i) => (
        <button
          key={s.label}
          type="button"
          onClick={() => setActive(i)}
          className={cn("transition-opacity", i === active ? "opacity-100" : "opacity-55 hover:opacity-100")}
          aria-pressed={i === active}
        >
          {s.label}
        </button>
      ))}
      <span className="ml-2 hidden gap-1.5 md:flex" aria-hidden>
        {slides.map((s, i) => (
          <i key={s.label} className={cn("block h-[3px] bg-avorio transition-all", i === active ? "w-[30px]" : "w-[14px] opacity-35")} />
        ))}
      </span>
    </div>
  );

  const photo = (
    <>
      {slides.map((s, i) => (
        <img
          key={s.label}
          src={s.image}
          alt={i === active ? s.imageAlt : ""}
          aria-hidden={i !== active}
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-1000", i === active ? "opacity-100" : "opacity-0")}
          style={{ objectPosition: "52% 50%" }}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
      <div className="cap absolute bottom-3 left-3 z-[3] bg-avorio px-2.5 py-2 text-[10px] text-nero md:bottom-6 md:left-6 md:px-3.5 md:py-2.5 md:text-[11px]">
        {slide.caption}
      </div>
      <div className="absolute right-3 top-3 z-[3] flex h-[96px] w-[96px] -rotate-[9deg] items-center justify-center rounded-full bg-avorio text-center md:right-6 md:top-6 md:h-[104px] md:w-[104px]">
        <div className="cap text-[8px] leading-[1.35] tracking-[0.08em] text-nero md:text-[10px] md:tracking-[0.14em]">
          {slide.stamp.map((line, i) => (
            <div key={line} className={i === 0 ? "font-semibold text-verde" : undefined}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <section className="border-b border-nero">
      {/* Desktop */}
      <div className="hidden lg:grid lg:h-[820px] lg:grid-cols-[820fr_620fr]">
        <div className="relative flex flex-col justify-between overflow-hidden bg-verde px-16 pb-12 pt-[52px] text-avorio">
          <div aria-hidden className="pointer-events-none absolute -bottom-[220px] -right-[190px] h-[440px] w-[440px] rounded-full bg-giallo" />
          <div aria-hidden className="pointer-events-none absolute right-10 top-10 h-[120px] w-[120px] rounded-full border-2 border-avorio opacity-55" />
          {slideNav}
          <div className="relative">
            <h1 className="display text-[clamp(88px,9.4vw,136px)] leading-[0.84] tracking-[-0.06em]">
              {content.headline.map((line) => (
                <span key={line} className="block">{line}</span>
              ))}
              <span className="hollow block" style={{ ...VERDE_FILL, WebkitTextStrokeWidth: "5px" }}>{content.hollowWord}</span>
            </h1>
            <p className="mt-7 max-w-[470px] text-xl leading-[1.38]">{slide.subline}</p>
            <div className="mt-7">
              <HeroActions content={content} stats={stats} onSell={onSell} tone="verde" />
            </div>
          </div>
        </div>
        <div className="grain grain-dark relative overflow-hidden bg-nero">
          {photo}
          {/* gelber Kreis läuft ins Foto weiter — Mittelpunkt 30 px links der Fotokante, 820 px unter der Oberkante */}
          <div aria-hidden className="pointer-events-none absolute -left-[250px] top-[600px] z-[2] h-[440px] w-[440px] rounded-full bg-giallo opacity-30" />
        </div>
      </div>

      {/* Mobile / Tablet */}
      <div className="lg:hidden">
        <div className="relative overflow-hidden bg-verde px-4 pb-7 pt-7 text-avorio md:px-10">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-[84px] h-[190px] w-[190px] rounded-full bg-giallo" />
          {slideNav}
          <h1 className="display relative mt-4 text-[62px] leading-[0.84] tracking-[-0.06em] md:text-[96px]">
            {content.headline.map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
            <span className="hollow block" style={VERDE_FILL}>{content.hollowWord}</span>
          </h1>
          <p className="relative mt-5 max-w-[520px] text-base leading-[1.4]">{slide.subline}</p>
        </div>
        <div className="grain grain-dark relative h-[300px] overflow-hidden border-b border-nero bg-nero md:h-[420px]">{photo}</div>
        <div className="px-4 pt-5 md:px-10">
          <HeroActions content={content} stats={stats} onSell={onSell} tone="avorio" />
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
