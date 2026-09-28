-- CC-FIX — Neue Konten bekommen wieder ein Profil (28.09.2026).
--
-- Befund: Die in Produktion laufende handle_new_user() (nicht aus dem Repo, direkt ausgeführt) schrieb in eine
-- Spalte profiles.username, die es nicht gibt. Der Fehler wurde vom EXCEPTION-Block still geschluckt → jedes
-- neue Konto (Google und E-Mail) entstand OHNE Profil. Betroffen: 2 von 9 Konten (Stand 28.09.).
--
-- Fix: Version aus 20260505140000 (display_name, Google-Namen, E-Mail-Fallback) wieder einsetzen; Fehler werden
-- künftig als WARNING ins Postgres-Log geschrieben statt verschluckt. Fehlende Profile werden nachgelegt.
-- Kein Edge-Function-Deploy nötig.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    -- Google → full_name / name · E-Mail-Registrierung → display_name · sonst der Teil vor dem @
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'),    ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'),         ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1),  '')
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Anmeldung nie blockieren — aber sichtbar machen (Supabase → Logs → Postgres).
  RAISE WARNING 'handle_new_user: Profil für % nicht angelegt: % (%)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fehlende Profile nachlegen (onboarding_completed = false → Onboarding beim nächsten Login)
INSERT INTO public.profiles (id, display_name, avatar_url)
SELECT
  u.id,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'full_name'),    ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'name'),         ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'display_name'), ''),
    NULLIF(split_part(COALESCE(u.email, ''), '@', 1),  '')
  ),
  u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Prüfen (sollte 0 liefern):
--   SELECT count(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
