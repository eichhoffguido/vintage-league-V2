
-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User jerseys table
CREATE TABLE public.user_jerseys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  team text NOT NULL,
  league text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  condition smallint NOT NULL DEFAULT 3 CHECK (condition BETWEEN 1 AND 5),
  size text NOT NULL DEFAULT 'M',
  image_url text,
  price_estimate numeric,
  available_for_trade boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trade requests table
CREATE TYPE public.trade_status AS ENUM ('pending', 'accepted', 'declined', 'completed');

CREATE TABLE public.trade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_jersey_id uuid NOT NULL REFERENCES public.user_jerseys(id) ON DELETE CASCADE,
  owner_jersey_id uuid NOT NULL REFERENCES public.user_jerseys(id) ON DELETE CASCADE,
  status public.trade_status NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT different_jerseys CHECK (requester_jersey_id != owner_jersey_id)
);

-- Helper function: check jersey ownership
CREATE OR REPLACE FUNCTION public.is_jersey_owner(_jersey_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_jerseys
    WHERE id = _jersey_id AND user_id = auth.uid()
  )
$$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_jerseys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- User jerseys policies
CREATE POLICY "Users can view own jerseys or available-for-trade"
  ON public.user_jerseys FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR available_for_trade = true);
CREATE POLICY "Users can insert own jerseys"
  ON public.user_jerseys FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own jerseys"
  ON public.user_jerseys FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can delete own jerseys"
  ON public.user_jerseys FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Trade requests policies
CREATE POLICY "Trade participants can view their trades"
  ON public.trade_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_jerseys j
      WHERE (j.id = requester_jersey_id OR j.id = owner_jersey_id)
        AND j.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create trade requests for own jerseys"
  ON public.trade_requests FOR INSERT TO authenticated
  WITH CHECK (
    public.is_jersey_owner(requester_jersey_id)
    AND NOT public.is_jersey_owner(owner_jersey_id)
  );
CREATE POLICY "Trade participants can update trades"
  ON public.trade_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_jerseys j
      WHERE (j.id = requester_jersey_id OR j.id = owner_jersey_id)
        AND j.user_id = auth.uid()
    )
  );
CREATE POLICY "Participants can delete pending trades"
  ON public.trade_requests FOR DELETE TO authenticated
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.user_jerseys j
      WHERE (j.id = requester_jersey_id OR j.id = owner_jersey_id)
        AND j.user_id = auth.uid()
    )
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_jerseys_updated_at
  BEFORE UPDATE ON public.user_jerseys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trade_requests_updated_at
  BEFORE UPDATE ON public.trade_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_user_jerseys_user_id ON public.user_jerseys(user_id);
CREATE INDEX idx_user_jerseys_available ON public.user_jerseys(available_for_trade) WHERE available_for_trade = true;
CREATE INDEX idx_trade_requests_requester ON public.trade_requests(requester_jersey_id);
CREATE INDEX idx_trade_requests_owner ON public.trade_requests(owner_jersey_id);
CREATE INDEX idx_trade_requests_status ON public.trade_requests(status);
