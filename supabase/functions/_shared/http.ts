// CC-S2 — CORS + JSON response helpers for browser-facing Edge Functions.
import { isAllowedOrigin } from "./payments.ts";

export function corsHeadersFor(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  const origin = req.headers.get("Origin");
  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

/** Preflight response (no Allow-Origin header for foreign origins → browser blocks). */
export function preflightResponse(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeadersFor(req) });
}

export function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
  });
}

export function errorResponse(req: Request, message: string, status: number): Response {
  return jsonResponse(req, { error: message }, status);
}
