// CC account deletion — delete-account
//
// POST { confirm: "LÖSCHEN" } (logged-in user) → { deleted: true }
// Deletes the CALLER's account (never another user's):
//   1. rpc delete_account_data  — blockers (running checkout, agreed swap), jersey snapshots on
//      transactions, bids/asks removal, community anonymisation (migration 20260927120000)
//   2. Storage: everything under <user_id>/ in avatars, forum-images, jersey-images
//   3. auth.admin.deleteUser    — cascades profile, jerseys, favorites, swaps, sessions …
// Step 1 raises with a German message when deletion is blocked; nothing is removed then.
// Each step is idempotent, so a retry after a partial failure finishes the job.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createServiceClient, getAuthenticatedUser } from "../_shared/clients.ts";
import { errorResponse, jsonResponse, preflightResponse } from "../_shared/http.ts";

const BUCKETS = ["avatars", "forum-images", "jersey-images"] as const;
const CONFIRM_WORD = "LÖSCHEN";

/** Removes every object below `<userId>/` in a bucket (paged, also one level of sub-folders). */
async function emptyUserFolder(supabase: SupabaseClient, bucket: string, userId: string): Promise<number> {
  let removed = 0;
  const folders = [userId];
  while (folders.length > 0) {
    const prefix = folders.pop()!;
    for (;;) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
      if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
      if (!data || data.length === 0) break;
      const files = data.filter((o) => o.id !== null).map((o) => `${prefix}/${o.name}`);
      data.filter((o) => o.id === null).forEach((f) => folders.push(`${prefix}/${f.name}`));
      if (files.length === 0) break;
      const { error: rmError } = await supabase.storage.from(bucket).remove(files);
      if (rmError) throw new Error(`remove ${bucket}/${prefix}: ${rmError.message}`);
      removed += files.length;
      if (data.length < 1000) break;
    }
  }
  return removed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return preflightResponse(req);
  if (req.method !== "POST") return errorResponse(req, "Methode nicht erlaubt.", 405);

  const supabase = createServiceClient();
  const user = await getAuthenticatedUser(req, supabase);
  if (!user) return errorResponse(req, "Bitte melde dich an.", 401);

  let confirm: unknown;
  try {
    confirm = ((await req.json()) as { confirm?: unknown }).confirm;
  } catch {
    return errorResponse(req, "Ungültige Anfrage.", 400);
  }
  if (confirm !== CONFIRM_WORD) {
    return errorResponse(req, `Bitte bestätige mit „${CONFIRM_WORD}“.`, 400);
  }

  // 1. Database: blockers + anonymise (raises P0001 with a German message when blocked)
  const { error: dataError } = await supabase.rpc("delete_account_data", { p_user_id: user.id });
  if (dataError) {
    if (dataError.code === "P0001") return errorResponse(req, dataError.message, 409);
    console.error("[delete-account] delete_account_data failed:", dataError);
    return errorResponse(req, "Konto konnte nicht gelöscht werden. Bitte versuche es später erneut.", 500);
  }

  // 2. Storage
  try {
    for (const bucket of BUCKETS) {
      const n = await emptyUserFolder(supabase, bucket, user.id);
      if (n > 0) console.log(`[delete-account] ${user.id}: removed ${n} object(s) from ${bucket}`);
    }
  } catch (err) {
    console.error("[delete-account] storage cleanup failed:", err);
    return errorResponse(req, "Bilder konnten nicht vollständig gelöscht werden. Bitte versuche es erneut.", 500);
  }

  // 3. Auth user (cascades the remaining personal data)
  const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
  if (authError) {
    console.error("[delete-account] auth deleteUser failed:", authError);
    return errorResponse(req, "Konto konnte nicht gelöscht werden. Bitte versuche es später erneut.", 500);
  }

  console.log(`[delete-account] account ${user.id} deleted`);
  return jsonResponse(req, { deleted: true });
});
