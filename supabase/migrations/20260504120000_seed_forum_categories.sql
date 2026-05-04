-- Seed default forum categories.
-- First add a unique constraint on name so we can use ON CONFLICT DO NOTHING.
-- This is a non-destructive change — name is already logically unique.
ALTER TABLE public.forum_categories
  ADD CONSTRAINT forum_categories_name_unique UNIQUE (name);

-- Insert the 5 default categories; skip silently if they already exist.
INSERT INTO public.forum_categories (name, description, icon, sort_order)
VALUES
  ('Restaurierung',    'Tipps und Anleitungen zur Restaurierung von Vintage Trikots', 'Wrench',     1),
  ('Pflege & Lagerung','Wie man Sammlerstücke richtig pflegt und lagert',             'Shield',     2),
  ('Echtheitsprüfung', 'Wie erkennt man Originale und Fälschungen?',                 'Search',     3),
  ('Marktplatz-Talk',  'Diskussionen über Preise, Trends und den Markt',             'TrendingUp', 4),
  ('Showroom',         'Zeigt eure besten Stücke und Sammlungen',                    'Trophy',     5)
ON CONFLICT (name) DO NOTHING;
