// CC-D2 — Supabase-Auth-Fehler → verständliche deutsche Meldungen.
// Grundlage ist error.code (supabase-js v2); ältere Antworten ohne Code werden über Status/Text erkannt.

export interface AuthErrorLike {
  code?: string;
  status?: number;
  message?: string;
}

export const AUTH_MESSAGES = {
  invalidCredentials: "E-Mail oder Passwort ist falsch.",
  emailNotConfirmed: "Bitte bestätige zuerst deine E-Mail-Adresse. Den Link findest du in deinem Postfach.",
  alreadyRegistered: "Diese E-Mail-Adresse ist bereits registriert. Melde dich an oder setze dein Passwort zurück.",
  weakPassword: "Das Passwort ist zu schwach. Nimm mindestens 8 Zeichen, am besten mit Zahlen oder Sonderzeichen.",
  emailRateLimit: "Wir haben dir gerade schon eine E-Mail geschickt. Bitte warte einen Moment und versuch es dann erneut.",
  requestRateLimit: "Zu viele Versuche. Bitte warte kurz und versuch es dann erneut.",
  samePassword: "Das neue Passwort muss sich vom bisherigen unterscheiden.",
  invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
  signupDisabled: "Die Registrierung per E-Mail ist gerade nicht möglich. Melde dich bitte mit Google an.",
  linkExpired: "Der Link ist abgelaufen oder wurde schon benutzt. Fordere einfach einen neuen an.",
  // Bestätigungslinks öffnen manche Firmen-Mailscanner vorab — dann ist die Adresse meist schon bestätigt.
  signupLinkUsed: "Der Link ist abgelaufen oder wurde schon benutzt. Melde dich einfach mit E-Mail und Passwort an — ist deine Adresse noch nicht bestätigt, kannst du dir dort einen neuen Link schicken lassen.",
  generic: "Etwas ist schiefgelaufen. Bitte versuch es erneut.",
} as const;

const BY_CODE: Record<string, string> = {
  invalid_credentials: AUTH_MESSAGES.invalidCredentials,
  email_not_confirmed: AUTH_MESSAGES.emailNotConfirmed,
  user_already_exists: AUTH_MESSAGES.alreadyRegistered,
  email_exists: AUTH_MESSAGES.alreadyRegistered,
  weak_password: AUTH_MESSAGES.weakPassword,
  over_email_send_rate_limit: AUTH_MESSAGES.emailRateLimit,
  over_request_rate_limit: AUTH_MESSAGES.requestRateLimit,
  same_password: AUTH_MESSAGES.samePassword,
  email_address_invalid: AUTH_MESSAGES.invalidEmail,
  validation_failed: AUTH_MESSAGES.invalidEmail,
  signup_disabled: AUTH_MESSAGES.signupDisabled,
  email_provider_disabled: AUTH_MESSAGES.signupDisabled,
  otp_expired: AUTH_MESSAGES.linkExpired,
  session_not_found: AUTH_MESSAGES.linkExpired,
  session_expired: AUTH_MESSAGES.linkExpired,
  bad_jwt: AUTH_MESSAGES.linkExpired,
};

/** Übersetzt einen Supabase-Auth-Fehler in eine deutsche Meldung. */
export function authErrorMessage(error: AuthErrorLike | null | undefined): string {
  if (!error) return AUTH_MESSAGES.generic;
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];

  const text = (error.message ?? "").toLowerCase();
  if (text.includes("invalid login credentials")) return AUTH_MESSAGES.invalidCredentials;
  if (text.includes("email not confirmed")) return AUTH_MESSAGES.emailNotConfirmed;
  if (text.includes("already registered")) return AUTH_MESSAGES.alreadyRegistered;
  if (text.includes("password should be")) return AUTH_MESSAGES.weakPassword;
  if (error.status === 429) return AUTH_MESSAGES.requestRateLimit;
  return AUTH_MESSAGES.generic;
}

/** Nicht bestätigte E-Mail? Dann bietet das Formular „Bestätigungs-Mail erneut senden“ an. */
export const isEmailNotConfirmed = (error: AuthErrorLike | null | undefined) =>
  error?.code === "email_not_confirmed" || (error?.message ?? "").toLowerCase().includes("email not confirmed");

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Fehler, die Supabase nach einem abgelaufenen/benutzten Link in die Adresse schreibt
 * (#error_code=otp_expired&error_description=…). Liefert die Meldung oder null.
 */
export function authErrorFromUrl(hash: string, search: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const query = new URLSearchParams(search);
  const code = params.get("error_code") ?? query.get("error_code");
  const error = params.get("error") ?? query.get("error");
  if (!code && !error) return null;
  // Links scheitern fast immer, weil sie abgelaufen oder schon benutzt sind.
  return (code && BY_CODE[code]) || AUTH_MESSAGES.linkExpired;
}
