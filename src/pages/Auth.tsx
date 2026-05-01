import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Lock, User, ArrowRight, Chrome } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Willkommen zurück!");
        navigate("/collection");
      }
    } else {
      if (password.length < 6) {
        toast.error("Passwort muss mindestens 6 Zeichen lang sein");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Registrierung erfolgreich! Bitte bestätige deine E-Mail.");
        navigate("/onboarding");
      }
    }
    setLoading(false);
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
              {isLogin ? "Willkommen zurück" : "Werde Sammler"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isLogin
                ? "Melde dich an, um deine Sammlung zu verwalten"
                : "Erstelle ein Konto und tausche Trikots mit anderen Sammlern"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-sm border border-border bg-card p-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Anzeigename</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Dein Sammlername"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                    maxLength={100}
                  />
                </div>
              </div>
            )}

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
              {loading ? "Laden..." : isLogin ? "Anmelden" : "Registrieren"}
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? "Noch kein Konto? Jetzt registrieren" : "Bereits ein Konto? Anmelden"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
