import { useEffect, useState } from "react";
import { NATIONAL_TEAM_FLAGS } from "@/data/teams-leagues";

// Central kill switch: set to false to fall back to the neutral ⚽ icon /
// flag emoji everywhere without a deploy risk (pending trademark check on
// showing club crests).
export const SHOW_TEAM_CRESTS = true;

const THESPORTSDB_SEARCH_URL = "https://www.thesportsdb.com/api/v1/json/3/searchteams.php";
const CACHE_STORAGE_KEY = "vl_team_crest_cache_v1";

export type TeamBadge =
  | { kind: "flag"; emoji: string }
  | { kind: "crest"; url: string }
  | { kind: "fallback" };

const crestCache = new Map<string, string | null>();

function readStorageCache(): Record<string, string | null> {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStorageCache(cache: Record<string, string | null>) {
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Cache is a pure optimization — ignore quota/availability errors.
  }
}

async function fetchTeamCrest(teamName: string): Promise<string | null> {
  if (crestCache.has(teamName)) return crestCache.get(teamName) ?? null;

  const stored = readStorageCache();
  if (teamName in stored) {
    crestCache.set(teamName, stored[teamName]);
    return stored[teamName];
  }

  let crestUrl: string | null = null;
  try {
    const res = await fetch(`${THESPORTSDB_SEARCH_URL}?t=${encodeURIComponent(teamName)}`);
    if (res.ok) {
      const data = await res.json();
      const badge = data?.teams?.[0]?.strBadge;
      if (typeof badge === "string" && badge) crestUrl = badge;
    }
  } catch {
    crestUrl = null;
  }

  crestCache.set(teamName, crestUrl);
  writeStorageCache({ ...stored, [teamName]: crestUrl });
  return crestUrl;
}

/**
 * Resolves a favorite-team badge: flag emoji for national teams, a cached
 * crest lookup (TheSportsDB) for clubs, and the neutral ⚽ fallback whenever
 * crests are disabled, not found, or the request fails — never a broken image.
 */
export function useTeamBadge(teamName: string | null | undefined): TeamBadge | null {
  const [badge, setBadge] = useState<TeamBadge | null>(null);

  useEffect(() => {
    if (!teamName) {
      setBadge(null);
      return;
    }

    const flag = NATIONAL_TEAM_FLAGS[teamName];
    if (flag) {
      setBadge({ kind: "flag", emoji: flag });
      return;
    }

    if (!SHOW_TEAM_CRESTS) {
      setBadge({ kind: "fallback" });
      return;
    }

    let cancelled = false;
    setBadge({ kind: "fallback" });
    fetchTeamCrest(teamName).then((url) => {
      if (cancelled) return;
      setBadge(url ? { kind: "crest", url } : { kind: "fallback" });
    });
    return () => {
      cancelled = true;
    };
  }, [teamName]);

  return badge;
}
