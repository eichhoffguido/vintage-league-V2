import { cn } from "@/lib/utils";

type LogoTone = "light" | "dark" | "verde";

interface MonogramProps {
  tone?: LogoTone;
  className?: string;
  title?: string;
}

// Farben je Untergrund: Ring-Farbe + Lückenfarbe (= Untergrund), roter Punkt bleibt.
const TONE: Record<LogoTone, { ring: string; gap: string }> = {
  light: { ring: "hsl(var(--nero))", gap: "hsl(var(--avorio))" },
  dark: { ring: "hsl(var(--avorio))", gap: "hsl(var(--nero))" },
  verde: { ring: "hsl(var(--avorio))", gap: "hsl(var(--verde))" },
};

/** Logo 03 „CC-Ball“: zwei offene C überlagern sich zum Ball, der rote Punkt ist der Berührungspunkt. */
export const Monogram = ({ tone = "light", className, title = "Calcio Classics" }: MonogramProps) => {
  const c = TONE[tone];
  return (
    <svg viewBox="0 0 190 150" className={cn("h-9 w-auto", className)} role="img" aria-label={title}>
      <circle cx="70" cy="75" r="62" fill="none" stroke={c.ring} strokeWidth="14" />
      <circle cx="120" cy="75" r="62" fill="none" stroke={c.ring} strokeWidth="14" />
      <rect x="120" y="62" width="30" height="26" fill={c.gap} />
      <rect x="45" y="62" width="30" height="26" fill={c.gap} />
      <circle cx="95" cy="75" r="10" fill="hsl(var(--rosso))" />
    </svg>
  );
};

interface LogoProps {
  tone?: LogoTone;
  className?: string;
  monogramClassName?: string;
  showWordmark?: boolean;
}

/** Monogramm + Wortmarke „Calcio Classics“ (Jost 700, Versalien). */
const Logo = ({ tone = "light", className, monogramClassName, showWordmark = true }: LogoProps) => (
  <span className={cn("inline-flex items-center gap-3", className)}>
    <Monogram tone={tone} className={monogramClassName} title={showWordmark ? "" : "Calcio Classics"} />
    {showWordmark && (
      <span
        className={cn(
          "font-display text-[19px] font-bold uppercase leading-none tracking-[-0.045em] md:text-[21px]",
          tone === "light" ? "text-nero" : "text-avorio",
        )}
      >
        Calcio Classics
      </span>
    )}
  </span>
);

export default Logo;
