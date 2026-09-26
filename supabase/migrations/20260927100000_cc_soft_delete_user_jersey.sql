-- CC delete fix: soft delete for user_jerseys (Sammlung + Profil)
--
-- Why a function instead of a plain UPDATE from the client:
--   The SELECT policies on user_jerseys only show rows with deleted_at IS NULL.
--   A client-side `update({ deleted_at })` therefore fails with
--   "new row violates row-level security policy" (verified 26.09.2026).
--
-- Behaviour of soft_delete_user_jersey(p_jersey_id):
--   - only the owner (auth.uid()) can delete; already deleted → error
--   - blocked while a checkout is running (transactions.status = 'pending')
--   - blocked while an accepted swap is not completed yet
--   - sets deleted_at/updated_at, cancels active bids/asks on the jersey,
--     declines pending trade requests involving the jersey
--   Error messages are German because the frontend shows them as-is.
--
-- Project convention: new objects get no default privileges → explicit GRANTs.

CREATE OR REPLACE FUNCTION public.soft_delete_user_jersey(p_jersey_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Bitte melde dich an.' USING ERRCODE = '42501';
  END IF;

  PERFORM 1
    FROM user_jerseys
   WHERE id = p_jersey_id
     AND user_id = v_uid
     AND deleted_at IS NULL
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trikot nicht gefunden.' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1 FROM transactions
     WHERE jersey_id = p_jersey_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Für dieses Trikot läuft gerade ein Kauf. Löschen ist erst danach möglich.'
      USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM trade_requests
     WHERE (requester_jersey_id = p_jersey_id OR owner_jersey_id = p_jersey_id)
       AND status = 'accepted'
       AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Für dieses Trikot ist ein Tausch vereinbart. Schließe ihn zuerst ab.'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE user_jerseys
     SET deleted_at = now(), updated_at = now()
   WHERE id = p_jersey_id;

  UPDATE bids SET status = 'cancelled'
   WHERE jersey_id = p_jersey_id AND status = 'active';

  UPDATE asks SET status = 'cancelled'
   WHERE jersey_id = p_jersey_id AND status = 'active';

  UPDATE trade_requests
     SET status = 'declined', updated_at = now()
   WHERE (requester_jersey_id = p_jersey_id OR owner_jersey_id = p_jersey_id)
     AND status = 'pending'
     AND deleted_at IS NULL;
END;
$$;

COMMENT ON FUNCTION public.soft_delete_user_jersey(uuid) IS
  'CC delete fix: owner soft-deletes a jersey (deleted_at), cancels active bids/asks, declines pending swaps. Blocked during checkout or accepted swap.';

REVOKE ALL ON FUNCTION public.soft_delete_user_jersey(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_user_jersey(uuid) TO authenticated, service_role;

-- Rollback:
-- DROP FUNCTION IF EXISTS public.soft_delete_user_jersey(uuid);
