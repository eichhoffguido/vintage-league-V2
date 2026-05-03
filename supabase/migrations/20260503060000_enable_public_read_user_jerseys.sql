-- Enable public (anon) read access on user_jerseys for the /shop marketplace
-- Unauthenticated users can browse jerseys that are available for trade and not deleted.
-- This does NOT change any write policies.
CREATE POLICY "Public can view available jerseys"
  ON public.user_jerseys FOR SELECT TO anon
  USING (available_for_trade = true AND deleted_at IS NULL);
