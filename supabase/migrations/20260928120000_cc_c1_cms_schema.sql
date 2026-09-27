-- CC-C1 — CMS schema (Guido executes in the Supabase SQL editor; Claude Code does not run it)
--
-- What the CMS stores
--   site_content  one row per editable text/image/link (key like 'home.album.headline'), value as JSON.
--                 NOT seeded for page copy: an empty key means "use the default from the code"
--                 (src/content/*). The CMS shows the default as current value; saving creates the row.
--                 So a page can never become empty, and there is no double maintenance.
--   hero_slides   homepage hero slides (label, subline, image, caption, stamp) — seeded with today's 3.
--   faq_items     FAQ — seeded with today's 8.
--   legal.*       imprint (structured fields, empty until Guido fills them) + privacy (HTML, today's text).
--   site-media    public storage bucket for editorial images, writable only by admins.
--
-- Headlines: one text, words between *asterisks* are set in OUTLINE type (Guido 28.09.: normal and
--   outline may be mixed freely). Example: 'Neu im *Album.*' or 'Il tuo album di *maglie.*'.
--   A line break in the text is a line break in the headline. The CMS hides the asterisks (word toggles).
--
-- Also: homepage_stats() — public numbers for the homepage hero (guests may not read trade_requests).
--
-- Project convention: no default privileges → explicit GRANTs. Writes only via public.is_admin().

-- ---------------------------------------------------------------------------
-- 1. site_content
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_content (
  key         text PRIMARY KEY CHECK (key ~ '^[a-z0-9_]+(\.[a-z0-9_]+)+$'),
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.site_content IS
  'CC CMS: editable page content. Missing key = code default. Headlines: *word* = outline type.';

CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 2. hero_slides
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort        integer NOT NULL DEFAULT 0,
  label       text NOT NULL DEFAULT '',          -- small caps word under the headline, e.g. 'Maglie'
  subline     text NOT NULL DEFAULT '',
  image_path  text,                              -- path in bucket site-media, e.g. 'defaults/hero-maglia.webp'
  image_alt   text NOT NULL DEFAULT '',          -- required in the CMS form
  caption     text NOT NULL DEFAULT '',          -- e.g. 'Maglia N° 001 · Anni ''70'
  stamp       text[] NOT NULL DEFAULT '{}',      -- round stamp lines, e.g. {Verificato, 'Grado 4/5'}
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE TRIGGER hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 3. faq_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faq_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort        integer NOT NULL DEFAULT 0,
  question    text NOT NULL,
  answer      text NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE TRIGGER faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4. RLS — everyone reads (lists: only active, not deleted; admins see all), only admins write
-- ---------------------------------------------------------------------------
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone reads site content" ON public.site_content
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write site content" ON public.site_content
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Everyone reads active hero slides" ON public.hero_slides
  FOR SELECT TO anon, authenticated USING ((is_active AND deleted_at IS NULL) OR public.is_admin());
CREATE POLICY "Admins write hero slides" ON public.hero_slides
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Everyone reads active faq items" ON public.faq_items
  FOR SELECT TO anon, authenticated USING ((is_active AND deleted_at IS NULL) OR public.is_admin());
CREATE POLICY "Admins write faq items" ON public.faq_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.site_content, public.hero_slides, public.faq_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content, public.hero_slides, public.faq_items TO authenticated;
GRANT ALL ON public.site_content, public.hero_slides, public.faq_items TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Storage bucket site-media (public read, admin write)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('site-media', 'site-media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read site media" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-media');
CREATE POLICY "Admins upload site media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media' AND public.is_admin());
CREATE POLICY "Admins update site media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'site-media' AND public.is_admin());
CREATE POLICY "Admins delete site media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'site-media' AND public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. homepage_stats() — public numbers only (no rows), fixes the hidden "Trades" figure for guests
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.homepage_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'jerseys',   (SELECT count(*) FROM user_jerseys WHERE verification_status = 'verified' AND deleted_at IS NULL),
    'profiles',  (SELECT count(*) FROM profiles WHERE deleted_at IS NULL),
    'trades',    (SELECT count(*) FROM trade_requests WHERE status = 'completed'),
    'tradeable', (SELECT count(*) FROM user_jerseys WHERE listing_type IN ('both', 'trade_only') AND deleted_at IS NULL)
  );
$$;
COMMENT ON FUNCTION public.homepage_stats() IS 'CC-C1: public homepage figures (counts only).';
REVOKE ALL ON FUNCTION public.homepage_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.homepage_stats() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. Seeds (only if empty / missing — safe to re-run)
-- ---------------------------------------------------------------------------
INSERT INTO public.faq_items (sort, question, answer)
SELECT * FROM (VALUES
  (10, 'Was ist Calcio Classics?', 'Ein Marktplatz von Sammlern für Sammler: authentische Vintage-Fußballtrikots kaufen, verkaufen, tauschen — mit Community und Preistransparenz.'),
  (20, 'Wie funktioniert das Kaufen?', 'Trikot finden, „Sofort kaufen“ oder ein Gebot abgeben. Der Verkäufer nimmt an — bezahlt wird sicher über unseren Zahlungspartner.'),
  (30, 'Wie funktioniert das Tauschen?', 'Trikots mit „Tausch möglich“ kannst du gegen ein Trikot aus deiner Sammlung anfragen. Der Besitzer entscheidet.'),
  (40, 'Was bedeutet die Prüfung?', 'Eingestellte Trikots werden von uns geprüft; verifizierte Stücke tragen ein Badge. So bleibt der Marktplatz vertrauenswürdig.'),
  (50, 'Wie wird der Marktwert ermittelt?', 'Aus über 22.000 Referenzpreisen vergleichbarer Trikots. Die Skala dient der Einordnung — den Verkaufspreis bestimmst du selbst.'),
  (60, 'Was kostet die Nutzung?', 'Registrieren, sammeln und stöbern ist kostenlos. Beim Verkauf fällt eine Transaktionsgebühr über den Zahlungsanbieter an.'),
  (70, 'Wie verkaufe ich ein Trikot?', 'In deiner Sammlung anlegen, Fotos hochladen, „Zum Verkauf“ aktivieren, Preis setzen — fertig.'),
  (80, 'Wie sicher sind meine Daten?', 'Hosting in der EU, DSGVO-konform. Details in der Datenschutzerklärung.')
) AS v(sort, question, answer)
WHERE NOT EXISTS (SELECT 1 FROM public.faq_items);

-- Images: the 3 files are uploaded by Claude Code to site-media/defaults/ right after this migration.
INSERT INTO public.hero_slides (sort, label, subline, image_path, image_alt, caption, stamp)
SELECT * FROM (VALUES
  (10, 'Maglie',
   'Authentische Vintage-Trikots kaufen, verkaufen und tauschen. Jedes Stück geprüft, jeder Preis fair eingeordnet — wie ein Stickeralbum, nur mit echten Stücken.',
   'defaults/hero-maglia.webp', 'Gestreiftes Vintage-Trikot auf einem Holztisch', 'Maglia N° 001 · Anni ''70',
   ARRAY['Verificato', 'Grado 4/5', 'Taglia M']),
  (20, 'Cimeli',
   'Memorabilia aus den goldenen Ären des Fußballs — Aufnäher, Flock, Etiketten. Jedes Detail erzählt, woher ein Trikot kommt.',
   'defaults/detail-stitch.webp', 'Gestickter Aufnäher auf dunklem Trikotstoff', 'Cimeli · Stickerei & Flock',
   ARRAY['Verificato', 'Originale']),
  (30, 'Rarità',
   'Seltene Fundstücke mit Geschichte — kuratiert, geprüft und fair eingeordnet für echte Kenner.',
   'defaults/p-crest.webp', 'Weißes Trikot mit gesticktem Wappen und Stern', 'Rarità · Pezzo unico',
   ARRAY['Rarità', 'Pezzo unico'])
) AS v(sort, label, subline, image_path, image_alt, caption, stamp)
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides);

-- Imprint: empty until Guido fills it in the CMS (the page warns admins about missing required fields).
INSERT INTO public.site_content (key, value) VALUES
  ('legal.imprint', jsonb_build_object(
     'name', '', 'street', '', 'city', '', 'country', 'Deutschland',
     'email', 'kontakt@calcioclassics.de', 'phone', '', 'vat_id', '', 'register', '', 'responsible', ''))
ON CONFLICT (key) DO NOTHING;

-- Privacy: today's text 1:1 (as on /privacy, 28.09.2026). Content review with the legal entity (S4).
INSERT INTO public.site_content (key, value) VALUES
  ('legal.privacy', jsonb_build_object('html', $privacy$<h2>1. Verantwortlicher für die Datenverarbeitung</h2><p>Für alle Fragen zum Datenschutz, zur Ausübung Ihrer Rechte und für allgemeine Anfragen kontaktieren Sie bitte:</p><p><strong>Calcio Classics</strong><br>E-Mail: kontakt@calcioclassics.de</p><h2>2. Welche Daten wir erfassen</h2><p>Wir erfassen verschiedene Arten von persönlichen Daten, um unseren Dienst bereitzustellen:</p><ul><li><strong>Kontoeinformationen:</strong> E-Mail-Adresse, Benutzername, Passwort-Hash, Profilinformationen</li><li><strong>Authentifizierungsdaten:</strong> OAuth-Token, Session-IDs, Authentifizierungsprotokoll-Daten</li><li><strong>Jersey-Listings:</strong> Beschreibungen, Preise, Bilder, Standort-Informationen</li><li><strong>Transaktionsdaten:</strong> Verkaufs- und Kaufverlauf, Zahlungsinformationen</li><li><strong>Kommunikationsdaten:</strong> Nachrichten, Kommentare, Community-Beiträge</li><li><strong>Nutzungsdaten:</strong> IP-Adresse, Browser-Typ, besuchte Seiten, Verweildauer</li></ul><h2>3. Zu welchem Zweck wir Ihre Daten verarbeiten</h2><p>Wir verarbeiten Ihre Daten für folgende Zwecke:</p><ul><li>Kontoerstellung und -verwaltung</li><li>Bereitstellung der Calcio Classics-Plattform und deren Funktionalität</li><li>Verarbeitung von Transaktionen und Zahlungen</li><li>Kommunikation mit Ihnen (Support, Updates, wichtige Benachrichtigungen)</li><li>Verbesserung unserer Dienste und Benutzerfreundlichkeit</li><li>Sicherheit und Missbrauchsprävention</li><li>Einhaltung gesetzlicher Anforderungen und Verträge</li></ul><h2>4. Rechtsgrundlage für die Datenverarbeitung</h2><p>Die Verarbeitung Ihrer Daten basiert auf:</p><ul><li><strong>Vertragserfüllung:</strong> Verarbeitung zur Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 b DSGVO)</li><li><strong>Berechtigte Interessen:</strong> Zum Schutz vor Missbrauch und zur Verbesserung unserer Dienste (Art. 6 Abs. 1 f DSGVO)</li><li><strong>Gesetzliche Verpflichtungen:</strong> Zur Einhaltung von Gesetzen und Vorschriften (Art. 6 Abs. 1 c DSGVO)</li><li><strong>Ihre Einwilligung:</strong> Für Marketing und optionale Funktionen (Art. 6 Abs. 1 a DSGVO)</li></ul><h2>5. Mit wem wir Ihre Daten teilen</h2><p>Ihre Daten werden möglicherweise mit folgenden Parteien geteilt:</p><ul><li><strong>Supabase:</strong> Unser Backend-Datenbank-Anbieter. Supabase speichert Ihre Daten verschlüsselt auf Servern in der EU.</li><li><strong>Verified Seller/Käufer:</strong> Ihre öffentlichen Profilinformationen sind für andere Nutzer sichtbar</li><li><strong>Zahlungsanbieter:</strong> Zahlungsinformationen werden an Zahlungsabwickler übermittelt (Details im Checkout)</li><li><strong>Service-Provider:</strong> Technische Dienstleister zur Wartung und Sicherheit unserer Plattform</li><li><strong>Behörden:</strong> Falls gesetzlich erforderlich oder zur Durchsetzung unserer Nutzungsbedingungen</li></ul><h2>6. Wie lange wir Ihre Daten speichern</h2><p>Wir speichern Ihre persönlichen Daten nur so lange, wie notwendig:</p><ul><li><strong>Kontoaktiv:</strong> Solange Ihr Konto aktiv ist</li><li><strong>Nach Kontolöschung:</strong> Bis zu 30 Tage (Wiederherstellungszeitraum), dann endgültig gelöscht</li><li><strong>Transaktionsdaten:</strong> Mindestens 7 Jahre für steuerliche und buchhalterische Zwecke</li><li><strong>Sicherheitslogs:</strong> Bis zu 90 Tage für Sicherheits- und Missbrauchsprävention</li></ul><h2>7. Ihre Datenschutzrechte</h2><p>Unter der DSGVO haben Sie folgende Rechte:</p><ul><li><strong>Zugriff:</strong> Recht zu erfahren, welche Daten wir über Sie speichern</li><li><strong>Berichtigung:</strong> Recht zur Korrektur ungenauer Daten</li><li><strong>Löschung:</strong> Recht auf Löschung Ihrer Daten unter bestimmten Bedingungen ("Recht auf Vergessenwerden")</li><li><strong>Einschränkung:</strong> Recht, die Verarbeitung Ihrer Daten einzuschränken</li><li><strong>Datenportabilität:</strong> Recht, Ihre Daten in maschinenlesbarem Format zu erhalten</li><li><strong>Widerspruch:</strong> Recht, der Verarbeitung unter bestimmten Umständen zu widersprechen</li><li><strong>Beschwerde:</strong> Recht, eine Beschwerde bei der Datenschutzbehörde einzureichen</li></ul><p>Um diese Rechte auszuüben, kontaktieren Sie uns unter kontakt@calcioclassics.de</p><h2>8. Cookies und Tracking</h2><p>Wir verwenden Cookies und ähnliche Technologien, um unsere Dienste zu verbessern:</p><ul><li><strong>Notwendige Cookies:</strong> Zur Authentifizierung und Sicherheit</li><li><strong>Analyse-Cookies:</strong> Um zu verstehen, wie Sie unsere Plattform nutzen</li><li><strong>Funktionale Cookies:</strong> Zur Speicherung von Einstellungen</li></ul><p>Sie können Cookies in Ihren Browser-Einstellungen deaktivieren, dies kann jedoch die Funktionalität beeinträchtigen.</p><h2>9. Sicherheit</h2><p>Wir implementieren technische und organisatorische Sicherheitsmaßnahmen zum Schutz Ihrer persönlichen Daten, einschließlich Verschlüsselung in Transit und im Ruhezustand. Allerdings kann keine Sicherheit über das Internet völlig garantiert werden. Wir können die Sicherheit nicht vollständig garantieren.</p><h2>10. Links zu anderen Websites</h2><p>Unsere Plattform kann Links zu externen Websites enthalten. Wir sind nicht verantwortlich für die Datenschutzpraktiken anderer Websites. Bitte lesen Sie die Datenschutzerklärungen dieser Websites, bevor Sie persönliche Daten teilen.</p><h2>11. Änderungen dieser Datenschutzerklärung</h2><p>Wir können diese Datenschutzerklärung jederzeit aktualisieren. Bedeutende Änderungen werden Ihnen per E-Mail mitgeteilt. Ihre fortgesetzte Nutzung der Plattform nach solchen Änderungen bedeutet Ihre Zustimmung zu der aktualisierten Erklärung.</p><h2>12. Kontakt</h2><p>Wenn Sie Fragen zu dieser Datenschutzerklärung oder zu unseren Datenschutzpraktiken haben, kontaktieren Sie uns bitte:</p><p><strong>Datenschutz Kontakt:</strong><br>E-Mail: kontakt@calcioclassics.de</p>$privacy$))
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Rollback (manual):
-- DROP FUNCTION IF EXISTS public.homepage_stats();
-- DROP POLICY IF EXISTS "Public read site media" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins upload site media" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins update site media" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins delete site media" ON storage.objects;
-- (empty the bucket via Storage API / dashboard first) DELETE FROM storage.buckets WHERE id = 'site-media';
-- DROP TABLE IF EXISTS public.faq_items, public.hero_slides, public.site_content;
