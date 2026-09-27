-- CC account deletion ("Danger Zone" in Profil bearbeiten) — Guido decisions 27.09.2026:
--   * Community posts/comments are ANONYMISED (author → "Gelöschtes Mitglied", attached images removed).
--   * Completed purchases/sales/ratings are KEPT PSEUDONYMISED (person reference removed; retention
--     duties for business records). Final legal check with the legal entity / task S4.
--
-- Flow (Edge Function `delete-account`, service role):
--   1. rpc delete_account_data(user)   — blockers + anonymise + remove bids/asks (this file)
--   2. Storage: remove <user>/… in avatars, forum-images, jersey-images
--   3. auth.admin.deleteUser(user)     — cascades profiles, user_jerseys (→ trade_requests,
--      favorites, notifications), trade_confirmations, sessions …
--
-- For step 3 to succeed, every FK to auth.users / user_jerseys / bids / asks / trade_requests on the
-- RETAINED tables must become ON DELETE SET NULL (and the columns nullable). That is part 1 below.
-- Project convention: explicit GRANTs, no default privileges.

-- ---------------------------------------------------------------------------
-- 1. Retained tables: allow losing the person / jersey reference
-- ---------------------------------------------------------------------------

-- transactions (+ snapshot so bookkeeping still knows WHAT was sold)
ALTER TABLE public.transactions
  ALTER COLUMN buyer_id  DROP NOT NULL,
  ALTER COLUMN seller_id DROP NOT NULL,
  ALTER COLUMN jersey_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS jersey_snapshot jsonb;
COMMENT ON COLUMN public.transactions.jersey_snapshot IS
  'CC account deletion: team/name/league/year/size/condition of the jersey, written before the jersey is deleted with its owner.';

ALTER TABLE public.transactions DROP CONSTRAINT transactions_buyer_id_fkey,
  ADD CONSTRAINT transactions_buyer_id_fkey  FOREIGN KEY (buyer_id)  REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.transactions DROP CONSTRAINT transactions_seller_id_fkey,
  ADD CONSTRAINT transactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.transactions DROP CONSTRAINT transactions_jersey_id_fkey,
  ADD CONSTRAINT transactions_jersey_id_fkey FOREIGN KEY (jersey_id) REFERENCES public.user_jerseys(id) ON DELETE SET NULL;

-- sales_history (already carries a team/league/year/condition snapshot)
ALTER TABLE public.sales_history
  ALTER COLUMN jersey_id      DROP NOT NULL,
  ALTER COLUMN seller_user_id DROP NOT NULL;
ALTER TABLE public.sales_history DROP CONSTRAINT sales_history_jersey_id_fkey,
  ADD CONSTRAINT sales_history_jersey_id_fkey FOREIGN KEY (jersey_id) REFERENCES public.user_jerseys(id) ON DELETE SET NULL;
