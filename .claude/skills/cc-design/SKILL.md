---
name: cc-design
description: Calcio Classics design system (formerly VintageLeague). Load before ANY UI work in vintage-league-V2 or on Calcio Classics design files — new features, pages, components, restyles, admin/CMS screens, emails, images, copy. Defines tokens, typography, the hollow-type technique, the Figurina jersey card, section patterns, black stripes, circle geometry, imagery and brand rules, plus a pre-PR checklist.
---

# Calcio Classics — Design-Skill

Source of truth for the look: the approved homepage **Runde 4 „Il tuo album“** (26.09.2026).
Design sources: `_design/calcio-classics/Main.dc.html` (desktop 1440) and `Mobile.dc.html` (390) in the
planning folder `~/_AI/ClaudeCode/VintageLeage`; 1:1 previews `Vorschau_R4_*.html` next to them.
Tokens ready to paste: `reference/tokens.css` (this skill folder).

**Character in one line:** a German collector's album with Italian rhythm — ivory paper, black rules,
one strong green, a yellow circle, film grain. Magazine, not tech startup.

---

## 1. Brand rules (hard, no exceptions)

1. **Never highlight, isolate or style an „ss“** (e.g. in „Classics“) — German history. No colour, no weight change, no split. Whole-word treatments (a whole word hollow) are fine.
2. **No real club crests, sponsor logos or sportswear marks** (swoosh, three stripes) in *our* imagery, illustrations or generated pictures. Check every generated image. (User-uploaded jerseys and the TheSportsDB favourite-club badge are content/functionality, not brand imagery.)
3. **Italy is a feeling, not a costume:** Italian only in small caps eyebrows/labels („Figurine · Nuovi arrivi“, „Lo scambio“, „Verificato“). Headlines, buttons, forms, errors, legal text: **German**. No Vespa, kiosk, pizza, flags as decoration.
4. **The jersey is the hero.** Product photos on light (white/beige) backgrounds, large; price is present but restrained.
5. **Light platform with rhythm.** Ivory is the page, but **no page is all ivory**: every page mixes avorio with at least one nero or verde band (page header or stripe) — see §5.1. Never a dark theme either.
6. Prices, counts, dates in mockups are sample values — never invent facts in production copy.

## 2. Colour

| Token | Hex | Use |
|---|---|---|
| `avorio` | #F1EBDD | page background (≈70 % of every screen) |
| `carta` | #F7F2E6 | cards, inputs, popovers |
| `sabbia` | #E6DDC9 | quiet fills, skeletons, secondary buttons |
| `nero` | #111111 | text, 1–2 px rules, black stripes |
| `verde` | #1F6B43 | primary: hero block, primary buttons, footer, success, „Verificato“ |
| `giallo` | #E3A72B | circle geometry, warnings, mid price zone. **Never text on giallo in avorio; use nero text.** |
| `rosso` | #D0281E | signal only: eyebrows, „Tausch möglich“ tag, errors, top price zone. Small areas. |
| `azzurro` | #3B6F95 | info, card frame accent |

Proportion: lots of avorio + nero, verde as the one big colour, giallo/rosso as accents.
Status mapping: success=verde, warning=giallo, danger=rosso, info=azzurro. **No Tailwind palette
classes** (`green-500`, `amber-50`, `slate-200` …) and no `rgb()`/hex literals in components — only tokens.
Card frame colours rotate verde → azzurro → giallo → rosso (by index or league), purely decorative.

## 3. Typography (self-hosted via `@fontsource/*` — never the Google Fonts CDN, GDPR)

| Role | Font | Spec |
|---|---|---|
| Display | **Jost** 700 | UPPERCASE, `letter-spacing: -0.055em`, `line-height: .84–.9`. Sizes desktop 136 (hero) / 80 (section) / 68 (section) / 52 / 22–26 (card titles in stripes, -0.03em); mobile 62 / 40 / 36 / 30 / 14 |
| Text | **Archivo Narrow** 400/500 | 16–20 px, `line-height 1.38–1.45`; secondary text `muted-foreground` |
| Caps / labels | Archivo Narrow 500 | 11–12 px, `letter-spacing .14em`, UPPERCASE (mobile min **10 px**) |
| Numbers / prices | **Barlow Condensed** 600 | prices 24 px on cards (20 mobile), stats 38 px, big numbers only in stripes |
| Sub-titles in lists | Jost 600 | 17–21 px, `-0.02em`, sentence case |

