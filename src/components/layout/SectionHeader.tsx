import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import Headline from "@/components/brand/Headline";

interface SectionHeaderProps {
  eyebrow?: string;
  /** CMS-Format: *Wort* = Outline, frei mischbar. Hat Vorrang vor title/hollowWord. */
  headline?: string;
  title?: string;
  hollowWord?: string;
  subline?: ReactNode;
  link?: { label: string; to: string };
  /** "lg" = 80 px (Hauptsektion), "md" = 68 px */
  size?: "lg" | "md";
  /** Auf dunklem Grund (nero) */
  onDark?: boolean;
  className?: string;
  as?: "h1" | "h2";
}

/** Sektionskopf nach Skill cc-design §6: Eyebrow (rosso) → Headline mit hohlem Schlusswort → Unterzeile → Link rechts. */
const SectionHeader = ({ eyebrow, headline, title = "", hollowWord, subline, link, size = "lg", onDark = false, className, as: Tag = "h2" }: SectionHeaderProps) => (
  <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
    <div>
      {eyebrow && <div className={cn("cap", onDark ? "text-avorio/75" : "text-rosso")}>{eyebrow}</div>}
      <Tag
        className={cn(
          "display mt-2.5 md:mt-3.5",
          size === "lg" ? "text-[40px] md:text-[80px]" : "text-[36px] md:text-[68px] md:leading-[0.9]",
        )}
      >
        {headline !== undefined ? <Headline text={headline} ground={onDark ? "nero" : "avorio"} /> : title}
        {headline === undefined && hollowWord && (
          <>
            {" "}
            <span className={onDark ? "hollow" : "hollow-dark"}>{hollowWord}</span>
          </>
        )}
      </Tag>
      {subline && <p className={cn("mt-3.5 text-base md:mt-4 md:text-lg", onDark ? "text-avorio/85" : "text-muted-foreground")}>{subline}</p>}
    </div>
    {link && (
      <Link to={link.to} className="cap self-start whitespace-nowrap border-b border-current pb-1 text-xs md:self-auto">
        {link.label}
      </Link>
    )}
  </div>
);

export default SectionHeader;
