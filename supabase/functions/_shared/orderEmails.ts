// CC-ORDER-MAILS — Inhalte der Bestell-Mails (bezahlt, versendet, erhalten).
//
// Reine Funktionen: keine Deno-Globals, keine URL-Imports — wird auch von Vitest getestet
// (src/test/orderEmails.test.ts). Layout wie die Supabase-Auth-Mails (tools/gen_mail_templates.py):
// Tabellen + Inline-Styles, Logo, Tricolore, Versalien-Überschrift, verde Button.

export type OrderEmailEvent = "paid_buyer" | "paid_seller" | "shipped_buyer" | "received_seller";

export interface OrderEmailData {
  siteUrl: string;
  /** z. B. „Hamburger SV 1983/84“ */
  jerseyTitle: string;
  /** Trikotname, z. B. „Heimtrikot“ */
  jerseyName: string;
  size: string;
  amountCents: number;
  buyerName: string;
  sellerName: string;
  /** Zeilen der Lieferadresse (Name, Straße, PLZ Ort) */
  addressLines: string[];
  carrierLabel: string;
  trackingNumber: string;
  trackingUrl: string | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const AVORIO = "#F1EBDD", CARTA = "#F7F2E6", NERO = "#111111", VERDE = "#1F6B43", ROSSO = "#D0281E", MUTED = "#5C5852";
const DISPLAY = "'Jost','Futura','Century Gothic',Arial,sans-serif";
const TEXT = "'Archivo Narrow','Arial Narrow',Arial,sans-serif";
const LOGO_URL = "https://calcioclassics.de/brand/mail-logo.png";
const CONTACT = "kontakt@calcioclassics.de";

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const formatEuro = (cents: number) =>
  `${new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)} €`;

// Gleiche Links wie src/lib/orders.ts (Test prüft die Übereinstimmung)
const TRACKING: Record<string, { label: string; url: ((n: string) => string) | null }> = {
  dhl: { label: "DHL", url: (n) => `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${encodeURIComponent(n)}` },
  deutsche_post: { label: "Deutsche Post", url: (n) => `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${encodeURIComponent(n)}` },
  hermes: { label: "Hermes", url: (n) => `https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation/#${encodeURIComponent(n)}` },
  dpd: { label: "DPD", url: (n) => `https://tracking.dpd.de/status/de_DE/parcel/${encodeURIComponent(n)}` },
  gls: { label: "GLS", url: (n) => `https://gls-group.com/DE/de/paketverfolgung?match=${encodeURIComponent(n)}` },
  ups: { label: "UPS", url: (n) => `https://www.ups.com/track?loc=de_DE&tracknum=${encodeURIComponent(n)}` },
  other: { label: "Versanddienst", url: null },
};

export function carrierInfo(carrier: string | null, trackingNumber: string | null): { label: string; url: string | null } {
  const c = TRACKING[carrier ?? ""] ?? TRACKING.other;
  const n = trackingNumber?.trim() ?? "";
  return { label: c.label, url: c.url && n ? c.url(n) : null };
}

/** Lieferadresse aus transactions.shipping_address (jsonb) als Zeilen; Land nur, wenn nicht DE. */
export function addressLinesFrom(name: string | null, address: unknown): string[] {
  const a = (address && typeof address === "object" && !Array.isArray(address) ? address : {}) as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const cityLine = [s(a.postal_code), s(a.city)].filter(Boolean).join(" ");
  const country = s(a.country);
  return [name?.trim() ?? "", s(a.line1), s(a.line2), cityLine, country && country !== "DE" ? country : ""].filter(Boolean);
}

interface Parts {
  subject: string;
  eyebrow: string;
  headline: string;
  /** Absätze als reiner Text (werden maskiert) */
  paragraphs: string[];
  /** Kasten mit Zeilen, z. B. Lieferadresse oder Sendungsnummer */
  box?: { label: string; lines: string[] };
  button: { label: string; url: string };
  note: string;
}

function layout(p: Parts): RenderedEmail {
  const para = (t: string) =>
    `<p style="margin:0 0 18px;font-family:${TEXT};font-size:17px;line-height:1.45;color:${NERO};">${escapeHtml(t)}</p>`;
  const box = p.box
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;border:1px solid ${NERO};background:${AVORIO};"><tr><td style="padding:14px 18px;">` +
      `<p style="margin:0 0 6px;font-family:${TEXT};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${ROSSO};">${escapeHtml(p.box.label)}</p>` +
      p.box.lines.map((l) => `<p style="margin:0;font-family:${TEXT};font-size:17px;line-height:1.45;color:${NERO};">${escapeHtml(l)}</p>`).join("") +
      `</td></tr></table>`
    : "";
  const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(p.subject)}</title></head>
<body style="margin:0;padding:0;background:${AVORIO};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${AVORIO};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${CARTA};border:2px solid ${NERO};">
<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="33%" height="6" style="background:${VERDE};font-size:0;line-height:0;">&nbsp;</td>
<td width="34%" height="6" style="background:${AVORIO};font-size:0;line-height:0;">&nbsp;</td>
<td width="33%" height="6" style="background:${ROSSO};font-size:0;line-height:0;">&nbsp;</td>
</tr></table></td></tr>
<tr><td style="padding:20px 32px 16px;border-bottom:1px solid ${NERO};"><a href="https://calcioclassics.de" style="text-decoration:none;"><img src="${LOGO_URL}" width="234" height="40" alt="Calcio Classics" style="display:block;border:0;width:234px;height:40px;font-family:${DISPLAY};font-size:18px;font-weight:bold;text-transform:uppercase;color:${NERO};"></a></td></tr>
<tr><td style="padding:36px 32px 8px;">
<p style="margin:0 0 14px;font-family:${TEXT};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${ROSSO};">${escapeHtml(p.eyebrow)}</p>
<h1 style="margin:0 0 20px;font-family:${DISPLAY};font-size:38px;line-height:1;font-weight:bold;letter-spacing:-1px;text-transform:uppercase;color:${NERO};">${escapeHtml(p.headline)}</h1>
${p.paragraphs.map(para).join("\n")}
${box}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;"><tr><td style="background:${VERDE};border:1px solid ${VERDE};">
<a href="${escapeHtml(p.button.url)}" style="display:inline-block;padding:16px 26px;font-family:${TEXT};font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${AVORIO};text-decoration:none;">${escapeHtml(p.button.label)} →</a>
</td></tr></table>
<p style="margin:0 0 32px;padding-top:18px;border-top:1px solid ${NERO};font-family:${TEXT};font-size:13px;line-height:1.45;color:${MUTED};">${escapeHtml(p.note)}</p>
</td></tr>
<tr><td style="padding:18px 32px;background:${VERDE};font-family:${TEXT};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${AVORIO};">Calcio Classics · <a href="https://calcioclassics.de" style="color:${AVORIO};text-decoration:underline;">calcioclassics.de</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    p.headline,
    "",
    ...p.paragraphs,
    ...(p.box ? ["", `${p.box.label}:`, ...p.box.lines] : []),
    "",
    `${p.button.label}: ${p.button.url}`,
    "",
    p.note,
    "",
    "Calcio Classics · calcioclassics.de",
  ].join("\n");

  return { subject: p.subject, html, text };
}