Jost is the free stand-in for ITC Avant Garde, Barlow Condensed for DIN Condensed — production uses the free fonts.

### Hollow type (outline) — the connecting motif
Default: **the last word of a display headline is hollow** („Neu im *Album.*“, „Häufig gestellte *Fragen.*“, hero „*maglie.*“). Guido 28.09.: normal and hollow words **may be mixed freely** (several hollow words, also mid-headline) — editors decide per headline in the CMS. Storage format everywhere: one string, `*word*` = hollow, newline = line break (e.g. `Il tuo\nalbum di *maglie.*`). Hollow numerals (01–04) allowed in stripes.

Build it ONLY like this (plain `color: transparent; -webkit-text-stroke` breaks: Jost has overlapping contours inside A, B, R, K, 4 and tight tracking makes letters cross):

```css
.hollow      { color: var(--fill, hsl(var(--nero))); -webkit-text-stroke: 4px hsl(var(--avorio)); paint-order: stroke fill; letter-spacing: -0.01em; }
.hollow-dark { color: hsl(var(--avorio));            -webkit-text-stroke: 4px hsl(var(--nero));   paint-order: stroke fill; letter-spacing: -0.01em; }
```
Stroke = 2× the visible line (4 px desktop ≈ 2 px visible, 2.4 px mobile). The fill must equal the background
behind the word: on verde set `style="--fill: hsl(var(--verde))"`. Don't use hollow text over photos.

## 4. Layout & rhythm

- Desktop artboard 1440, side gutter **40 px**, grid gutter 24 px; content max 1360. Mobile gutter **16 px**.
- Section spacing: **104–112 px** desktop, **56 px** mobile. Sections are separated by space or by full-width rules, never by shadows.
- **Square corners everywhere** (`--radius: 0`). Exceptions: avatars, the circle geometry, round stamps.
- Lines: 1 px nero for rules/inputs/tags, 2 px nero for cards and framed images.
- No shadows, no glow, no gradients (except the price spectrum), no hover lift. Hover = underline, colour inversion (outline → filled) or image zoom ≤ 1.03.

## 5. Signature elements

- **Tricolore hairline:** 6 px (5 mobile) bar verde | avorio (with 1 px nero top/bottom) | rosso — on top of the page and directly above the footer. Nowhere else.
- **Verde hero block** with the **giallo circle** cut by the block edge and an outline circle (2 px avorio, 55 % opacity). When the block sits next to a photo, the giallo circle continues over the photo at **30 % opacity** with the identical centre and radius.
- **Nero stripes:** full-width black bands for *at most two* content modules per page (e.g. trust points, swap feature). Inside: avorio text, hollow numerals, 1 px avorio rules at 35 % opacity. The footer is **verde** (with the giallo circle), not black — it bookends the hero.
- **Shirt silhouette mask** (`clip-path: polygon(30% 0, 41.7% 0, 50% 10%, 58.3% 0, 70% 0, 100% 12.9%, 93.3% 32.9%, 78.3% 28.6%, 78.3% 100%, 21.7% 100%, 21.7% 28.6%, 6.7% 32.9%, 0 12.9%)`) for editorial features in stripes (swap module). Never for product grids.
- **Film grain:** SVG `feTurbulence` overlay via `.grain::after` on photos only; `mix-blend-mode: multiply` + opacity .42 on light, `overlay` + .5 on dark.
- **Round stamp** (104 px avorio disc, rotated −9°, caps text) for status on hero imagery („Verificato · Grado 4/5“).
- **Logo:** 03 CC-Ball monogram (two open C forming a ball, rosso dot) + wordmark „Calcio Classics“ in Jost 700 caps. On dark/verde grounds, the monogram gaps take the ground colour.

### 5.1 Page composition — hell/dunkel-Rhythmus (Guido, 26.09.)
Every page alternates light and dark like the homepage. Budget per page: **one coloured page header** (nero or verde) **+ up to two nero stripes**, footer always verde. Defaults:

