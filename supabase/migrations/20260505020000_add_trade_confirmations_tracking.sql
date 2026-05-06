-- Migration: Add trade_confirmations table for two-party trade completion
-- Part of VINA-202 — Trade Completion Flow + Seller Star Ratings
--
-- Tracks which users have confirmed receipt of a trade.
-- Both requester and owner must confirm before trade can be marked completed.

CREATE TABLE public.trade_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trade_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confirmed_at timestamptz DEFAULT now(),
  UNIQUE(trade_id, user_id)
);

-- RLS Policies
ALTER TABLE public.trade_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own confirmations"
  ON public.trade_confirmations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone authenticated can read confirmations"
  ON public.trade_confirmations FOR SELECT TO authenticated
  USING (true);

COMMENT ON TABLE public.trade_confirmations IS
  'Tracks two-party confirmation for trade completion. Both requester and owner must have a row to complete the trade.';
COMMENT ON COLUMN public.trade_confirmations.trade_id IS
  'Reference to the trade_requests record.';
COMMENT ON COLUMN public.trade_confirmations.user_id IS
  'The user who confirmed (either requester or owner).';
COMMENT ON COLUMN public.trade_confirmations.confirmed_at IS
  'Timestamp when user confirmed the trade completion.';
