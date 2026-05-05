import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { supabase } from "@/integrations/supabase/client";
import { formatEuros } from "@/utils/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Shirt } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ProfileData = Tables<"profiles">;
type JerseyData = Tables<"user_jerseys">;

const conditionLabels: Record<number, string> = {
  5: "Neuwertig",
  4: "Sehr gut",
  3: "Gut erhalten",
  2: "Gebraucht",
  1: "Sammlerstück",
};

const StarRating = ({ rating }: { rating: number | null }) => {
  if (rating === null) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

const SellerProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [jerseys, setJerseys] = useState<JerseyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchProfileAndJerseys();
    }
  }, [userId]);

  const fetchProfileAndJerseys = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      // Fetch user's jerseys (only non-deleted, available for trade)
      const { data: jerseysData, error: jerseysError } = await supabase
        .from("user_jerseys")
        .select("*")
        .eq("user_id", userId!)
        .eq("available_for_trade", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (jerseysError) throw jerseysError;

      setJerseys(jerseysData || []);
    } catch (err: any) {
      setError(err.message || "Profile konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <EmailVerificationBanner />
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <Skeleton className="h-10 w-40 mb-4" />
          </div>
          <div className="rounded-sm border border-border bg-card p-8 mb-12">
            <div className="flex gap-6">
              <Skeleton className="h-20 w-20 rounded-sm" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <div className="grid gap-4 sm:grid-cols-4 mt-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-sm" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <EmailVerificationBanner />
        <div className="container mx-auto px-4 py-12">
          <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
          </Button>
          <div className="rounded-sm border border-dashed border-border p-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive/30" />
            <p className="font-display text-xl text-muted-foreground">Profil nicht gefunden</p>
            <p className="mt-2 text-sm text-muted-foreground">{error || "Das angeforderte Profil existiert nicht."}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const initials = (profile.display_name || profile.id || "S")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const totalValue = jerseys.reduce((sum, jersey) => sum + (jersey.price_cents || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <EmailVerificationBanner />
      <div className="container mx-auto px-4 py-12">
        <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>

        {/* Profile Section */}
        <div className="mb-12 rounded-sm border border-border bg-card p-8">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20 rounded-sm">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="rounded-sm bg-secondary text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="font-display text-4xl font-bold">
                {profile.display_name || "Sammler"}
              </h1>
              {profile.bio && (
                <p className="mt-3 max-w-2xl text-muted-foreground">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bewertung</p>
                  <div className="mt-2">
                    <StarRating rating={profile.average_rating} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trikots zum Tausch</p>
                  <p className="font-display text-2xl font-bold">{jerseys.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gesamtwert</p>
                  <p className="font-display text-2xl font-bold">{formatEuros(totalValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Beigetreten</p>
                  <p className="font-display text-2xl font-bold">
                    {new Date(profile.created_at).toLocaleDateString("de-DE", {
                      year: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jerseys Section */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold">Zum Tausch verfügbar</h2>
          <p className="mt-1 text-muted-foreground">{jerseys.length} Trikots</p>
        </div>

        {jerseys.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-12 text-center">
            <Shirt className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-display text-xl text-muted-foreground">
              Dieser Sammler hat noch keine Trikots zum Tausch verfügbar
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {jerseys.map((jersey) => (
              <div
                key={jersey.id}
                className="overflow-hidden rounded-sm border border-border bg-card cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/jersey/${jersey.id}`)}
              >
                {jersey.image_url ? (
                  <div className="aspect-square overflow-hidden bg-secondary">
                    <img src={jersey.image_url} alt={jersey.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-secondary">
                    <span className="font-display text-4xl text-muted-foreground/30">{jersey.team.charAt(0)}</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{jersey.league} · {jersey.year}</p>
                      <h3 className="font-display text-lg font-semibold">{jersey.team}</h3>
                      <p className="text-sm text-muted-foreground">{jersey.name}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{jersey.condition}/5 · {conditionLabels[jersey.condition]}</span>
                    {jersey.price_cents && <span className="font-semibold text-foreground">{formatEuros(jersey.price_cents)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SellerProfile;
