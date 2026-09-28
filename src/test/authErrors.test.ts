import { describe, expect, it } from "vitest";
import { AUTH_MESSAGES, authErrorFromUrl, authErrorMessage, isEmailNotConfirmed } from "@/lib/authErrors";

describe("authErrorMessage", () => {
  it("übersetzt bekannte Codes", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe(AUTH_MESSAGES.invalidCredentials);
    expect(authErrorMessage({ code: "user_already_exists" })).toBe(AUTH_MESSAGES.alreadyRegistered);
    expect(authErrorMessage({ code: "weak_password" })).toBe(AUTH_MESSAGES.weakPassword);
    expect(authErrorMessage({ code: "over_email_send_rate_limit" })).toBe(AUTH_MESSAGES.emailRateLimit);
    expect(authErrorMessage({ code: "email_not_confirmed" })).toBe(AUTH_MESSAGES.emailNotConfirmed);
  });

  it("erkennt ältere Antworten ohne Code am Text oder Status", () => {
    expect(authErrorMessage({ message: "Invalid login credentials" })).toBe(AUTH_MESSAGES.invalidCredentials);
    expect(authErrorMessage({ message: "User already registered" })).toBe(AUTH_MESSAGES.alreadyRegistered);
    expect(authErrorMessage({ status: 429, message: "x" })).toBe(AUTH_MESSAGES.requestRateLimit);
  });

  it("fällt auf eine allgemeine Meldung zurück", () => {
    expect(authErrorMessage({ code: "unbekannt" })).toBe(AUTH_MESSAGES.generic);
    expect(authErrorMessage(null)).toBe(AUTH_MESSAGES.generic);
  });

  it("erkennt nicht bestätigte E-Mails", () => {
    expect(isEmailNotConfirmed({ code: "email_not_confirmed" })).toBe(true);
    expect(isEmailNotConfirmed({ message: "Email not confirmed" })).toBe(true);
    expect(isEmailNotConfirmed({ code: "invalid_credentials" })).toBe(false);
  });
});

describe("authErrorFromUrl", () => {
  it("liefert null ohne Fehler in der Adresse", () => {
    expect(authErrorFromUrl("#access_token=abc&type=recovery", "")).toBeNull();
  });

  it("meldet abgelaufene Links", () => {
    expect(authErrorFromUrl("#error=access_denied&error_code=otp_expired&error_description=x", "")).toBe(AUTH_MESSAGES.linkExpired);
    expect(authErrorFromUrl("", "?error=server_error")).toBe(AUTH_MESSAGES.linkExpired);
  });
});
