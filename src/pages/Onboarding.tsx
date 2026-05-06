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

type Step = "welcome" | "profile" | "favorite" | "add-jersey";

interface OnboardingState {
  displayName: string;
  favoriteTeam: string;
}

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [formData, setFormData] = useState<OnboardingState>({
    displayName: "",
    favoriteTeam: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const currentStepNumber = {
    welcome: 1,
    profile: 2,
    favorite: 3,
    "add-jersey": 4,
  }[step];

  const totalSteps = 4;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user && !authLoading) {
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.display_name) {
            navigate("/collection");
          }
          setCheckingProfile(false);
        });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user || checkingProfile) {
    return null;
  }

  const handleUpdateProfile = async () => {
    if (!formData.displayName.trim()) {
      toast.error("Bitte gib einen Anzeigenamen ein");
      return;
    }

    setIsLoading(true);
    try {
      // Use upsert so this works even if the OAuth trigger didn't create
      // the profile row yet (handle_new_user may have silently failed).
      // This will INSERT if the profile doesn't exist, or UPDATE if it does.
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, display_name: formData.displayName.trim() },
          { onConflict: "id" }
        )
        .select();

      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Profil konnte nicht aktualisiert werden");
      }

      toast.success("Profil aktualisiert!");
      setStep("favorite");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fehler beim Aktualisieren des Profils";
      console.error("handleUpdateProfile error:", message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipStep = () => {
    if (step === "profile") setStep("favorite");
    else if (step === "favorite") setStep("add-jersey");
  };

  const handleNavigateToAddJersey = () => {
    navigate("/collection", { state: { openAddJerseyDialog: true } });
  };

  const handleNavigateToCollection = () => {
    navigate("/collection");
  };

  const ProgressIndicator = () => (
    <div className="mb-8 text-center">
      <p className="text-sm text-muted-foreground">
        Schritt {currentStepNumber} von {totalSteps}
      </p>
      <div className="mt-3 flex gap-2 justify-center">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-8 rounded-full ${
              i < currentStepNumber ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>
    </div>
  );

  // Welcome Step
  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-2xl">
            <ProgressIndicator />

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
                Los geht's
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="flex-1 uppercase tracking-wider"
                onClick={() => setStep("add-jersey")}
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
            <ProgressIndicator />

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
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, displayName: e.target.value }))
                  }
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
                {isLoading ? "Wird gespeichert..." : "Weiter"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full uppercase tracking-wider"
                onClick={handleSkipStep}
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

  // Favorite Team Step
  if (step === "favorite") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-md">
            <ProgressIndicator />

            <div className="mb-8 text-center">
              <h1 className="font-display text-4xl font-bold">
                Dein Lieblingsverein
              </h1>
              <p className="mt-2 text-muted-foreground">
                Welcher Verein oder Liga ist dein Favorit? (optional)
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep("add-jersey");
              }}
              className="space-y-4 rounded-sm border border-border bg-card p-6"
            >
              <div className="space-y-2">
                <Label htmlFor="favoriteTeam">Lieblingsverein oder Liga</Label>
                <Input
                  id="favoriteTeam"
                  type="text"
                  placeholder="z.B. Bayern München, Champions League"
                  value={formData.favoriteTeam}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, favoriteTeam: e.target.value }))
                  }
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Du kannst dies später jederzeit in deinem Profil ändern
                </p>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full uppercase tracking-wider"
              >
                Weiter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full uppercase tracking-wider"
                onClick={handleSkipStep}
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

  // Add Jersey Step
  if (step === "add-jersey") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-md text-center">
            <ProgressIndicator />

            <div className="mb-12">
              <Shirt className="mx-auto mb-4 h-16 w-16 text-primary" />
              <h1 className="font-display text-4xl font-bold">
                Deine Sammlung
              </h1>
              <p className="mt-4 text-muted-foreground">
                Möchtest du gleich dein erstes Trikot hinzufügen?
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="hero"
                className="w-full uppercase tracking-wider"
                onClick={handleNavigateToAddJersey}
              >
                <Plus className="mr-2 h-4 w-4" />
                Trikot hinzufügen
              </Button>
              <Button
                variant="outline"
                className="w-full uppercase tracking-wider"
                onClick={handleNavigateToCollection}
              >
                Später
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return null;
};

export default Onboarding;
