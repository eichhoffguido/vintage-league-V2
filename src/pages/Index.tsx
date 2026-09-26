import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TrustBanner from "@/components/TrustBanner";
import HomeHero, { type HomeStats } from "@/components/home/HomeHero";
import AlbumSection from "@/components/home/AlbumSection";
import DealerSection from "@/components/home/DealerSection";
import SwapStripe from "@/components/home/SwapStripe";
import CommunityBand from "@/components/home/CommunityBand";
import FaqSection from "@/components/home/FaqSection";
import { useAuth } from "@/hooks/useAuth";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { startCheckout } from "@/lib/checkout";

// Genug Angebote laden, damit die Kategorie-Chips auf der Startseite sinnvoll filtern können.
const FEATURED_POOL = 48;

const fetchFeaturedJerseys = async () => {
  const { data, error } = await supabase
    .from("user_jerseys")
    .select("*")
    .in("listing_type", ["buy_now", "both"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(FEATURED_POOL);

  if (error) throw error;
  return data || [];
};

const fetchStats = async (): Promise<HomeStats> => {
  const [jerseysRes, profilesRes, tradesRes] = await Promise.all([
    supabase
      .from("user_jerseys")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "verified")
      .is("deleted_at", null),
    supabase.from("profiles").select("*", { count: "exact", head: true }).is("deleted_at", null),
    // Hinweis: Gäste dürfen trade_requests nicht lesen → Zahl nur für eingeloggte Nutzer (öffentliche Kennzahl folgt mit CC-C1)
    supabase.from("trade_requests").select("*", { count: "exact", head: true }).eq("status", "completed"),
  ]);

  return {
    jerseys: jerseysRes.count || 0,
    profiles: profilesRes.count || 0,
    trades: tradesRes.count || 0,
  };
};

const fetchTradeCount = async (): Promise<number> => {
  const { count } = await supabase
    .from("user_jerseys")
    .select("*", { count: "exact", head: true })
    .in("listing_type", ["both", "trade_only"])
    .is("deleted_at", null);
  return count || 0;
};

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const content = useSiteContent("home");

  const { data: jerseys = [], isLoading } = useQuery({ queryKey: ["featured-jerseys", FEATURED_POOL], queryFn: fetchFeaturedJerseys });
  const { data: stats } = useQuery({ queryKey: ["homepage-stats"], queryFn: fetchStats });
  const { data: tradeCount } = useQuery({ queryKey: ["homepage-trade-count"], queryFn: fetchTradeCount });

  useEffect(() => {
    if (location.hash !== "#faq") return;
    // Einen Tick warten, bis Hero und Raster stehen — sonst landet der Sprung an der falschen Stelle.
    const timer = setTimeout(() => {
      document.getElementById("faq")?.scrollIntoView({ behavior: "auto" });
    }, 300);
    return () => clearTimeout(timer);
  }, [location.hash]);

  const handleQuickBuy = async (jerseyId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    try {
      await startCheckout({ jersey_id: jerseyId });
    } catch (err) {
      toast({
        title: "Kauf nicht möglich",
        description: err instanceof Error ? err.message : "Checkout konnte nicht gestartet werden.",
        variant: "destructive",
      });
    }
  };

  const goSell = () => navigate(user ? "/collection" : "/auth");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HomeHero content={content.hero} stats={stats} onSell={goSell} />
        <AlbumSection content={content.album} jerseys={jerseys} loading={isLoading} onQuickBuy={handleQuickBuy} />
        <div className="mt-14 md:mt-28">
          <TrustBanner />
        </div>
        <DealerSection content={content.dealer} />
        <SwapStripe content={content.swap} tradeCount={tradeCount} />
        <CommunityBand content={content.community} />
        <FaqSection content={content.faq} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
