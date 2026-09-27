import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { rememberPostLoginPath } from "@/utils/postLoginRedirect";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Lock, ArrowRight, Chrome } from "lucide-react";

// Email/password signup is parked for the private beta (no verified sender
// domain yet for confirmation mails) — only login stays available here.
// useAuth().signUp is kept in the hook, intentionally unused for now.
const LOGIN_ERROR_MESSAGE = "E-Mail oder Passwort ist falsch.";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ?next=/community → nach Login (und ggf. Onboarding-Prüfung) dorthin zurück
  useEffect(() => {
    rememberPostLoginPath(searchParams.get("next"));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        // Same message for "email unknown" and "wrong password" on purpose
        // (don't leak which one it was).
        setLoginError(LOGIN_ERROR_MESSAGE);
        toast.error(LOGIN_ERROR_MESSAGE);
      } else {
        toast.success("Willkommen zurück!");
        // Navigate to "/" so ProfileGuard decides collection vs. onboarding.
        navigate("/");
      }
    } catch {
      setLoginError(LOGIN_ERROR_MESSAGE);
      toast.error(LOGIN_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message || "Google-Login fehlgeschlagen");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Verde-Split (Skill cc-design §5.1): Begrüßung links, Formular rechts auf Avorio */}
      <main className="border-b border-nero lg:grid lg:min-h-[720px] lg:grid-cols-2">
        <section className="relative overflow-hidden bg-verde px-4 py-10 text-avorio md:px-10 md:py-16 lg:flex lg:flex-col lg:justify-between lg:px-16 lg:py-20">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-[84px] h-[190px] w-[190px] rounded-full bg-giallo lg:-bottom-[190px] lg:-right-[150px] lg:top-auto lg:h-[440px] lg:w-[440px]" />
          <div aria-hidden className="pointer-events-none absolute right-8 top-8 hidden h-[110px] w-[110px] rounded-full border-2 border-avorio opacity-55 lg:block" />
          <div className="cap relative text-avorio/75">Bentornato · Anmelden</div>
          <h1 className="display relative mt-4 text-[44px] leading-[0.86] md:text-[80px] lg:text-[clamp(56px,5.2vw,80px)]">
            Willkommen{" "}
            <span className="hollow block" style={{ "--fill": "hsl(var(--verde))" } as CSSProperties}>
              zurück.
            </span>
          </h1>
          <ul className="relative mt-6 max-w-sm space-y-2 text-base text-avorio/85 md:mt-8 md:text-lg">
            <li>Deine Sammlung verwalten und Trikots einstellen.</li>
            <li>Merkliste, Gebote und Tauschanfragen im Blick.</li>
            <li>Mit der Community Wissen teilen.</li>
          </ul>
        </section>

        <section className="flex items-center px-4 py-10 md:px-10 md:py-16 lg:px-16">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
            <div>
              <div className="cap text-rosso">Accesso · Login</div>
              <h2 className="mt-2 font-display text-2xl font-semibold normal-case tracking-[-0.02em] md:text-3xl">
                Melde dich an, um deine Sammlung zu verwalten.
              </h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="cap text-[11px]">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="deine@email.de"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLoginError(null); }}
                  className={loginError ? "h-12 border-rosso pl-10" : "h-12 pl-10"}
                  required
                  maxLength={255}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="cap text-[11px]">Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(null); }}
                  className={loginError ? "h-12 border-rosso pl-10" : "h-12 pl-10"}
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {loginError && (
              <p role="alert" className="text-sm text-rosso">
                {loginError}
              </p>
            )}

            <Button type="submit" variant="dark" size="lg" className="w-full" disabled={loading}>
              {loading ? "Laden …" : "Anmelden"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="cap flex items-center gap-3 text-[11px] text-muted-foreground" aria-hidden>
              <span className="h-px flex-1 bg-nero" />
              oder
              <span className="h-px flex-1 bg-nero" />
            </div>

            <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
              <Chrome className="h-4 w-4" />
              Mit Google anmelden
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Registrierung aktuell über Google — weitere Optionen folgen.
            </p>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
