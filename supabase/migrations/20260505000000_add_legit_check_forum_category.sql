-- Add 'Legit-Check' forum category.
-- Uses ON CONFLICT (name) DO NOTHING so this migration is idempotent.
INSERT INTO public.forum_categories (name, description, icon, sort_order)
VALUES
  ('Legit-Check', 'Echtheit prüfen lassen und Fälschungen erkennen', 'ShieldCheck', 6)
ON CONFLICT (name) DO NOTHING;
