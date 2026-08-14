import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        // Same message for "email unknown" and "wrong password" on purpose
        // (don't leak which one it was).
        toast.error("E-Mail oder Passwort ist falsch.");
      } else {
        toast.success("Willkommen zurück!");
        // Navigate to "/" so ProfileGuard decides collection vs. onboarding.
        navigate("/");
      }
    } catch {
      toast.error("E-Mail oder Passwort ist falsch.");
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
      <div className="container mx-auto flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl font-bold">
              Willkommen zurück
            </h1>
            <p className="mt-2 text-muted-foreground">
              Melde dich an, um deine Sammlung zu verwalten
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-sm border border-border bg-card p-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="deine@email.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  maxLength={255}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full uppercase tracking-wider" disabled={loading}>
              {loading ? "Laden..." : "Anmelden"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">oder</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Mit Google anmelden
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Registrierung aktuell über Google — weitere Optionen folgen.
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
