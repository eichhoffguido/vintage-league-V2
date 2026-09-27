import { Fragment, type CSSProperties } from "react";
import { parseHeadline } from "@/lib/headline";

type Ground = "avorio" | "nero" | "verde";

interface HeadlineProps {
  /** Speicherformat: *Wort* = Outline, Zeilenumbruch = neue Zeile. */
  text: string;
  /** Hintergrund hinter dem Text — bestimmt die Hohlschrift-Technik (Skill cc-design §3). */
  ground?: Ground;
  /** Jede Zeile als eigener Block (Hero) statt Zeilenumbruch. */
  blockLines?: boolean;
  /** Zusätzlicher Stil für hohle Wörter (z. B. dickere Kontur im Hero). */
  hollowStyle?: CSSProperties;
}

const FILL: Record<Ground, CSSProperties | undefined> = {
  avorio: undefined,
  nero: { "--fill": "hsl(var(--nero))" } as CSSProperties,
  verde: { "--fill": "hsl(var(--verde))" } as CSSProperties,
};

/**
 * Setzt eine CMS-Überschrift: normale und hohle Wörter frei gemischt.
 * Auf avorio `.hollow-dark`, auf nero/verde `.hollow` mit passender Füllung (paint-order-Technik).
 * Nur den Inhalt — das umgebende h1/h2 mit `.display` liefert der Aufrufer.
 */
const Headline = ({ text, ground = "avorio", blockLines = false, hollowStyle }: HeadlineProps) => {
  const lines = parseHeadline(text);
  const hollowClass = ground === "avorio" ? "hollow-dark" : "hollow";
  const style = hollowStyle ? { ...FILL[ground], ...hollowStyle } : FILL[ground];

  const renderLine = (line: ReturnType<typeof parseHeadline>[number]) =>
    line.map((part, i) =>
      part.hollow ? (
        <span key={i} className={hollowClass} style={style}>
          {part.text}
        </span>
      ) : (
        <Fragment key={i}>{part.text}</Fragment>
      ),
    );

  if (blockLines) {
    return (
      <>
        {lines.map((line, i) => (
          <span key={i} className="block">
            {renderLine(line)}
          </span>
        ))}
      </>
    );
  }

  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderLine(line)}
        </Fragment>
      ))}
    </>
  );
};

export default Headline;
