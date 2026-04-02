import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <span className="font-display text-xl font-bold tracking-tight">
              VINTAGE<span className="text-primary"> LEAGUE</span>
            </span>
            <p className="mt-3 text-sm text-muted-foreground">
              Der Marktplatz für verifizierte Fußballtrikots. Kaufen, verkaufen und sammeln.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold tracking-wide">Marktplatz</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground">Shop</Link>
              <Link to="/sell" className="text-sm text-muted-foreground hover:text-foreground">Verkaufen</Link>
              <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground">So funktioniert's</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold tracking-wide">Kategorien</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link to="/shop?cat=bundesliga" className="text-sm text-muted-foreground hover:text-foreground">Bundesliga</Link>
              <Link to="/shop?cat=premier-league" className="text-sm text-muted-foreground hover:text-foreground">Premier League</Link>
              <Link to="/shop?cat=retro" className="text-sm text-muted-foreground hover:text-foreground">Retro Trikots</Link>
              <Link to="/shop?cat=national" className="text-sm text-muted-foreground hover:text-foreground">Nationalteams</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold tracking-wide">Support</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link to="/help" className="text-sm text-muted-foreground hover:text-foreground">Hilfe</Link>
              <Link to="/imprint" className="text-sm text-muted-foreground hover:text-foreground">Impressum</Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Datenschutz</Link>
            </nav>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 Vintage League. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
