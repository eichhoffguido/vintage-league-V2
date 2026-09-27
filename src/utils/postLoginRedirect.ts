// Ziel nach dem Login merken (z. B. /community). Der Login landet weiterhin auf "/", damit der
// ProfileGuard (App.tsx) zuerst über das Onboarding entscheidet; danach geht es zum gemerkten Ziel.
const KEY = "cc-post-login-path";

/** Nur interne Pfade zulassen ("/…", nicht "//…" oder URLs). */
const isInternalPath = (path: string) => path.startsWith("/") && !path.startsWith("//") && !path.includes("://");

export function rememberPostLoginPath(path: string | null): void {
  if (!path || !isInternalPath(path)) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Speicher nicht verfügbar (privater Modus) → Standardziel
  }
}

export function takePostLoginPath(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return path && isInternalPath(path) ? path : null;
  } catch {
    return null;
  }
}

/** Login-URL mit Rücksprung, z. B. authPath("/community") → "/auth?next=%2Fcommunity". */
export const authPath = (next: string) => `/auth?next=${encodeURIComponent(next)}`;