| Page | Header band | Stripes / dark modules |
|---|---|---|
| Startseite | verde hero block | Vertrauen (nero), Scambio (nero) |
| Marktplatz `/shop` | **nero** page header (eyebrow, headline with hollow last word, sub, search) | Authentizitätsgarantie (nero trust stripe) after the first rows of the grid or before the footer |
| Trikot-Detail | none (product on avorio) | „Echtheit & Prüfung“ nero stripe (verification status + trust points) below the fold |
| Community | nero page header | — (posts on avorio) |
| Tausch / Trades | nero header with shirt masks | — |
| Sammlung, Profil, Onboarding | verde header band (personal space) | — |
| Login / Registrierung | verde split (form on avorio) | — |
| Admin | nero top bar | — |
| Rechtliches, 404 | avorio only + verde footer is enough | — |

Use the shared components `PageHeader` (`tone="avorio|nero|verde"`) and `NeroStripe` — don't hand-build bands per page. Hollow words on nero use `.hollow` (fill nero), on verde `.hollow` with `--fill` verde, on avorio `.hollow-dark`.

## 6. Components

**Section header:** eyebrow (caps, rosso, Italian · German) → display headline with hollow last word → optional sub-line (18 px, muted) → right-aligned caps link „Alle anzeigen →“ with 1 px underline.

**Buttons** (caps 12 px, `.14em`, padding 17×26, 1 px border, square):
`primary` verde fill · `dark` nero fill · `light` avorio fill (on verde/nero) · `outline` transparent + currentColor border · `link` caps with underline. Arrow „→“ in label for forward actions, „⇄“ for swap. Disabled = 40 % opacity. No translate/scale effects.

**Tags** (status on cards/detail): 10 px caps, padding 4×7, 1 px border currentColor, square. `Tausch möglich`/`Nur Tausch` rosso; `Sofort kaufen`, `Gebot möglich`, size neutral nero; `Verkauft` nero fill.

**Chips** (filters): 12 px caps, padding 9×14, 1 px nero; active = nero fill avorio text. Horizontal scroll on mobile, never wrap to 3+ lines.

**Inputs / selects / textareas:** carta fill, 1 px nero border, 16–17 px text, focus ring 2 px verde (offset 0). Labels as caps above. Errors: rosso text + rosso border, German message.

**Dialogs / sheets / popovers:** square, carta, 2 px nero border, overlay nero 60 %. Titles in Jost 600 sentence case or display caps for big moments.

**Accordion (FAQ):** 1 px nero rules between rows, question Jost 600 21 px, „+ / −“ on the right.

**Toasts:** square, nero fill avorio text; error variant rosso fill.

### Figurina — the jersey card (keep ALL functionality)
The card is a sticker-album page: carta background, 2 px nero border, 12 px padding, rows top→bottom:

1. **Head row** (caps 11 px): left `N°`/league·year; right verification — `● Verificato` (verde) / `In Prüfung` (muted) / nothing. **Favourite heart** as a 32 px square carta button top-right *over the image* (keeps `useFavorites`, stops propagation).
2. **Image** 4:5, 6 px coloured frame, `object-fit: cover`, grain. Overlays: size tag (bottom-left), age tier tag „Klassiker/Retro/Vintage“ (bottom-left, next to size). Placeholder without image: team initial in Jost on sabbia.
3. **Title** Jost 600 17 px = team; sub-line Archivo 14 px = jersey name.
4. **Meta** caps, 2 fixed lines: `Liga · Saison` / `Größe · Zustand-Label` (use `CONDITION_LABELS`).
5. **Tags row:** Tausch möglich / Nur Tausch / Sofort kaufen / Gebot möglich / Verkauft / Smart Buy (verde fill) — only those that apply.
6. **Price row** (1 px nero top rule, pinned to bottom with `margin-top: auto`): price Barlow 24 px (label „Verkaufspreis“ as caps above when useful) + **compact verdict** right: mini spectrum (54×4 px: verde | giallo | rosso zones, 2×12 px nero marker) + verdict word.
7. **Price intelligence detail** (only when the guard says reliable): expandable line „Marktwert €X–€Y · N Vergleiche“ + full-width spectrum (square bar, fair zone outlined in nero, marker with price). Unreliable → quiet caps note „Zu wenige Vergleichsdaten“. Never show a fair value the guard rejected.
8. **Bid/ask line** when data exists: „Niedrigstes Angebot / Höchstes Gebot“ in caps + Barlow.
9. **Action:** „Sofort kaufen — € X“ full-width `dark` button, only for non-owners on buy-now listings.

