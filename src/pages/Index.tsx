import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, TrendingUp, Award, ShieldCheck, ArrowLeftRight, MessageSquare, Wrench, BookOpen, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JerseyCard from "@/components/JerseyCard";
import CategoryFilter from "@/components/CategoryFilter";
import TrustBanner from "@/components/TrustBanner";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getPrimaryImage } from "@/utils/jerseyImage";
import heroImage from "@/assets/hero-jersey.jpg";
import heroCollectibles from "@/assets/hero-collectibles.jpg";
import heroRarity from "@/assets/hero-rarity.jpg";

const fetchFeaturedJerseys = async () => {
  const { data, error } = await supabase
    .from("user_jerseys")
    .select("*")
    .in("listing_type", ["buy_now", "both"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) throw error;
  return data || [];
};

const fetchStats = async () => {
  const [jerseysRes, profilesRes, tradesRes] = await Promise.all([
    supabase
      .from("user_jerseys")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "verified")
      .is("deleted_at", null),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("trade_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),
  ]);

  return {
    jerseys: jerseysRes.count || 0,
    profiles: profilesRes.count || 0,
    trades: tradesRes.count || 0,
  };
};

const heroSlides = [
  {
    image: heroImage,
    badge: "AUTHENTISCHE SAMMLERSTÜCKE",
    headline: "Legendäre",
    headlineAccent: "Trikots",
    description: "Entdecke authentische Fußballtrikots — von seltenen Retro-Klassikern bis zu limitierten Editionen. Jedes Stück zertifiziert und mit Geschichte.",
  },
  {
    image: heroCollectibles,
    badge: "KURATIERTE KOLLEKTION",
    headline: "Historische",
    headlineAccent: "Sammlerstücke",
    description: "Memorabilia aus den goldenen Ären des Fußballs — Schals, Programme, Medaillen und mehr. Jedes Stück ein Zeugnis großer Momente.",
  },
  {
    image: heroRarity,
    badge: "EXKLUSIVE RARITÄTEN",
    headline: "Unvergessene",
    headlineAccent: "Raritäten",
    description: "Einzigartige Fundstücke, die Geschichte geschrieben haben — museumsreif präsentiert und für wahre Kenner kuratiert.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Was ist Vintage League?",
    answer: "Ein Marktplatz von Sammlern für Sammler: authentische Vintage-Fußballtrikots kaufen, verkaufen, tauschen — mit Community und Preistransparenz.",
  },
  {
    question: "Wie funktioniert das Kaufen?",
    answer: "Trikot finden, \"Sofort kaufen\" oder ein Gebot abgeben. Der Verkäufer nimmt an — bezahlt wird sicher über unseren Zahlungspartner.",
  },
  {
    question: "Wie funktioniert das Tauschen?",
    answer: "Trikots mit \"Tauschbar\"-Badge kannst du gegen ein Trikot aus deiner Sammlung anfragen. Der Besitzer entscheidet.",
  },
  {
    question: "Was bedeutet die Prüfung?",
    answer: "Eingestellte Trikots werden von uns geprüft; verifizierte Stücke tragen ein Badge. So bleibt der Marktplatz vertrauenswürdig.",
  },
  {
    question: "Wie wird der Marktwert ermittelt?",
    answer: "Aus über 22.000 Referenzpreisen vergleichbarer Trikots. Die Skala dient der Einordnung — den Verkaufspreis bestimmst du selbst.",
  },
  {
    question: "Was kostet die Nutzung?",
    answer: "Registrieren, sammeln und stöbern ist kostenlos. Beim Verkauf fällt eine Transaktionsgebühr über den Zahlungsanbieter an.",
  },
  {
    question: "Wie verkaufe ich ein Trikot?",
    answer: "In deiner Sammlung anlegen, Fotos hochladen, \"Zum Verkauf\" aktivieren, Preis setzen — fertig.",
  },
  {
    question: "Wie sicher sind meine Daten?",
    answer: "Hosting in der EU (Frankfurt), DSGVO-konform. Details in der Datenschutzerklärung.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSlide, setActiveSlide] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [heroSearch, setHeroSearch] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = heroSearch.trim();
    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  };

  const { data: jerseys = [], isLoading } = useQuery({
    queryKey: ["featured-jerseys"],
    queryFn: fetchFeaturedJerseys,
  });

  const { data: stats } = useQuery({
    queryKey: ["homepage-stats"],
    queryFn: fetchStats,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (location.hash !== "#faq") return;
    // Delay one tick so layout (hero slides, featured jerseys) has settled —
    // scrolling immediately on mount lands at the wrong offset.
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
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { jersey_id: jerseyId, buyer_id: user.id },
      });
      if (error) throw error;
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Checkout konnte nicht gestartet werden", variant: "destructive" });
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <EmailVerificationBanner />

      {/* Hero */}
      <section className="grain relative overflow-hidden min-h-[70vh] flex items-center">
        {/* Slide backgrounds */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${slide.image})`,
              opacity: activeSlide === index ? 1 : 0,
            }}
          />
        ))}
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
        {/* Vintage decorative lines */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-sm border border-primary/30 bg-primary/10 px-4 py-1.5">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-display text-xs tracking-[0.15em] text-primary transition-opacity duration-500">
                {heroSlides[activeSlide].badge}
              </span>
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight md:text-7xl">
              <span key={`headline-${activeSlide}`} className="inline-block animate-fade-in">
                {heroSlides[activeSlide].headline}{" "}
              </span>
              <span key={`accent-${activeSlide}`} className="text-gradient inline-block animate-fade-in">
                {heroSlides[activeSlide].headlineAccent}
              </span>
            </h1>
            <p key={`desc-${activeSlide}`} className="mt-4 font-serif text-lg italic text-muted-foreground md:text-xl animate-fade-in">
              {heroSlides[activeSlide].description}
            </p>
            <form onSubmit={handleHeroSearch} className="mt-8 flex max-w-md gap-2">
              <Input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Trikot, Verein, Spieler…"
                aria-label="Trikots durchsuchen"
                className="h-12 border-primary/30 bg-background/80 backdrop-blur-sm text-base"
              />
              <Button type="submit" variant="hero" size="lg" className="shrink-0 px-4" aria-label="Suchen">
                <Search className="h-5 w-5" />
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-4">
              <Button variant="hero" size="lg" className="uppercase tracking-wider" onClick={() => navigate("/trade")}>
                Kollektion entdecken
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-primary/30 font-semibold uppercase tracking-wider hover:bg-primary/10" onClick={() => navigate(user ? "/collection" : "/auth")}>
                Trikot verkaufen
              </Button>
            </div>

            {/* Stats */}
             <div className="mt-14 flex gap-8 md:gap-12">
               <div>
                 <p className="font-display text-2xl font-bold text-primary md:text-3xl">
                   {stats?.jerseys?.toLocaleString() || "..."}
                 </p>
                 <p className="text-xs text-muted-foreground md:text-sm">Zertifizierte Trikots</p>
               </div>
               <div>
                 <p className="font-display text-2xl font-bold text-primary md:text-3xl">
                   {stats?.profiles?.toLocaleString() || "..."}
                 </p>
                 <p className="text-xs text-muted-foreground md:text-sm">Sammler & Händler</p>
               </div>
               <div>
                 <p className="font-display text-2xl font-bold text-primary md:text-3xl">
                   {stats?.trades?.toLocaleString() || "..."}
                 </p>
                 <p className="text-xs text-muted-foreground md:text-sm">Erfolgreiche Trades</p>
               </div>
             </div>

            {/* Slide indicators */}
            <div className="mt-8 flex gap-2">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    activeSlide === index
                      ? "w-8 bg-primary"
                      : "w-4 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-px w-6 bg-primary/50" />
                <span className="font-display text-xs tracking-[0.2em] text-primary">NEUESTE FUNDSTÜCKE</span>
              </div>
              <h2 className="font-display text-3xl font-bold md:text-5xl">
                Aktuelle <span className="text-gradient">Kollektion</span>
              </h2>
              <p className="mt-2 font-serif italic text-muted-foreground">
                Handverlesene Trikots — frisch kuratiert für Sammler
              </p>
            </div>
            <Button variant="ghost" className="self-start text-primary uppercase tracking-wider md:self-auto" onClick={() => navigate("/trade")}>
              Alle anzeigen <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <CategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <JerseyCardSkeleton />
                  </div>
                ))
              : jerseys.map((jersey: any, index) => (
                  <div
                    key={jersey.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <JerseyCard
                      id={jersey.id}
                      name={jersey.name}
                      team={jersey.team}
                      league={jersey.league}
                      year={jersey.year}
                      price_cents={jersey.price_cents}
                      imageUrl={getPrimaryImage(jersey) ?? undefined}
                      verified={jersey.verification_status === "verified"}
                      condition={jersey.condition as 1 | 2 | 3 | 4 | 5}
                      size={jersey.size}
                      user_id={jersey.user_id}
                      sale_price_cents={jersey.sale_price_cents}
                      listing_type={jersey.listing_type}
                      onClick={() => navigate(`/jersey/${jersey.id}`)}
                      onQuickBuy={() => handleQuickBuy(jersey.id)}
                    />
                  </div>
                ))}
          </div>
        </div>
      </section>

      <TrustBanner />

      {/* Händler Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-2 flex items-center justify-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-display text-xs tracking-[0.2em] text-primary">FÜR HÄNDLER</span>
          </div>
          <h2 className="text-center font-display text-3xl font-bold md:text-5xl">
            Deine Bühne für{" "}
            <span className="text-gradient">besondere Trikots</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center font-serif italic text-muted-foreground">
            Präsentiere deine Raritäten einer leidenschaftlichen Community — in einem Umfeld, das Qualität und Authentizität in den Mittelpunkt stellt.
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-2 md:items-start">
            {/* Jersey Image */}
            <div className="hidden md:block w-full">
              <img
                src="/images/mood-haendler.jpg"
                alt="Händler mood image"
                className="w-full aspect-[4/3] rounded-lg object-cover shadow-lg"
              />
            </div>

            {/* Feature Cards */}
            <div className="grid gap-6 md:grid-cols-1">
              {[
                {
                  icon: <Award className="h-6 w-6" />,
                  title: "Reichweite & Community",
                  desc: "Erreiche tausende verifizierte Sammler und Liebhaber, die echtes Interesse an deinen Stücken haben.",
                },
                {
                  icon: <ShieldCheck className="h-6 w-6" />,
                  title: "Zertifizierung & Vertrauen",
                  desc: "Professionelle Echtheitsverifikation und ein verifiziertes Händler-Siegel stärken das Vertrauen deiner Käufer.",
                },
                {
                  icon: <TrendingUp className="h-6 w-6" />,
                  title: "Präsentation & Tools",
                  desc: "Hochwertige Produktpräsentation, Händler-Dashboard und detaillierte Verkaufsstatistiken für deinen Erfolg.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-sm border border-border bg-card p-6 text-center transition-colors hover:border-primary/30 md:text-left">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:mx-0">
                    {item.icon}
                  </div>
                  <h3 className="font-display text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="hero" size="lg" className="uppercase tracking-wider" onClick={() => window.location.href = "/auth"}>
              Händler werden
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="border-primary/30 font-semibold uppercase tracking-wider hover:bg-primary/10" onClick={() => window.location.href = "/collection"}>
              Kollektion ansehen
            </Button>
          </div>
        </div>
      </section>

      {/* Trade CTA Section */}
      <section className="grain relative border-y border-border bg-secondary/30 py-16 md:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <span className="font-display text-xs tracking-[0.2em] text-primary">TRIKOTTAUSCH</span>
          </div>
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Tausche Trikots{" "}
            <span className="text-gradient">mit anderen Sammlern</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-serif italic text-muted-foreground">
            Der klassische Trikottausch — digital. Finde Sammler mit den Raritäten, die dir fehlen,
            und biete deine eigenen Schätze zum Tausch an.
          </p>
          {/* Jersey Images with Glow */}
          <div className="mt-8 max-w-xl mx-auto">
            <img
              src="/images/mood-tausch.jpg"
              alt="Tausch mood image"
              className="w-full aspect-[16/9] rounded-lg border border-primary/30 object-cover shadow-lg"
              style={{ boxShadow: "0 0 30px hsl(142 72% 40% / 0.2)" }}
            />
          </div>
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="hero" size="lg" className="uppercase tracking-wider" onClick={() => navigate("/shop?tradeable=true")}>
              <ArrowLeftRight className="mr-2 h-5 w-5" />
              Tauschbörse entdecken
            </Button>
            <Button variant="outline" size="lg" className="border-primary/30 font-semibold uppercase tracking-wider hover:bg-primary/10" onClick={() => window.location.href = "/auth"}>
              Jetzt registrieren
            </Button>
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="mb-2 flex items-center gap-2 md:justify-start">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="font-display text-xs tracking-[0.2em] text-primary">COMMUNITY</span>
              </div>
              <h2 className="font-display text-3xl font-bold md:text-5xl md:text-left">
                Wissen teilen,{" "}
                <span className="text-gradient">voneinander lernen</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg font-serif italic text-muted-foreground md:mx-0 md:text-left">
                Restaurierung, Pflege, Echtheitsprüfung — unsere Community teilt ihr Expertenwissen rund um Vintage Trikots.
              </p>
              <div className="mt-10 grid gap-6 md:grid-cols-1">
                {[
                  { icon: <Wrench className="h-6 w-6" />, title: "Restaurierung", desc: "Anleitungen und Tipps zur fachgerechten Restaurierung von Vintage Trikots." },
                  { icon: <ShieldCheck className="h-6 w-6" />, title: "Echtheitsprüfung", desc: "Lerne, Originale von Fälschungen zu unterscheiden — mit Experten-Tipps." },
                  { icon: <BookOpen className="h-6 w-6" />, title: "Pflege & Lagerung", desc: "So bewahrst du deine Sammlerstücke für die Ewigkeit auf." },
                ].map((item) => (
                  <div key={item.title} className="rounded-sm border border-border bg-card p-6 text-center transition-colors hover:border-primary/30 md:text-left">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:mx-0">
                      {item.icon}
                    </div>
                    <h3 className="font-display text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center md:text-left">
                <Button variant="hero" size="lg" className="uppercase tracking-wider" onClick={() => window.location.href = "/community"}>
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Community entdecken
                </Button>
              </div>
            </div>

            {/* Jersey Image Panel - Hidden on Mobile */}
            <div className="hidden md:flex items-center justify-center">
              <img
                src="/images/mood-community.jpg"
                alt="Community mood image"
                className="h-full w-auto rounded-lg object-cover shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="mb-2 flex items-center justify-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <span className="font-display text-xs tracking-[0.2em] text-primary">FAQ</span>
            </div>
            <h2 className="text-center font-display text-3xl font-bold md:text-5xl">
              Häufig gestellte <span className="text-gradient">Fragen</span>
            </h2>
            <Accordion type="single" collapsible className="mt-10">
              {FAQ_ITEMS.map((item) => (
                <AccordionItem key={item.question} value={item.question}>
                  <AccordionTrigger className="text-left font-display text-base">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
