// Gemeinsamer Lesezugriff der Vercel-Funktionen auf Supabase (öffentlicher Schlüssel, gleiche Rechte wie ein Gast).
// Die Variablen sind dieselben wie im Frontend (Vercel → Settings → Environment Variables).
// Dateien mit "_" am Anfang sind in api/ keine eigenen Funktionen.

export const supabaseUrl = (): string => (process.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const supabaseKey = (): string => process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

/** GET auf die PostgREST-API, z. B. rest("site_content?select=key,value&key=like.seo.*"). Wirft bei Fehlern. */
export async function rest<T>(query: string, timeoutMs = 2500): Promise<T> {
  const url = supabaseUrl();
  const key = supabaseKey();
  if (!url || !key) throw new Error("Supabase env missing");
  const res = await fetch(`${url}/rest/v1/${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return (await res.json()) as T;
}
