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
