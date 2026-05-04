-- User favorites table for watchlist functionality
CREATE TABLE public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jersey_id uuid NOT NULL REFERENCES public.user_jerseys(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, jersey_id)
);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- User favorites policies
CREATE POLICY "Users can view own favorites"
  ON public.user_favorites FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can add favorites"
  ON public.user_favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove their favorites"
  ON public.user_favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_jersey_id ON public.user_favorites(jersey_id);
