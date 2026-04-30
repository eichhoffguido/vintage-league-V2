import { useState, useEffect, useCallback } from "react";
import { ArrowRight, TrendingUp, Award, ShieldCheck, ArrowLeftRight, MessageSquare, Wrench, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JerseyCard from "@/components/JerseyCard";
import CategoryFilter from "@/components/CategoryFilter";
import TrustBanner from "@/components/TrustBanner";
import heroImage from "@/assets/hero-jersey.jpg";
import heroCollectibles from "@/assets/hero-collectibles.jpg";
import heroRarity from "@/assets/hero-rarity.jpg";
import jersey1 from "@/assets/jersey-1.jpg";
import jersey2 from "@/assets/jersey-2.jpg";
import jersey3 from "@/assets/jersey-3.jpg";
import jersey4 from "@/assets/jersey-4.jpg";
import jersey5 from "@/assets/jersey-5.jpg";
import jersey6 from "@/assets/jersey-6.jpg";
import jersey7 from "@/assets/jersey-7.jpg";
import jersey8 from "@/assets/jersey-8.jpg";

const mockJerseys = [
  {
    name: "Heimtrikot 2024/25",
    team: "Real Madrid",
    league: "La Liga",
    year: "2024",
    price: 89,
    lowestAsk: 85,
    highestBid: 78,
    imageUrl: jersey1,
    verified: true,
    condition: 5,
    size: "L",
  },
  {
    name: "Heimtrikot 2024/25",
    team: "FC Barcelona",
    league: "La Liga",
    year: "2024",
    price: 95,
    lowestAsk: 90,
    highestBid: 82,
    imageUrl: jersey2,
    verified: true,
    condition: 5,
    size: "M",
  },
  {
    name: "Heimtrikot 2024/25",
    team: "FC Bayern München",
    league: "Bundesliga",
    year: "2024",
    price: 79,
    highestBid: 72,
    imageUrl: jersey3,
    verified: true,
    condition: 4,
    size: "XL",
  },
  {
    name: "Heimtrikot 2019/20",
    team: "Manchester United",
    league: "Premier League",
    year: "2019",
    price: 120,
    lowestAsk: 115,
    highestBid: 105,
    imageUrl: jersey4,
    verified: false,
    condition: 3,
    size: "M",
  },
  {
    name: "Retro Heimtrikot 1995/96",
    team: "AC Milan",
    league: "Serie A",
    year: "1995",
    price: 250,
    lowestAsk: 240,
    highestBid: 220,
    imageUrl: jersey5,
    verified: true,
    condition: 3,
    size: "L",
  },
  {
    name: "Heimtrikot 2024/25",
    team: "Borussia Dortmund",
    league: "Bundesliga",
    year: "2024",
    price: 75,
    lowestAsk: 70,
    imageUrl: jersey6,
    verified: true,
    condition: 5,
    size: "S",
  },
  {
    name: "Klassik Trikot 2002",
    team: "Brasilien",
    league: "Nationalteam",
    year: "2002",
    price: 180,
    highestBid: 165,
    imageUrl: jersey7,
    verified: true,
    condition: 4,
    size: "M",
  },
  {
    name: "Heimtrikot 2024/25",
    team: "Inter Mailand",
    league: "Serie A",
    year: "2024",
    price: 85,
    lowestAsk: 80,
    highestBid: 75,
    imageUrl: jersey8,
    verified: false,
    condition: 5,
    size: "L",
  },
];

const stats = [
  { label: "Zertifizierte Trikots", value: "12.500+" },
  { label: "Sammler & Händler", value: "3.200+" },
  { label: "Erfolgreiche Trades", value: "45.000+" },
];

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

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

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
            <div className="mt-8 flex flex-wrap gap-4">
              <Button variant="hero" size="lg" className="uppercase tracking-wider">
                Kollektion entdecken
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-primary/30 font-semibold uppercase tracking-wider hover:bg-primary/10">
                Trikot verkaufen
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-14 flex gap-8 md:gap-12">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl font-bold text-primary md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground md:text-sm">{stat.label}</p>
                </div>
              ))}
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
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Aktuelle <span className="text-gradient">Kollektion</span>
              </h2>
              <p className="mt-2 font-serif italic text-muted-foreground">
                Handverlesene Trikots — frisch kuratiert für Sammler
              </p>
            </div>
            <Button variant="ghost" className="self-start text-primary uppercase tracking-wider md:self-auto">
              Alle anzeigen <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <CategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {mockJerseys.map((jersey, index) => (
              <div
                key={index}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <JerseyCard {...jersey} condition={jersey.condition as 1 | 2 | 3 | 4 | 5} />
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
            <div className="hidden md:flex items-center justify-center">
              <img
                src={jersey4}
                alt="Jersey showcase"
                className="h-80 w-auto rounded-lg object-cover shadow-lg"
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
                  <h3 className="font-display text-lg font-semibold">{item.title}</h3>
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
          <div className="mt-8 flex justify-center gap-4">
            <img
              src={jersey2}
              alt="Jersey trading showcase"
              className="h-48 w-auto rounded-lg border border-primary/30 object-cover shadow-lg"
              style={{ boxShadow: "0 0 30px hsl(142 72% 40% / 0.2)" }}
            />
            <img
              src={jersey3}
              alt="Jersey trading showcase"
              className="h-48 w-auto rounded-lg border border-primary/30 object-cover shadow-lg"
              style={{ boxShadow: "0 0 30px hsl(142 72% 40% / 0.2)" }}
            />
          </div>
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="hero" size="lg" className="uppercase tracking-wider" onClick={() => window.location.href = "/trade"}>
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
                    <h3 className="font-display text-lg font-semibold">{item.title}</h3>
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
                src={jersey7}
                alt="Community jersey showcase"
                className="h-full w-auto rounded-lg object-cover shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
