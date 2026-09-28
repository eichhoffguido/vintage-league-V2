import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSiteContent } from "@/hooks/useSiteContent";
import { AUTH_MESSAGES, PASSWORD_MIN_LENGTH, authErrorFromUrl, authErrorMessage } from "@/lib/authErrors";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

// Abgelaufener/benutzter Link: Supabase hängt den Fehler an die Adresse — einmal beim Laden lesen.
const initialLinkError = authErrorFromUrl(window.location.hash, window.location.search);

/**
 * CC-D2 — Ziel des Links aus der Mail „Neues Passwort“. Supabase meldet den Nutzer über den Link an
 * (Ereignis PASSWORD_RECOVERY); hier setzt er das neue Passwort. Ohne Sitzung ist der Link ungültig.
 */
const AuthReset = () => {
  const { session, loading } = useAuth();
  const page = useSiteContent("auth");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(AUTH_MESSAGES.weakPassword);
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) {
      const message = authErrorMessage(err);
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("Dein neues Passwort ist gespeichert.");
    // "/" → ProfileGuard entscheidet zwischen Sammlung und Onboarding.
    navigate("/");
  };

  const linkInvalid = !loading && (initialLinkError !== null || !session);

  return (
    <AuthShell eyebrow={page.reset.eyebrow} headline={page.reset.headline} intro={<p>{page.reset.text}</p>}>
      {loading ? (
        <p className="cap text-xs text-muted-foreground" role="status">Link wird geprüft …</p>
      ) : linkInvalid ? (
        <div className="space-y-5" role="alert">
          <div className="cap text-rosso">Link ungültig</div>
          <h2 className="font-display text-2xl font-semibold normal-case tracking-[-0.02em] md:text-3xl">
            Dieser Link funktioniert nicht mehr.
          </h2>
          <p className="text-base leading-relaxed">{initialLinkError ?? AUTH_MESSAGES.linkExpired}</p>
          <Button asChild variant="dark" size="lg" className="w-full">
            <Link to="/auth?mode=forgot">
              Neuen Link anfordern <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="cap text-rosso">{page.reset.eyebrow}</div>
            <h2 className="mt-2 font-display text-2xl font-semibold normal-case tracking-[-0.02em] md:text-3xl">
              Neues Passwort festlegen.
            </h2>
            {session?.user.email && (
              <p className="mt-2 text-base text-muted-foreground">Für {session.user.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password" className="cap text-[11px]">Neues Passwort</Label>
            <PasswordInput
              id="new-password"
              value={password}
              onChange={(v) => { setPassword(v); setError(null); }}
              autoComplete="new-password"
              invalid={!!error}
              minLength={PASSWORD_MIN_LENGTH}
              describedBy="new-password-hint"
            />
            <p id="new-password-hint" className="text-sm text-muted-foreground">Mindestens {PASSWORD_MIN_LENGTH} Zeichen.</p>
          </div>

          {error && <p role="alert" className="text-sm text-rosso">{error}</p>}

          <Button type="submit" variant="dark" size="lg" className="w-full" disabled={saving}>
            {saving ? "Speichern …" : "Passwort speichern"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default AuthReset;
