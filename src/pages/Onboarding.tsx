import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Shirt, Users, TrendingUp, Plus } from "lucide-react";

type Step = "welcome" | "profile" | "complete";

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return null;
  }

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast.error("Bitte gib einen Anzeigenamen ein");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profil aktualisiert!");
      setStep("complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fehler beim Aktualisieren des Profils";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipProfile = () => {
    setStep("complete");
  };

  const handleNavigateToCollection = () => {
    navigate("/collection");
  };

  const handleNavigateToProfile = () => {
    navigate("/profile");
  };

  // Welcome Step
  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-2xl">
            <div className="mb-12 text-center">
              <h1 className="font-display text-5xl font-bold">
                Willkommen bei VintageLeague!
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Die Community-erste Plattform für den Handel mit Vintage-Fußballtrikots
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-sm border border-border bg-card p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Shirt className="h-12 w-12 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold">Deine Sammlung</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Katalogisiere deine Lieblings-Trikots und verwalte deine Sammlung
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-sm border border-border bg-card p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold">Community</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Verbinde dich mit anderen Sammlern und tausche Trikots
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-sm border border-border bg-card p-6 text-center">
                <div className="flex justify-center mb-4">
                  <TrendingUp className="h-12 w-12 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold">Marktplatz</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Entdecke Trikots von anderen Sammlern im Marktplatz
                </p>
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              <Button
                variant="hero"
                className="flex-1 uppercase tracking-wider"
                onClick={() => setStep("profile")}
              >
                Profil erstellen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="flex-1 uppercase tracking-wider"
                onClick={() => setStep("complete")}
              >
                Überspringen
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Profile Step
  if (step === "profile") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="font-display text-4xl font-bold">
                Erstelle dein Profil
              </h1>
              <p className="mt-2 text-muted-foreground">
                Lass die Community wissen, wer du bist
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProfile();
              }}
              className="space-y-4 rounded-sm border border-border bg-card p-6"
            >
              <div className="space-y-2">
                <Label htmlFor="displayName">Anzeigename</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="z.B. Jersey Collector 92"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Dieser Name ist für andere Sammlern sichtbar
                </p>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full uppercase tracking-wider"
                disabled={isLoading}
              >
                {isLoading ? "Wird gespeichert..." : "Profil erstellen"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full uppercase tracking-wider"
                onClick={handleSkipProfile}
                disabled={isLoading}
              >
                Überspringen
              </Button>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Complete Step
  if (step === "complete") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-md text-center">
            <div className="mb-8">
              <h1 className="font-display text-4xl font-bold">
                Du bist dabei!
              </h1>
              <p className="mt-2 text-muted-foreground">
                Dein VintageLeague-Konto ist ready. Jetzt geht's los!
              </p>
            </div>

            <div className="rounded-sm border border-border bg-card p-8 mb-6">
              <p className="text-muted-foreground mb-6">
                Was möchtest du als nächstes tun?
              </p>
              <div className="space-y-3">
                <Button
                  variant="hero"
                  className="w-full uppercase tracking-wider"
                  onClick={handleNavigateToCollection}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Erstes Trikot hinzufügen
                </Button>
                <Button
                  variant="outline"
                  className="w-full uppercase tracking-wider"
                  onClick={handleNavigateToProfile}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Mein Profil bearbeiten
                </Button>
                <Button
                  variant="ghost"
                  className="w-full uppercase tracking-wider"
                  onClick={() => navigate("/")}
                >
                  Zur Startseite
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Du kannst jederzeit zur Registerkarte „Profil" gehen und deine Informationen aktualisieren.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return null;
};

export default Onboarding;
