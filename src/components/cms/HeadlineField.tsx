import { useState } from "react";
import Headline from "@/components/brand/Headline";
import { fromWords, toWords } from "@/lib/headline";
import { cn } from "@/lib/utils";
import type { CmsGround } from "@/content/cmsSchema";

const GROUND_CLASS: Record<CmsGround, string> = {
  avorio: "bg-background text-nero border-2 border-nero",
  nero: "nero-stripe",
  verde: "bg-verde text-avorio",
};

interface HeadlineFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  ground?: CmsGround;
  max?: number;
}

/**
 * Überschrift bearbeiten ohne Sternchen: Text tippen (Enter = neue Zeile), Wörter anklicken →
 * normal ⇄ Outline. Darunter die Vorschau in der echten Schrift auf dem echten Hintergrund.
 */
const HeadlineField = ({ id, value, onChange, ground = "avorio", max }: HeadlineFieldProps) => {
  const initial = toWords(value);
  // Eingabetext ohne Markierungen; lokal, damit Leerzeichen am Ende beim Tippen erhalten bleiben.
  const [plain, setPlain] = useState(() => initial.map((l) => l.map((w) => w.text).join(" ")).join("\n"));
  const words = toWords(value);

  const handleText = (next: string) => {
    setPlain(next);
    // Outline-Markierung bleibt pro Wort-Position erhalten
    const lines = next.split("\n").map((line, li) =>
      line
        .split(/\s+/)
        .filter(Boolean)
        .map((text, wi) => ({ text, hollow: words[li]?.[wi]?.hollow ?? false })),
    );
    onChange(fromWords(lines));
  };

  const toggle = (li: number, wi: number) => {
    const lines = words.map((l, i) => l.map((w, j) => (i === li && j === wi ? { ...w, hollow: !w.hollow } : w)));
    onChange(fromWords(lines));
  };

  const length = plain.replace(/\n/g, " ").length;

  return (
    <div className="space-y-3">
      <textarea
        id={id}
        value={plain}
        onChange={(e) => handleText(e.target.value)}
        rows={Math.max(1, plain.split("\n").length)}
        className="w-full resize-none border border-nero bg-card px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div>
        <div className="cap mb-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Wort anklicken = Outline an / aus</span>
          {max && <span className={cn("num text-sm", length > max && "text-rosso")}>{length}/{max}</span>}
        </div>
        <div className="space-y-1.5">
          {words.map((line, li) => (
            <div key={li} className="flex flex-wrap gap-1.5">
              {line.map((w, wi) => (
                <button
                  key={`${li}-${wi}`}
                  type="button"
                  onClick={() => toggle(li, wi)}
                  aria-pressed={w.hollow}
                  title={w.hollow ? "Outline — klicken für normal" : "Normal — klicken für Outline"}
                  className={cn(
                    "min-h-9 border px-2.5 py-1 font-display text-sm font-semibold uppercase tracking-[-0.02em] transition-colors",
                    w.hollow ? "border-nero bg-card text-transparent [-webkit-text-stroke:1px_hsl(var(--nero))]" : "border-nero bg-nero text-avorio",
                  )}
                >
                  {w.text}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className={cn("overflow-hidden px-4 py-5", GROUND_CLASS[ground])} aria-label="Vorschau">
        <div className="cap mb-2 text-[10px] opacity-60">Vorschau</div>
        <div className="display break-words text-[34px] md:text-[44px]">
          <Headline text={value} ground={ground} />
        </div>
      </div>
    </div>
  );
};

export default HeadlineField;
