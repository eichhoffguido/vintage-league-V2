// Überschriften-Format des CMS (Skill cc-design §3): ein Text, *Wort* = Outline, Zeilenumbruch = neue Zeile.
// Beispiel: "Il tuo\nalbum di *maglie.*" → Zeile 1 „Il tuo“, Zeile 2 „album di “ + hohl „maglie.“

export interface HeadlinePart {
  text: string;
  hollow: boolean;
}

/** Zerlegt eine Überschrift in Zeilen und Teile (normal / hohl). Ungepaarte Sternchen bleiben Text. */
export function parseHeadline(source: string): HeadlinePart[][] {
  return source.split("\n").map((line) => {
    const parts: HeadlinePart[] = [];
    const re = /\*([^*]+)\*/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(line)) !== null) {
      if (match.index > last) parts.push({ text: line.slice(last, match.index), hollow: false });
      parts.push({ text: match[1], hollow: true });
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push({ text: line.slice(last), hollow: false });
    return parts;
  });
}

/** Überschrift ohne Markierungen (für title-Attribute, Suche, Screenreader-Texte). */
export const headlinePlainText = (source: string) => source.replace(/\*([^*]+)\*/g, "$1").replace(/\n/g, " ");

/** Baut das Speicherformat aus Titel + hohlem Schlusswort (bisheriges Muster title/hollowWord). */
export const toHeadline = (title: string, hollowWord?: string) =>
  hollowWord ? `${title} *${hollowWord}*`.trim() : title;

// --- CMS-Editor: Wörter mit Outline-Markierung ⇄ Speicherformat ------------------------------------

export interface HeadlineWord {
  text: string;
  hollow: boolean;
}

/** Speicherformat → Zeilen aus Wörtern mit Outline-Markierung. */
export function toWords(value: string): HeadlineWord[][] {
  return parseHeadline(value).map((line) =>
    line.flatMap((part) =>
      part.text
        .split(/\s+/)
        .filter(Boolean)
        .map((text) => ({ text, hollow: part.hollow })),
    ),
  );
}

/** Zeilen aus Wörtern → Speicherformat. Aufeinanderfolgende Outline-Wörter werden zu *…* zusammengefasst. */
export function fromWords(lines: HeadlineWord[][]): string {
  return lines
    .map((words) => {
      const out: string[] = [];
      let run: string[] = [];
      const flush = () => {
        if (run.length) out.push(`*${run.join(" ")}*`);
        run = [];
      };
      for (const w of words) {
        if (w.hollow) run.push(w.text);
        else {
          flush();
          out.push(w.text);
        }
      }
      flush();
      return out.join(" ");
    })
    .join("\n");
}

