import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/site-media/${path}` } }) }),
    },
  },
}));

import { parseHeadline, headlinePlainText, toWords, fromWords } from "@/lib/headline";
import { mergeSiteContent } from "@/hooks/useSiteContent";

describe("parseHeadline", () => {
  it("trennt normale und hohle Teile, auch gemischt und mehrfach", () => {
    expect(parseHeadline("Neu im *Album.*")).toEqual([[{ text: "Neu im ", hollow: false }, { text: "Album.", hollow: true }]]);
    expect(parseHeadline("*Il* tuo *album*")).toEqual([
      [{ text: "Il", hollow: true }, { text: " tuo ", hollow: false }, { text: "album", hollow: true }],
    ]);
  });

  it("macht aus Zeilenumbrüchen Zeilen", () => {
    expect(parseHeadline("Il tuo\nalbum di\n*maglie.*")).toHaveLength(3);
  });

  it("lässt ungepaarte Sternchen als Text stehen", () => {
    expect(parseHeadline("5* Trikot")).toEqual([[{ text: "5* Trikot", hollow: false }]]);
  });

  it("liefert Klartext ohne Markierungen", () => {
    expect(headlinePlainText("Neu im *Album.*\nzweite")).toBe("Neu im Album. zweite");
  });
});

describe("mergeSiteContent", () => {
  const defaults = {
    album: { headline: "Neu im *Album.*", subline: "Standard" },
    points: [{ title: "A", text: "a" }],
    banner: { enabled: false, text: "Beta" },
    dealer: { image: "/assets/default.webp" },
  };
  const row = (key: string, value: unknown) => ({ key, value, updated_at: "2026-09-28T10:00:00Z" });

  it("ohne Einträge bleibt alles Standard", () => {
    expect(mergeSiteContent("home", defaults, [])).toBe(defaults);
  });

  it("überschreibt einzelne Texte über ihren Pfad", () => {
    const out = mergeSiteContent("home", defaults, [row("home.album.headline", "Frisch im *Album.*")]);
    expect(out.album.headline).toBe("Frisch im *Album.*");
    expect(out.album.subline).toBe("Standard");
    expect(defaults.album.headline).toBe("Neu im *Album.*"); // Standard unverändert
  });

  it("ignoriert Einträge anderer Seiten, unbekannte Pfade und falsche Formen", () => {
    const out = mergeSiteContent("home", defaults, [
      row("shop.album.headline", "falsch"),
      row("home.unbekannt", "x"),
      row("home.album.headline", 42),
      row("home.points", "kein Array"),
      row("home.points", [{ title: 1 }]),
    ]);
    expect(out).toEqual(defaults);
  });

  it("leerer Text = Standard", () => {
    expect(mergeSiteContent("home", defaults, [row("home.album.subline", "   ")]).album.subline).toBe("Standard");
  });

  it("ersetzt ganze Listen und Schalter", () => {
    const out = mergeSiteContent("home", defaults, [
      row("home.points", [{ title: "B", text: "b" }, { title: "C", text: "c" }]),
      row("home.banner", { enabled: true, text: "Wartung heute Abend" }),
    ]);
    expect(out.points).toHaveLength(2);
    expect(out.banner).toEqual({ enabled: true, text: "Wartung heute Abend" });
  });

  it("macht aus Bild-Pfaden öffentliche URLs, volle URLs bleiben", () => {
    expect(mergeSiteContent("home", defaults, [row("home.dealer.image", "uploads/wand.webp")]).dealer.image).toBe(
      "https://cdn.test/site-media/uploads/wand.webp",
    );
    expect(mergeSiteContent("home", defaults, [row("home.dealer.image", "https://x.test/a.jpg")]).dealer.image).toBe(
      "https://x.test/a.jpg",
    );
  });
});

describe("Wort-Chips ⇄ Speicherformat (CMS-Editor)", () => {
  it("fasst aufeinanderfolgende Outline-Wörter zusammen", () => {
    const lines = toWords("Wissen teilen, voneinander *lernen.*");
    lines[0][0].hollow = true; // „Wissen“ zusätzlich hohl
    expect(fromWords(lines)).toBe("*Wissen* teilen, voneinander *lernen.*");
    lines[0][1].hollow = true;
    expect(fromWords(lines)).toBe("*Wissen teilen,* voneinander *lernen.*");
  });

  it("hin und zurück bleibt gleich, auch mehrzeilig", () => {
    const v = "Il tuo\nalbum di\n*maglie.*";
    expect(fromWords(toWords(v))).toBe(v);
  });

  it("alles normal → keine Sternchen", () => {
    const lines = toWords("Neu im *Album.*").map((l) => l.map((w) => ({ ...w, hollow: false })));
    expect(fromWords(lines)).toBe("Neu im Album.");
  });
});
