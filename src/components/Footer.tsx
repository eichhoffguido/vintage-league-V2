import { Link } from "react-router-dom";
import vlLogo from "@/assets/vl-logo.png";

const Footer = () => {
  return (
    <footer className="grain border-t border-border bg-card">
      {/* Newsletter / CTA strip */}
      <div className="border-b border-border">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-8 md:flex-row md:justify-between">
          <div>
            <h4 className="font-display text-sm tracking-wider text-primary">SAMMLER-NEWSLETTER</h4>
            <p className="mt-1 text-xs text-muted-foreground">Erhalte exklusive Angebote und seltene Fundstücke direkt in dein Postfach.</p>
          </div>
          <div className="flex w-full max-w-sm gap-2">
            <input
              type="email"
              placeholder="deine@email.de"
              className="flex-1 rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button className="rounded-sm bg-primary px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90">
              Anmelden
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-primary/30 bg-primary/10">
                <span className="font-display text-sm font-bold text-primary">VL</span>
              </div>
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
              <Link to="/sell" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Verkaufen</Link>
              <Link to="/how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">So funktioniert's</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-display text-xs font-semibold tracking-[0.2em] text-primary">SAMMLUNGEN</h4>
            <nav className="mt-4 flex flex-col gap-2.5">
              <Link to="/shop?cat=bundesliga" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Bundesliga Klassiker</Link>
              <Link to="/shop?cat=premier-league" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Premier League Legenden</Link>
              <Link to="/shop?cat=national" className="text-sm text-muted-foreground transition-colors hover:text-foreground">WM & EM Trikots</Link>
              <Link to="/shop?cat=limited" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Limited Editions</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-display text-xs font-semibold tracking-[0.2em] text-primary">VERTRAUEN</h4>
            <nav className="mt-4 flex flex-col gap-2.5">
              <Link to="/authenticity" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Echtheitszertifikat</Link>
              <Link to="/help" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Hilfe & Kontakt</Link>
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