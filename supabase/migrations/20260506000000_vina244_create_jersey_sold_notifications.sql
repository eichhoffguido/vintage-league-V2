-- VINA-244: Create jersey_sold_notifications table for stripe-webhook Edge Function
-- No existing `notifications` table found in migrations, so creating a dedicated table.

CREATE TABLE IF NOT EXISTS jersey_sold_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'jersey_sold',
  jersey_id UUID NOT NULL REFERENCES user_jerseys(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for recipient lookups (e.g. "show my notifications")
CREATE INDEX IF NOT EXISTS idx_jersey_sold_notifications_recipient
  ON jersey_sold_notifications(recipient_id, created_at DESC);

-- RLS: recipients can read their own notifications
ALTER TABLE jersey_sold_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients can select own notifications"
  ON jersey_sold_notifications
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- Service role handles INSERT (webhook only) — no INSERT policy needed for anon/authenticated
