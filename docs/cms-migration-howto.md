# CMS-Migration (CC-C1) ausführen

Datei: `supabase/migrations/20260928120000_cc_c1_cms_schema.sql`

## 1. Ausführen (Guido)

1. Supabase → Projekt `napzgxpxkoiujjqwtzvz` → **SQL Editor** → **New query**
2. Den kompletten Inhalt der Migrationsdatei einfügen → **Run**
3. Erwartet: „Success. No rows returned“

## 2. Prüfen (Guido oder Claude Code)

```sql
select
  (select count(*) from public.site_content)  as texte,        -- 2  (Impressum, Datenschutz)
  (select count(*) from public.hero_slides)   as hero_slides,  -- 3
  (select count(*) from public.faq_items)     as faq,          -- 8
  (select count(*) from storage.buckets where id = 'site-media') as bucket,  -- 1
  public.homepage_stats()                     as kennzahlen;   -- {"jerseys":…, "profiles":…, "trades":…, "tradeable":…}
```

## 3. Danach (Claude Code, mit Guidos Go)

Die 3 heutigen Hero-Bilder nach `site-media/defaults/` hochladen
(`hero-maglia.webp`, `detail-stitch.webp`, `p-crest.webp` aus `src/assets/home/`).
Solange sie fehlen, zeigt die Startseite ohnehin die Bilder aus dem Code (Rückfall in C2).

## Was die Migration anlegt

| Objekt | Zweck | Lesen | Schreiben |
|---|---|---|---|
| `site_content` | Texte/Bilder/Links je Seite, Schlüssel wie `home.album.headline` | alle | nur Admins |
| `hero_slides` | Startseiten-Slider | alle (nur aktive) | nur Admins |
| `faq_items` | FAQ | alle (nur aktive) | nur Admins |
| Bucket `site-media` | redaktionelle Bilder (max. 5 MB, JPG/PNG/WebP) | alle | nur Admins |
| `homepage_stats()` | Kennzahlen der Startseite, auch für Gäste | alle | – |

**Überschriften:** Wörter zwischen `*Sternchen*` erscheinen in Outline-Schrift, beliebig gemischt
(z. B. `Neu im *Album.*`). Im CMS sieht man die Sternchen nicht — dort klickt man Wörter an.

**Leere Texte:** Gibt es für einen Schlüssel noch keinen Eintrag, gilt der Standardtext aus dem Code.
Die Seite kann dadurch nie leer werden.

Rückgängig machen: siehe Kommentarblock „Rollback“ am Ende der Migrationsdatei.
