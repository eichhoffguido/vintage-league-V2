-- Fix trade_requests SELECT RLS policy
--
-- Problem: The original policy uses a direct EXISTS subquery against
-- user_jerseys, which is itself subject to RLS. The user_jerseys SELECT
-- policy only allows rows where user_id = auth.uid() OR
-- available_for_trade = true. This means that once a trade is accepted/
-- completed and available_for_trade becomes false on the other party's
-- jersey, the subquery returns no rows and the trade disappears from
-- the participant's view.
--
-- Fix: Replace the direct subquery with calls to the existing SECURITY
-- DEFINER helper function is_jersey_owner(), which queries user_jerseys
-- bypassing RLS so ownership is checked correctly regardless of the
-- jersey's available_for_trade flag.

DROP POLICY IF EXISTS "Trade participants can view their trades" ON public.trade_requests;

CREATE POLICY "Trade participants can view their trades"
  ON public.trade_requests FOR SELECT TO authenticated
  USING (
    public.is_jersey_owner(requester_jersey_id)
    OR public.is_jersey_owner(owner_jersey_id)
  );
