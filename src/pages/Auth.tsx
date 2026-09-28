import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { rememberPostLoginPath } from "@/utils/postLoginRedirect";
import { useLegalContent, useSiteContent } from "@/hooks/useSiteContent";
import { useAuth } from "@/hooks/useAuth";
import { useCooldown } from "@/hooks/useCooldown";
import { AUTH_MESSAGES, PASSWORD_MIN_LENGTH, authErrorFromUrl, authErrorMessage, isEmailNotConfirmed } from "@/lib/authErrors";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Mail, User, ArrowRight, ArrowLeft, Chrome } from "lucide-react";

type Mode = "login" | "signup" | "forgot";
type Sent = { kind: "signup" | "reset"; email: string } | null;

const RESEND_COOLDOWN_SECONDS = 60;

// Fehler aus einem abgelaufenen Bestätigungslink (Supabase hängt ihn an die Adresse) — einmal beim Laden lesen.
const initialLinkError = authErrorFromUrl(window.location.hash, window.location.search);

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: Mode = searchParams.get("mode") === "signup" ? "signup" : searchParams.get("mode") === "forgot" ? "forgot" : "login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialLinkError);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [sent, setSent] = useState<Sent>(null);
  const cooldown = useCooldown();

  const { signIn, signUp, signInWithGoogle, requestPasswordReset, resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const page = useSiteContent("auth");
  const { termsHtml } = useLegalContent();
  const hasTerms = termsHtml.trim() !== "";

  // ?next=/community → nach Login (und ggf. Onboarding-Prüfung) dorthin zurück
  useEffect(() => {
    rememberPostLoginPath(searchParams.get("next"));
  }, [searchParams]);

  const switchMode = (next: Mode) => {
    const params = new URLSearchParams(searchParams);
    if (next === "login") params.delete("mode");
    else params.set("mode", next);
    setSearchParams(params, { replace: true });
    setError(null);
    setUnconfirmed(false);
    setSent(null);
  };

  const fail = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const handleLogin = async () => {
    const { error: err } = await signIn(email, password);
    if (!err) {
      toast.success("Willkommen zurück!");
      // Navigate to "/" so ProfileGuard decides collection vs. onboarding.
      navigate("/");
      return;
    }
    if (isEmailNotConfirmed(err)) {
      setUnconfirmed(true);
      fail(AUTH_MESSAGES.emailNotConfirmed);
      return;
    }
    // Same message for "email unknown" and "wrong password" on purpose (don't leak which one it was).
    fail(err.code === "invalid_credentials" || !err.code ? AUTH_MESSAGES.invalidCredentials : authErrorMessage(err));
  };

  const handleSignup = async () => {
    if (password.length < PASSWORD_MIN_LENGTH) {
      fail(AUTH_MESSAGES.weakPassword);
      return;
    }
    const { error: err, alreadyRegistered } = await signUp(email, password, name.trim() || undefined);
    if (err) return fail(authErrorMessage(err));
    if (alreadyRegistered) return fail(AUTH_MESSAGES.alreadyRegistered);
    setSent({ kind: "signup", email });
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  };

  const handleForgot = async () => {
    const { error: err } = await requestPasswordReset(email);
    // Auch bei unbekannter Adresse den Hinweis zeigen — verrät nicht, wer registriert ist.
    if (err && err.code !== "user_not_found") return fail(authErrorMessage(err));
    setSent({ kind: "reset", email });
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnconfirmed(false);
    try {
      if (mode === "signup") await handleSignup();
      else if (mode === "forgot") await handleForgot();
      else await handleLogin();
    } catch {
      fail(AUTH_MESSAGES.generic);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (target: string, kind: "signup" | "reset") => {
    if (cooldown.remaining > 0) return;
    setLoading(true);
    const { error: err } = kind === "signup" ? await resendConfirmation(target) : await requestPasswordReset(target);
    setLoading(false);
    if (err) {
      toast.error(authErrorMessage(err));
      return;
    }
    toast.success("E-Mail ist unterwegs.");
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error: err } = await signInWithGoogle();
    if (err) {
      toast.error("Google-Login fehlgeschlagen. Bitte versuch es erneut.");
      setLoading(false);
    }
  };

  const resendLabel = (label: string) => (cooldown.remaining > 0 ? `${label} (${cooldown.remaining} s)` : label);

  const intro = (
    <ul className="space-y-2">
      {page.points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  );

  // Nach Registrierung / „Passwort vergessen“: Hinweis statt Formular
  if (sent) {
    return (
      <AuthShell
        eyebrow={sent.kind === "signup" ? page.signup.eyebrow : page.eyebrow}
        headline={sent.kind === "signup" ? page.signup.headline : page.headline}
        intro={intro}
      >
        <div className="space-y-5" role="status">
          <div className="flex h-12 w-12 items-center justify-center border-2 border-nero text-verde">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="font-display text-2xl font-semibold normal-case tracking-[-0.02em] md:text-3xl">{page.checkMail.headline}</h2>
          <p className="text-base leading-relaxed">{sent.kind === "signup" ? page.checkMail.text : page.checkMail.resetText}</p>
          <p className="cap text-[11px] text-muted-foreground">
            Gesendet an <span className="normal-case tracking-normal text-nero">{sent.email}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => handleResend(sent.email, sent.kind)}
            disabled={loading || cooldown.remaining > 0}
          >
            {resendLabel("E-Mail erneut senden")}
          </Button>
          <p className="text-sm text-muted-foreground">Nichts angekommen? Schau auch im Spam-Ordner nach.</p>
          <button type="button" onClick={() => switchMode("login")} className="cap inline-flex items-center gap-2 text-xs underline-offset-4 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Zurück zur Anmeldung
          </button>
        </div>
      </AuthShell>
    );
  }

  const shellEyebrow = mode === "signup" ? page.signup.eyebrow : page.eyebrow;
  const shellHeadline = mode === "signup" ? page.signup.headline : page.headline;
  const formEyebrow = mode === "signup" ? page.signup.formEyebrow : page.formEyebrow;
  const formTitle =
    mode === "signup" ? page.signup.formTitle : mode === "forgot" ? "Passwort vergessen? Kein Problem." : page.formTitle;

  return (
    <AuthShell eyebrow={shellEyebrow} headline={shellHeadline} intro={intro}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {mode !== "forgot" ? (
          <div role="tablist" aria-label="Anmelden oder registrieren" className="grid grid-cols-2">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={cn(
                  "cap h-11 border border-nero text-xs transition-colors",
                  m === "signup" && "-ml-px",
                  mode === m ? "bg-nero text-avorio" : "bg-transparent text-nero hover:bg-sabbia",
                )}
              >
                {m === "login" ? "Anmelden" : "Registrieren"}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" onClick={() => switchMode("login")} className="cap inline-flex items-center gap-2 text-xs underline-offset-4 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Zurück zur Anmeldung
          </button>
        )}

        <div>
          <div className="cap text-rosso">{formEyebrow}</div>
          <h2 className="mt-2 font-display text-2xl font-semibold normal-case tracking-[-0.02em] md:text-3xl">{formTitle}</h2>
          {mode === "forgot" && (
            <p className="mt-2 text-base text-muted-foreground">Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst.</p>
          )}
        </div>

        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="name" className="cap text-[11px]">
              Name <span className="normal-case tracking-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="So sehen dich andere Sammler"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 pl-10"
                maxLength={50}
                autoComplete="nickname"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="cap text-[11px]">E-Mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="deine@email.de"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className={cn("h-12 pl-10", error && "border-rosso")}
              required
              maxLength={255}
              autoComplete="email"
            />
          </div>
        </div>

        {mode !== "forgot" && (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-4">
              <Label htmlFor="password" className="cap text-[11px]">Passwort</Label>
              {mode === "login" && (
                <button type="button" onClick={() => switchMode("forgot")} className="text-sm text-muted-foreground underline underline-offset-4 hover:text-nero">
                  Passwort vergessen?
                </button>
              )}
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(v) => { setPassword(v); setError(null); }}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              invalid={!!error}
              minLength={mode === "signup" ? PASSWORD_MIN_LENGTH : undefined}
              describedBy={mode === "signup" ? "password-hint" : undefined}
            />
            {mode === "signup" && (
              <p id="password-hint" className="text-sm text-muted-foreground">Mindestens {PASSWORD_MIN_LENGTH} Zeichen.</p>
            )}
          </div>
        )}

        {error && (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-rosso">{error}</p>
            {unconfirmed && (
              <button
                type="button"
                onClick={() => handleResend(email, "signup")}
                disabled={loading || cooldown.remaining > 0}
                className="cap text-xs underline underline-offset-4 disabled:opacity-40"
              >
                {resendLabel("Bestätigungs-Mail erneut senden")}
              </button>
            )}
            {error === AUTH_MESSAGES.alreadyRegistered && (
              <button type="button" onClick={() => switchMode("login")} className="cap text-xs underline underline-offset-4">
                Zur Anmeldung
              </button>
            )}
          </div>
        )}

        {mode === "signup" && (
          <p className="text-sm text-muted-foreground">
            Mit der Registrierung {hasTerms ? (
              <>
                akzeptierst du unsere{" "}
                <Link to="/agb" className="text-nero underline underline-offset-4">AGB</Link> und bestätigst, dass du die{" "}
              </>
            ) : (
              "bestätigst du, dass du die "
            )}
            <Link to="/privacy" className="text-nero underline underline-offset-4">Datenschutzerklärung</Link> gelesen hast.
          </p>
        )}

        <Button type="submit" variant="dark" size="lg" className="w-full" disabled={loading}>
          {loading ? "Laden …" : mode === "signup" ? "Konto anlegen" : mode === "forgot" ? "Link senden" : "Anmelden"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        {mode !== "forgot" && (
          <>
            <div className="cap flex items-center gap-3 text-[11px] text-muted-foreground" aria-hidden>
              <span className="h-px flex-1 bg-nero" />
              oder
              <span className="h-px flex-1 bg-nero" />
            </div>

            <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
              <Chrome className="h-4 w-4" />
              {mode === "signup" ? "Mit Google registrieren" : "Mit Google anmelden"}
            </Button>
          </>
        )}
      </form>
    </AuthShell>
  );
};

export default Auth;
