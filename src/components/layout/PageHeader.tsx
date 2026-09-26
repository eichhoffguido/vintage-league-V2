import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "avorio" | "nero" | "verde";

interface PageHeaderProps {
  tone?: Tone;
  /** Kleine Versal-Zeile über der Headline, Italienisch · Deutsch (z. B. „Il mercato · Marktplatz“). */
  eyebrow?: string;
  /** Headline ohne das hohle Schlusswort. */
  title: string;
  /** Letztes Wort der Headline — wird als Hohlschrift gesetzt (Skill cc-design §3). */
  hollowWord?: string;
  subline?: ReactNode;
  /** Rechts/unten: Suche, CTAs … */
  children?: ReactNode;
  className?: string;
}

const TONE_CLASS: Record<Tone, string> = {
  avorio: "bg-background text-foreground border-b border-nero",
  nero: "nero-stripe",
  verde: "bg-verde text-avorio",
};

/**
 * Seitenkopf-Band. Sorgt für den Hell/Dunkel-Rhythmus je Seite (Skill cc-design §5.1).
 * Auf nero/verde wird das hohle Wort mit der Band-Farbe gefüllt, auf avorio dunkel konturiert.
 */
const PageHeader = ({ tone = "nero", eyebrow, title, hollowWord, subline, children, className }: PageHeaderProps) => {
  const hollowClass = tone === "avorio" ? "hollow-dark" : "hollow";
  const fill = tone === "verde" ? "hsl(var(--verde))" : tone === "nero" ? "hsl(var(--nero))" : undefined;

  return (
    <section className={cn("relative overflow-hidden", TONE_CLASS[tone], className)}>
      {tone === "verde" && (
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-giallo md:-right-28 md:-top-28 md:h-96 md:w-96" />
      )}
      <div className="container relative mx-auto px-4 py-12 md:px-10 md:py-20">
        {eyebrow && (
          <div className={cn("cap", tone === "avorio" ? "text-rosso" : "text-avorio/75")}>{eyebrow}</div>
        )}
        <h1 className="display mt-3 text-[40px] md:text-[80px]">
          {title}
          {hollowWord && (
            <>
              {" "}
              <span className={hollowClass} style={fill ? ({ "--fill": fill } as CSSProperties) : undefined}>
                {hollowWord}
              </span>
            </>
          )}
        </h1>
        {subline && (
          <p className={cn("mt-5 max-w-2xl text-base md:text-lg", tone === "avorio" ? "text-muted-foreground" : "text-avorio/85")}>
            {subline}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
};

export default PageHeader;
