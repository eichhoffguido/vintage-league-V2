// Community-Inhalte gelöschter Konten zeigen auf diese ID (Migration 20260927120000_cc_account_deletion).
export const DELETED_MEMBER_ID = "00000000-0000-0000-0000-000000000000";

/** Anzeigename für Beiträge/Antworten: „Gelöschtes Mitglied“ bei gelöschten Konten, sonst Name oder „Anonym“. */
export function authorName(userId: string, profile?: { display_name: string | null } | null): string {
  if (userId === DELETED_MEMBER_ID) return "Gelöschtes Mitglied";
  return profile?.display_name || "Anonym";
}
