import { useState } from "react";
import { Link } from "react-router-dom";
import vlLogo from "@/assets/vl-logo.png";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubscriptionStatus("error");
      setTimeout(() => setSubscriptionStatus("idle"), 3000);
      return;
    }

    setSubscriptionStatus("loading");

    // Simulate subscription (in a real app, this would call an API)
    setTimeout(() => {
      setSubscriptionStatus("success");
      setEmail("");
      setTimeout(() => setSubscriptionStatus("idle"), 3000);
    }, 800);
  };

  return (
    <footer className="grain border-t border-border bg-card">
      {/* Newsletter / CTA strip */}
      <div className="border-b border-border">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-8 md:flex-row md:justify-between">
          <div>
            <h4 className="font-display text-sm tracking-wider text-primary">SAMMLER-NEWSLETTER</h4>
            <p className="mt-1 text-xs text-muted-foreground">Erhalte exklusive Angebote und seltene Fundstücke direkt in dein Postfach.</p>
          </div>
          <form onSubmit={handleNewsletterSubmit} className="flex w-full max-w-sm gap-2">
            <input
              type="email"
              placeholder="deine@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              disabled={subscriptionStatus === "loading"}
            />
            <button
              type="submit"
              disabled={subscriptionStatus === "loading"}
              className={`rounded-sm px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider transition-colors ${
                subscriptionStatus === "success"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : subscriptionStatus === "error"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
              } disabled:opacity-50`}
            >
              {subscriptionStatus === "loading" ? "..." : subscriptionStatus === "success" ? "✓" : subscriptionStatus === "error" ? "!" : "Anmelden"}
            </button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src={vlLogo} alt="Vintage League Logo" className="h-9 w-9 object-contain" loading="lazy" width={512} height={512} />
              <div>
                <span className="font-display text-lg font-bold leading-none tracking-wider">
                  VINTAGE LEAGUE
                </span>
              </div>
            </div>
            <p className="mt-4 font-serif text-sm italic leading-relaxed text-muted-foreground">
              Dein Marktplatz für authentische Fußballtrikots — von aktuellen Raritäten bis zu legendären Klassikern.
            </p>
          </div>
          <div>
            <h4 className="font-display text-xs font-semibold tracking-[0.2em] text-primary">MARKTPLATZ</h4>
            <nav className="mt-4 flex flex-col gap-2.5">
              <Link to="/shop" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Alle Trikots</Link>
              <Link to="/shop?cat=retro" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Retro & Vintage</Link>
              <Link to="/trades" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Trades</Link>
              <Link to="/community" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Community</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-display text-xs font-semibold tracking-[0.2em] text-primary">SAMMLUNGEN</h4>
            <nav className="mt-4 flex flex-col gap-2.5">
              <Link to="/shop?cat=bundesliga" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Bundesliga Klassiker</Link>
              <Link to="/shop?cat=premier-league" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Premier League Legenden</Link>
              <Link to="/shop?cat=nationalteam" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Nationalteams</Link>
              <Link to="/shop?cat=rarities" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Raritäten</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-display text-xs font-semibold tracking-[0.2em] text-primary">VERTRAUEN</h4>
            <nav className="mt-4 flex flex-col gap-2.5">
              <Link to="/collection" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Meine Sammlung</Link>
              <Link to="/profile" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Mein Profil</Link>
              <Link to="/imprint" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Impressum</Link>
              <Link to="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Datenschutz</Link>
            </nav>
          </div>
        </div>
        <div className="vintage-divider mt-10" />
        <div className="pt-6 text-center text-xs text-muted-foreground">
          © 2026 Vintage League — Authentische Fußballtrikots für Sammler weltweit.
        </div>
      </div>
    </footer>
  );
};

export default Footer;