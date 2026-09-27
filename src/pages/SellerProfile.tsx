import { useState, useEffect } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import SectionHeader from "@/components/layout/SectionHeader";
import JerseyCard from "@/components/JerseyCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Shirt } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { getPrimaryImage } from "@/utils/jerseyImage";
import { FavoriteTeamBadge } from "@/components/FavoriteTeamBadge";

type ProfileData = Tables<"profiles">;
type JerseyData = Tables<"user_jerseys">;
type RatingData = Tables<"trade_ratings">;

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
                ? "fill-giallo text-giallo"
                : "text-nero/20"
            }`}
          />
        ))}
      </div>
      <span className="num text-sm">{rating.toFixed(1)}</span>
    </div>
  );
};

const SellerProfile = () => {
  const page = useSiteContent("seller");
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [jerseys, setJerseys] = useState<JerseyData[]>([]);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [completedSalesCount, setCompletedSalesCount] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
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

      // Fetch user's jerseys (non-deleted, available for trade OR for sale)
      const { data: jerseysData, error: jerseysError } = await supabase
        .from("user_jerseys")
        .select("*")
        .eq("user_id", userId!)
        .or("available_for_trade.eq.true,sale_price_cents.not.is.null")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (jerseysError) throw jerseysError;

      setJerseys(jerseysData || []);

      // Fetch completed sales count
      const { data: salesData, error: salesError } = await supabase
        .from("sales_history")
        .select("id", { count: "exact" })
        .eq("seller_user_id", userId!);

      if (!salesError) {
        setCompletedSalesCount(salesData?.length || 0);
      }

      // Fetch ratings for this user (as rated_user_id)
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("trade_ratings")
        .select("*")
        .eq("rated_user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!ratingsError && ratingsData) {
        setRatings(ratingsData);

        // Calculate average rating
        if (ratingsData.length > 0) {
          const sum = ratingsData.reduce((acc, r) => acc + r.rating, 0);
          setAverageRating(sum / ratingsData.length);
        }
      }
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
        <section className="nero-stripe">
          <div className="container mx-auto px-4 py-12 md:px-10 md:py-20">
            <Skeleton className="h-3 w-40 bg-avorio/20" />
            <Skeleton className="mt-4 h-12 w-2/3 bg-avorio/20 md:h-20" />
            <div className="mt-8 flex gap-5">
              <Skeleton className="h-20 w-20 shrink-0 rounded-full bg-avorio/20 md:h-24 md:w-24" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-2/3 bg-avorio/20" />
                <Skeleton className="h-4 w-1/2 bg-avorio/20" />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full bg-avorio/20" />
              ))}
            </div>
          </div>
        </section>
        <div className="container mx-auto px-4 py-10 md:px-10 md:py-16">
          <div className="grid grid-cols-2 gap-2.5 md:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5]" />
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
        <div className="container mx-auto px-4 py-10 md:px-10 md:py-16">
          <Button variant="ghost" className="-ml-3 mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Button>
          <div className="border-2 border-nero bg-card px-6 py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-rosso" />
            <p className="font-display text-lg font-semibold">Profil nicht gefunden</p>
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

      <div className="container mx-auto px-4 py-2 md:px-10 md:py-3">
        <Button variant="ghost" className="-ml-3" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
      </div>

      {/* Öffentliches Profil → schwarzes Kopfband (Skill cc-design §5.1) */}
      <PageHeader
        tone="nero"
        eyebrow={page.eyebrow}
        title={profile.display_name || "Sammler"}
        className="[&_h1]:break-words"
      >
        <div className="flex items-start gap-4 md:gap-6">
          <Avatar className="h-20 w-20 shrink-0 rounded-full border border-avorio/60 md:h-24 md:w-24">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="rounded-full bg-sabbia font-display text-xl font-bold text-nero">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            {profile.bio && (
              <p className="max-w-2xl text-avorio/85">{profile.bio}</p>
            )}
            <FavoriteTeamBadge team={profile.favorite_team} className={profile.bio ? "mt-3" : undefined} />
          </div>
        </div>

        {/* Stats */}
        <dl className="mt-8 grid grid-cols-2 border-t border-avorio/35 md:grid-cols-4">
          <div className="border-b border-avorio/35 py-4 pr-3 md:border-b-0 md:py-5">
            <dt className="cap text-[11px] text-avorio/70">Bewertung</dt>
            <dd className="mt-2">
              {averageRating !== null ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(averageRating)
                            ? "fill-giallo text-giallo"
                            : "text-avorio/25"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="num text-2xl leading-none">{averageRating.toFixed(1)}</span>
                  <span className="num text-sm text-avorio/70">({ratings.length})</span>
                </div>
              ) : (
                <p className="text-sm text-avorio/70">{page.reviews.none}</p>
              )}
            </dd>
          </div>
          <div className="border-b border-l border-avorio/35 py-4 pl-4 md:border-b-0 md:py-5">
            <dt className="cap text-[11px] text-avorio/70">Abgeschlossene Tausche</dt>
            <dd className="num mt-2 text-[30px] leading-none md:text-[38px]">{completedSalesCount}</dd>
          </div>
          <div className="py-4 pr-3 md:border-l md:border-avorio/35 md:py-5 md:pl-4">
            <dt className="cap text-[11px] text-avorio/70">Trikots</dt>
            <dd className="num mt-2 text-[30px] leading-none md:text-[38px]">{jerseys.length}</dd>
          </div>
          <div className="border-l border-avorio/35 py-4 pl-4 md:py-5">
            <dt className="cap text-[11px] text-avorio/70">Beigetreten</dt>
            <dd className="num mt-2 text-[30px] leading-none md:text-[38px]">
              {new Date(profile.created_at).toLocaleDateString("de-DE", {
                year: "numeric",
                month: "short",
              })}
            </dd>
          </div>
        </dl>
      </PageHeader>

      <div className="container mx-auto px-4 py-10 md:px-10 md:py-16">
        {/* Jerseys Section */}
        <SectionHeader
          className="mb-6 border-b border-nero pb-5 md:mb-8"
          size="md"
          eyebrow={page.jerseys.eyebrow}
          headline={page.jerseys.headline}
          subline={`${jerseys.length} verfügbar`}
        />

        {jerseys.length === 0 ? (
          <div className="border-2 border-nero bg-card px-6 py-12 text-center">
            <Shirt className="mx-auto mb-4 h-10 w-10" />
            <p className="font-display text-lg font-semibold">
              {page.jerseys.empty}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 md:gap-6 lg:grid-cols-4">
            {jerseys.map((jersey) => (
              <JerseyCard
                key={jersey.id}
                id={jersey.id}
                name={jersey.name}
                team={jersey.team}
                league={jersey.league}
                year={jersey.year}
                price_cents={jersey.price_cents ?? 0}
                imageUrl={getPrimaryImage(jersey) ?? undefined}
                verification_status={jersey.verification_status as "pending" | "verified" | "rejected" | undefined}
                condition={jersey.condition as 1 | 2 | 3 | 4 | 5}
                size={jersey.size}
                user_id={jersey.user_id}
                sale_price_cents={jersey.sale_price_cents ?? undefined}
                available_for_trade={jersey.available_for_trade ?? false}
                listing_type={jersey.listing_type ?? undefined}
                onClick={() => navigate(`/jersey/${jersey.id}`)}
              />
            ))}
          </div>
        )}

        {/* Ratings Section */}
        {ratings.length > 0 && (
          <>
            <SectionHeader
              className="mb-6 mt-14 md:mb-8 md:mt-20"
              size="md"
              eyebrow={page.reviews.eyebrow}
              headline={page.reviews.headline}
              subline={`Letzte ${ratings.length} Bewertungen`}
            />
            <ul className="border-t border-nero">
              {ratings.map((rating) => (
                <li key={rating.id} className="border-b border-nero py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= rating.rating
                              ? "fill-giallo text-giallo"
                              : "text-nero/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="num text-sm text-muted-foreground">
                      {new Date(rating.created_at).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">{rating.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SellerProfile;
