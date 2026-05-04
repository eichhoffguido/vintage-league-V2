-- Migration: sales_history table, RLS, and trigger for completed trade_requests
--
-- Part of VINA-159 — Price History feature.
-- Tracks all completed trades as sales records for price history queries.

-- Create sales_history table
CREATE TABLE public.sales_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jersey_id uuid NOT NULL REFERENCES public.user_jerseys(id),
  seller_user_id uuid NOT NULL REFERENCES auth.users(id),
  buyer_user_id uuid REFERENCES auth.users(id),
  sale_price_cents integer NOT NULL,
  team text NOT NULL,
  league text NOT NULL,
  year text NOT NULL,
  condition smallint NOT NULL,
  sold_at timestamptz NOT NULL DEFAULT now(),
  trade_request_id uuid REFERENCES public.trade_requests(id)
);

-- Enable RLS
ALTER TABLE public.sales_history ENABLE ROW LEVEL SECURITY;

-- Policy: public read (anon and authenticated can SELECT)
CREATE POLICY "Public read sales_history"
  ON public.sales_history FOR SELECT
  USING (true);

-- No INSERT policy for authenticated users — only service_role can insert.
-- Inserts happen exclusively via the trigger below (SECURITY DEFINER).

-- Indexes for common query patterns
CREATE INDEX idx_sales_history_team_year ON public.sales_history(team, year);
CREATE INDEX idx_sales_history_sold_at ON public.sales_history(sold_at DESC);
CREATE INDEX idx_sales_history_jersey_id ON public.sales_history(jersey_id);
CREATE INDEX idx_sales_history_seller ON public.sales_history(seller_user_id);

-- Trigger function: insert a sales_history record when a trade is completed.
-- The owner of owner_jersey_id is the seller; owner of requester_jersey_id is the buyer.
-- sale_price_cents is taken from the owner jersey's price_cents (COALESCE 0 if unset).
CREATE OR REPLACE FUNCTION public.record_completed_trade_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_jersey     public.user_jerseys%ROWTYPE;
  v_seller_user_id   uuid;
  v_buyer_user_id    uuid;
BEGIN
  -- Only fire when status transitions TO 'completed'
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Fetch the owner's jersey (the jersey being traded away by the owner)
  SELECT * INTO v_owner_jersey
  FROM public.user_jerseys
  WHERE id = NEW.owner_jersey_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Derive seller (owner of the owner jersey) and buyer (owner of the requester jersey)
  v_seller_user_id := v_owner_jersey.user_id;

  SELECT user_id INTO v_buyer_user_id
  FROM public.user_jerseys
  WHERE id = NEW.requester_jersey_id;

  -- Insert the sales record
  INSERT INTO public.sales_history (
    jersey_id,
    seller_user_id,
    buyer_user_id,
    sale_price_cents,
    team,
    league,
    year,
    condition,
    sold_at,
    trade_request_id
  ) VALUES (
    v_owner_jersey.id,
    v_seller_user_id,
    v_buyer_user_id,
    COALESCE(v_owner_jersey.price_cents, 0),
    v_owner_jersey.team,
    v_owner_jersey.league,
    v_owner_jersey.year,
    v_owner_jersey.condition,
    now(),
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- Attach trigger to trade_requests
CREATE TRIGGER on_trade_request_completed
  AFTER UPDATE OF status ON public.trade_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.record_completed_trade_sale();

-- RPC: get last N sales for a given team + year (for frontend price history widget)
CREATE OR REPLACE FUNCTION public.get_recent_sales_by_team_year(
  p_team text,
  p_year text,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  jersey_id uuid,
  sale_price_cents integer,
  team text,
  league text,
  year text,
  condition smallint,
  sold_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sh.id,
    sh.jersey_id,
    sh.sale_price_cents,
    sh.team,
    sh.league,
    sh.year,
    sh.condition,
    sh.sold_at
  FROM public.sales_history sh
  WHERE sh.team = p_team
    AND sh.year = p_year
  ORDER BY sh.sold_at DESC
  LIMIT p_limit;
$$;
