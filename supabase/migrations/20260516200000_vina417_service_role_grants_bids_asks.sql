-- Migration: VINA-417 — Nacharbeit: service_role grants on bids, asks, bid_ask_matches
--
-- Context:
--   The VINA-390 migration (PR #147) created the bids, asks, and bid_ask_matches
--   tables but did not include GRANT statements for the service_role.
--   Guido applied these manually to production after deployment.
--   This patch migration documents those grants so the repo matches prod.
--
-- Why service_role needs explicit grants:
--   Supabase Edge Functions that use the service-role client (to bypass RLS for
--   matching logic, webhook handlers, etc.) still require table-level privileges.
--   Without these grants the service role cannot INSERT/UPDATE into these tables
--   even though it bypasses row-level security.
--
-- These are idempotent (re-granting an already-held privilege is a no-op).

GRANT SELECT, INSERT, UPDATE ON public.bids          TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.asks          TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.bid_ask_matches TO service_role;
