import { useState } from "react";
import { ArrowRight, TrendingUp, Award, ShieldCheck, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JerseyCard from "@/components/JerseyCard";
import CategoryFilter from "@/components/CategoryFilter";
import TrustBanner from "@/components/TrustBanner";
import heroImage from "@/assets/hero-jersey.jpg";
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

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="grain relative overflow-hidden min-h-[70vh] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Cinematic gradient overlay - dark from left for text readability, fading to reveal image */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
        {/* Vintage decorative lines */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-sm border border-primary/30 bg-primary/10 px-4 py-1.5">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-display text-xs tracking-[0.15em] text-primary">
                AUTHENTISCHE SAMMLERSTÜCKE
              </span>
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight md:text-7xl">
              Legendäre{" "}
              <span className="text-gradient">Trikots</span>
              <br />
              <span className="text-3xl font-normal tracking-wider text-muted-foreground md:text-4xl">
                für echte Sammler
              </span>
            </h1>
            <p className="mt-4 font-serif text-lg italic text-muted-foreground md:text-xl">
              Entdecke authentische Fußballtrikots — von seltenen Retro-Klassikern bis zu limitierten Editionen. 
              Jedes Stück zertifiziert und mit Geschichte.
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
          </div>
        </div>
      </section>

      <TrustBanner />

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

      {/* CTA Section */}
      <section className="grain relative border-y border-border bg-secondary/30 py-16 md:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-display text-xs tracking-[0.2em] text-primary">ZERTIFIZIERT & VERSICHERT</span>
          </div>
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Dein Trikot verdient{" "}
            <span className="text-gradient">einen neuen Sammler</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-serif italic text-muted-foreground">
            Liste dein Trikot in wenigen Minuten. Unsere Experten verifizieren die Echtheit und verbinden dich mit Sammlern weltweit.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="hero" size="lg" className="uppercase tracking-wider">
              Jetzt verkaufen
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