Verdict colours: Schnäppchen = verde, Fairer Preis = verde (outline), Über Marktwert = giallo, Premium-Preis = rosso. Grid: 4 columns desktop, 2 tablet/mobile, gap 24/10.

## 7. Imagery

- Film look: 35 mm / medium-format, fine grain, warm skin tones, flash or soft box; products sharp on ivory/white wall or wooden hanger.
- World: stadium, real people/fans (DE+IT), swap meets, hands checking seams/labels, framed jerseys at home.
- Generated images (Higgsfield `soul_2`): always prompt „no manufacturer logo, no swoosh, no stripes on shoulders, no crest, no sponsor“ and inspect every result; the word „football jersey“ attracts three stripes — „cotton shirt / polo shirt“ helps.
- Upload rules unchanged: images only in Supabase Storage (CMS media bucket for editorial images), compress to ≤ 200 KB, always alt text.

## 8. Copy voice

Short, confident, collector-to-collector. Du-Form. Verbs on buttons („Kollektion entdecken“, „Trikot verkaufen“, „Tauschbörse entdecken“). Headlines end with a full stop. Italian only for eyebrows/labels (see §1.3). Vocabulary: Trikot, Sammlung, Tausch, Prüfung/Verificato, Marktwert, Zustand (Grado), Größe (Taglia) — keep existing labels from `src/data/*` consistent.

## 9. Implementation notes (vintage-league-V2)

- Tokens live in `src/index.css` `:root` (see `reference/tokens.css`); Tailwind colours `verde, giallo, rosso, azzurro, avorio, carta, sabbia, nero, success, warning, danger, info` map to `hsl(var(--x))`.
- Utilities: `.display`, `.cap`, `.num`, `.hollow`, `.hollow-dark`, `.grain` (+ `.grain-photo`, `.grain-dark`), `.tricolore`, `.shirt-mask`, `.nero-stripe`, `.prose-cc` (with `prose`, for Tiptap editor + viewer and legal texts). Removed in R8 (do not reintroduce): `.text-gradient`, `.card-hover`, `.glow`, `.vintage-*`, `font-serif`, `gold`/`vintage-red` colours, Button variants `hero`/`bid`, `.shimmer-loader` (Skeleton = `animate-pulse bg-sabbia`).
- Base styles set h1–h6 to display caps. User-written titles (posts, dialog titles, prose headings) need `normal-case`.
- Reuse shared components: `Logo` (CC monogram), `PageHeader` (`aside` slot for decoration, e.g. `TradeShirts`), `SectionHeader`, `LegalPage` (legal texts), `NeroStripe`, `TrustStripe`, `CircleGeometry`, `Figurina` (JerseyCard, optional `footer` for an extra action), `PriceSpectrum`, `DeleteJerseyDialog`. Don't restyle per page.
- Community tiles: first post image + a small circle accent on a corner (giallo / rosso / outline ring, stable per post id) — the circle geometry in miniature.
- Destructive actions always ask first (AlertDialog, rosso action). Jerseys are soft-deleted via RPC `soft_delete_user_jersey`.
- CMS-editable text/images come from `useSiteContent()` with code defaults — never hard-code homepage copy again.

## 10. Checklist before every PR with UI changes

- [ ] Only tokens, no palette classes / hex / rgb in TSX; no rounded corners (except §4 exceptions); no shadows/glow.
- [ ] Page has its light/dark rhythm per §5.1 (coloured header and/or nero stripe), not all ivory.
- [ ] Headlines: display caps, hollow last word built with `paint-order`, German; eyebrow Italian·German caps.
- [ ] No highlighted „ss“; no brand marks/crests in new imagery.
- [ ] Desktop 1440 and mobile 390 checked on the Vercel preview; caps ≥ 10 px on mobile; tap targets ≥ 44 px.
- [ ] All pre-existing functionality still reachable (compare with the page's feature list in the plan's regression inventory).
- [ ] Contrast: body text ≥ 4.5:1; no avorio text on giallo.
- [ ] `npm run build` green.