const NOTE = `Fragen oder ein Problem mit der Bestellung? Antworte einfach auf diese Mail oder schreib an ${CONTACT}.`;

export function renderOrderEmail(event: OrderEmailEvent, d: OrderEmailData): RenderedEmail {
  const jersey = [d.jerseyTitle, d.jerseyName].filter(Boolean).join(" – ");
  const sizePart = d.size ? ` (Größe ${d.size})` : "";
  const price = formatEuro(d.amountCents);
  const orders = (tab: "bought" | "sold") => `${d.siteUrl.replace(/\/+$/, "")}/orders?tab=${tab}`;

  switch (event) {
    case "paid_buyer":
      return layout({
        subject: `Dein Kauf: ${d.jerseyTitle}`,
        eyebrow: "Acquisto · Kauf",
        headline: "Danke für deinen Kauf.",
        paragraphs: [
          `Du hast ${jersey}${sizePart} für ${price} gekauft. ${d.sellerName} verschickt das Trikot an diese Adresse:`,
        ],
        box: d.addressLines.length ? { label: "Lieferadresse", lines: d.addressLines } : undefined,
        button: { label: "Zu deinen Käufen", url: orders("bought") },
        note: `Sobald das Trikot unterwegs ist, bekommst du die Sendungsnummer per Mail. ${NOTE}`,
      });
    case "paid_seller":
      return layout({
        subject: `Verkauft: ${d.jerseyTitle} – bitte versenden`,
        eyebrow: "Venduto · Verkauft",
        headline: "Verkauft!",
        paragraphs: [
          `${d.buyerName} hat ${jersey}${sizePart} für ${price} gekauft.`,
          d.addressLines.length
            ? "Bitte verschicke das Trikot gut verpackt und mit Sendungsnummer an:"
            : "Für diesen Kauf liegt uns keine Lieferadresse vor. Bitte melde dich bei uns, bevor du etwas verschickst.",
        ],
        box: d.addressLines.length ? { label: "Lieferadresse", lines: d.addressLines } : undefined,
        button: { label: "Versand eintragen", url: orders("sold") },
        note: `Trag die Sendungsnummer danach unter „Käufe & Verkäufe“ ein — sie schützt dich bei Streitfällen. ${NOTE}`,
      });
    case "shipped_buyer":
      return layout({
        subject: `Dein Trikot ist unterwegs: ${d.jerseyTitle}`,
        eyebrow: "In viaggio · Unterwegs",
        headline: "Unterwegs.",
        paragraphs: [`${d.sellerName} hat ${jersey} mit ${d.carrierLabel} verschickt.`],
        box: { label: "Sendungsnummer", lines: [`${d.carrierLabel}: ${d.trackingNumber}`] },
        button: d.trackingUrl ? { label: "Sendung verfolgen", url: d.trackingUrl } : { label: "Zu deinen Käufen", url: orders("bought") },
        note: `Ist das Trikot angekommen und so wie beschrieben? Dann bestätige bitte den Erhalt unter „Käufe & Verkäufe“. ${NOTE}`,
      });
    case "received_seller":
      return layout({
        subject: `Angekommen: ${d.jerseyTitle}`,
        eyebrow: "Consegnato · Angekommen",
        headline: "Angekommen.",
        paragraphs: [`${d.buyerName} hat den Erhalt von ${jersey} bestätigt. Der Verkauf ist abgeschlossen — danke!`],
        button: { label: "Zu deinen Verkäufen", url: orders("sold") },
        note: NOTE,
      });
  }
}
