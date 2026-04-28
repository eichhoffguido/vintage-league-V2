-- Create categories for forum topics
CREATE TABLE public.forum_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories"
ON public.forum_categories FOR SELECT
USING (true);

-- Create forum posts
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE NULL
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view posts"
ON public.forum_posts FOR SELECT USING (true);

CREATE POLICY "Users can create own posts"
ON public.forum_posts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posts"
ON public.forum_posts FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own posts"
ON public.forum_posts FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create forum comments
CREATE TABLE public.forum_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE NULL
);

ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view comments"
ON public.forum_comments FOR SELECT USING (true);

CREATE POLICY "Users can create own comments"
ON public.forum_comments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
ON public.forum_comments FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON public.forum_comments FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE TRIGGER update_forum_comments_updated_at
BEFORE UPDATE ON public.forum_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default categories
INSERT INTO public.forum_categories (name, description, icon, sort_order) VALUES
('Restaurierung', 'Tipps und Anleitungen zur Restaurierung von Vintage Trikots', 'Wrench', 1),
('Pflege & Lagerung', 'Wie man Sammlerstücke richtig pflegt und lagert', 'Shield', 2),
('Echtheitsprüfung', 'Wie erkennt man Originale und Fälschungen?', 'Search', 3),
('Marktplatz-Talk', 'Diskussionen über Preise, Trends und den Markt', 'TrendingUp', 4),
('Showroom', 'Zeigt eure besten Stücke und Sammlungen', 'Trophy', 5);
