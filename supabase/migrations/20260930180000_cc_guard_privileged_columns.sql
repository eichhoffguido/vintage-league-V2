-- CC-SECURITY — Nutzer konnten sich selbst zum Admin machen (28.09.2026).
--
-- Befund: Die Policy „Users can update own profile“ (USING id = auth.uid()) erlaubt jedem angemeldeten Nutzer, seine
-- eigene Profilzeile zu ändern — ohne Spalten-Einschränkung, also auch profiles.is_admin. Ein Aufruf
--   supabase.from("profiles").update({ is_admin: true }).eq("id", <eigene id>)
-- machte jeden zum Admin (CMS, alle Bestellungen mit Lieferadressen, Prüfung, „Erhalten“ setzen). Nachgewiesen per
-- Probelauf mit Rollback. Gleiches Muster bei user_jerseys.is_featured (Startseite).
--
-- Fix nach dem Muster von check_verification_update(): Trigger lehnen Änderungen an privilegierten Spalten ab, wenn sie
-- nicht von einem Admin, einer Edge Function (service_role) oder direkt in der Datenbank (SQL-Editor, SECURITY-DEFINER-
-- Funktionen ohne JWT) kommen. Die App ändert diese Spalten nie selbst (außer Admin → is_featured).
-- Kein Deploy nötig, sofort wirksam.

BEGIN;

-- 1 · profiles: is_admin, average_rating, deleted_at ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() OR COALESCE(auth.role(), 'none') IN ('service_role', 'none') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.is_admin, false) OR NEW.average_rating IS NOT NULL OR NEW.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Diese Profilfelder dürfen nur Admins setzen (is_admin, average_rating, deleted_at).'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.average_rating IS DISTINCT FROM OLD.average_rating
     OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    RAISE EXCEPTION 'Diese Profilfelder dürfen nur Admins ändern (is_admin, average_rating, deleted_at).'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_privileged_columns ON public.profiles;
CREATE TRIGGER guard_profile_privileged_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();

-- 2 · user_jerseys: is_featured (Startseite „Neu im Album“ / Hervorhebung) --------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_jersey_featured()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() OR COALESCE(auth.role(), 'none') IN ('service_role', 'none') THEN
    RETURN NEW;
  END IF;
  IF (TG_OP = 'INSERT' AND COALESCE(NEW.is_featured, false))
     OR (TG_OP = 'UPDATE' AND NEW.is_featured IS DISTINCT FROM OLD.is_featured) THEN
    RAISE EXCEPTION 'Nur Admins dürfen Trikots hervorheben (is_featured).' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_jersey_featured ON public.user_jerseys;
CREATE TRIGGER guard_jersey_featured
  BEFORE INSERT OR UPDATE ON public.user_jerseys
  FOR EACH ROW EXECUTE FUNCTION public.guard_jersey_featured();

COMMIT;

-- Prüfen:
--   SELECT tgname FROM pg_trigger WHERE tgname IN ('guard_profile_privileged_columns', 'guard_jersey_featured');  → 2 Zeilen
--
-- Hannes (oder andere) zum Admin machen — nur hier im SQL-Editor möglich, nicht über die App:
--   UPDATE public.profiles SET is_admin = true
--    WHERE id = (SELECT id FROM auth.users WHERE email = '<E-Mail von Hannes>');