ALTER TABLE public.sales_history DROP CONSTRAINT sales_history_seller_user_id_fkey,
  ADD CONSTRAINT sales_history_seller_user_id_fkey FOREIGN KEY (seller_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.sales_history DROP CONSTRAINT sales_history_buyer_user_id_fkey,
  ADD CONSTRAINT sales_history_buyer_user_id_fkey FOREIGN KEY (buyer_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.sales_history DROP CONSTRAINT sales_history_trade_request_id_fkey,
  ADD CONSTRAINT sales_history_trade_request_id_fkey FOREIGN KEY (trade_request_id) REFERENCES public.trade_requests(id) ON DELETE SET NULL;

-- trade_ratings (the other party keeps the rating they received)
ALTER TABLE public.trade_ratings
  ALTER COLUMN rater_user_id DROP NOT NULL,
  ALTER COLUMN rated_user_id DROP NOT NULL,
  ALTER COLUMN trade_id      DROP NOT NULL;
ALTER TABLE public.trade_ratings DROP CONSTRAINT trade_ratings_rater_user_id_fkey,
  ADD CONSTRAINT trade_ratings_rater_user_id_fkey FOREIGN KEY (rater_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.trade_ratings DROP CONSTRAINT trade_ratings_rated_user_id_fkey,
  ADD CONSTRAINT trade_ratings_rated_user_id_fkey FOREIGN KEY (rated_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.trade_ratings DROP CONSTRAINT trade_ratings_trade_id_fkey,
  ADD CONSTRAINT trade_ratings_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trade_requests(id) ON DELETE SET NULL;

-- bid_ask_matches (execution records)
ALTER TABLE public.bid_ask_matches
  ALTER COLUMN bid_id    DROP NOT NULL,
  ALTER COLUMN ask_id    DROP NOT NULL,
  ALTER COLUMN jersey_id DROP NOT NULL;
ALTER TABLE public.bid_ask_matches DROP CONSTRAINT bid_ask_matches_bid_id_fkey,
  ADD CONSTRAINT bid_ask_matches_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.bids(id) ON DELETE SET NULL;
ALTER TABLE public.bid_ask_matches DROP CONSTRAINT bid_ask_matches_ask_id_fkey,
  ADD CONSTRAINT bid_ask_matches_ask_id_fkey FOREIGN KEY (ask_id) REFERENCES public.asks(id) ON DELETE SET NULL;
ALTER TABLE public.bid_ask_matches DROP CONSTRAINT bid_ask_matches_jersey_id_fkey,
  ADD CONSTRAINT bid_ask_matches_jersey_id_fkey FOREIGN KEY (jersey_id) REFERENCES public.user_jerseys(id) ON DELETE SET NULL;

-- admin who verified jerseys may delete their account
ALTER TABLE public.user_jerseys DROP CONSTRAINT user_jerseys_verified_by_fkey,
  ADD CONSTRAINT user_jerseys_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 2. delete_account_data(p_user_id) — called by the Edge Function (service role only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_account_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Community content of deleted accounts points here; the UI shows "Gelöschtes Mitglied".
  c_deleted_member CONSTANT uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  IF p_user_id IS NULL OR p_user_id = c_deleted_member THEN
    RAISE EXCEPTION 'Ungültiges Konto.' USING ERRCODE = '22023';
  END IF;

  -- Blockers: running checkout (as buyer or seller) or an agreed swap still open
  IF EXISTS (
    SELECT 1 FROM transactions
     WHERE status = 'pending' AND (buyer_id = p_user_id OR seller_id = p_user_id)
  ) THEN
    RAISE EXCEPTION 'Gerade läuft ein Kauf oder Verkauf. Du kannst dein Konto löschen, sobald er abgeschlossen ist.'
      USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM trade_requests tr
      JOIN user_jerseys j ON j.id IN (tr.requester_jersey_id, tr.owner_jersey_id)
     WHERE j.user_id = p_user_id AND tr.status = 'accepted' AND tr.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Du hast einen vereinbarten Tausch, der noch nicht abgeschlossen ist. Schließe ihn zuerst ab.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Snapshot of sold jerseys before they are deleted with their owner
  UPDATE transactions t
     SET jersey_snapshot = jsonb_build_object(
           'team', j.team, 'name', j.name, 'league', j.league,
           'year', j.year, 'size', j.size, 'condition', j.condition)
    FROM user_jerseys j
   WHERE t.jersey_id = j.id AND j.user_id = p_user_id AND t.jersey_snapshot IS NULL;

  -- Bids/asks: own ones, and everyone's on this user's jerseys (those jerseys disappear)
  DELETE FROM bids
   WHERE user_id = p_user_id
      OR jersey_id IN (SELECT id FROM user_jerseys WHERE user_id = p_user_id);
  DELETE FROM asks
   WHERE user_id = p_user_id
      OR jersey_id IN (SELECT id FROM user_jerseys WHERE user_id = p_user_id);

  -- Community: anonymise, attached images are removed from storage by the Edge Function
  UPDATE forum_posts
     SET user_id = c_deleted_member, image_urls = '{}', updated_at = now()
   WHERE user_id = p_user_id;
  UPDATE forum_comments
     SET user_id = c_deleted_member, image_urls = '{}', updated_at = now()
   WHERE user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.delete_account_data(uuid) IS
  'CC account deletion step 1: blockers, jersey snapshots, bids/asks removal, community anonymisation. Service role only.';

REVOKE ALL ON FUNCTION public.delete_account_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account_data(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- Rollback (manual, only while no account has been deleted yet):
-- DROP FUNCTION IF EXISTS public.delete_account_data(uuid);
-- ALTER TABLE public.transactions DROP COLUMN IF EXISTS jersey_snapshot;
-- Re-create the FKs without ON DELETE SET NULL and SET NOT NULL on the columns above
-- (fails if rows with NULL exist).
