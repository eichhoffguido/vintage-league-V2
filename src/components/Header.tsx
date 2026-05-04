import { Search, User, ShoppingBag, Menu, X, ShieldCheck, ArrowLeftRight, LogOut, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePendingTradeCount } from "@/hooks/usePendingTradeCount";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import vlLogo from "@/assets/vl-logo.png";
const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pendingTradeCount = usePendingTradeCount();

  return (
    <header className="sticky top-0 z-50">
      <EmailVerificationBanner />
      {/* Main header */}
      <div className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={vlLogo} alt="Vintage League Logo" className="h-10 w-10 object-contain" />
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold leading-none tracking-wider">
                VINTAGE LEAGUE
              </span>
              <span className="text-[10px] tracking-[0.2em] text-muted-foreground">
                SPORTS COLLECTIBLES
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 lg:flex">
            <Link to="/" className="text-sm font-medium uppercase tracking-wide text-muted-foreground link-animate">
              Entdecken
            </Link>
            <Link to="/shop" className="text-sm font-medium uppercase tracking-wide text-muted-foreground link-animate">
              Marktplatz
            </Link>
            <Link to="/trade" className="text-sm font-medium uppercase tracking-wide text-muted-foreground link-animate">
              Tauschbörse
            </Link>
            <Link to="/community" className="text-sm font-medium uppercase tracking-wide text-muted-foreground link-animate">
              Community
            </Link>
            {user && (
              <>
                <Link to="/favorites" className="text-sm font-medium uppercase tracking-wide text-muted-foreground link-animate">
                  Favoriten
                </Link>
                <Link to="/watchlist" className="text-sm font-medium uppercase tracking-wide text-muted-foreground link-animate">
                  Beobachtungsliste
                </Link>
                <Link to="/trades" className="relative text-sm font-medium uppercase tracking-wide text-muted-foreground link-animate">
                  Tausch-Anfragen
                  {pendingTradeCount > 0 && (
                    <Badge variant="destructive" className="absolute -right-6 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-bounce-in">
                      {pendingTradeCount}
                    </Badge>
                  )}
                </Link>
              </>
            )}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary btn-animate icon-rotate">
              <Search className="h-5 w-5" />
            </Button>
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary btn-animate" onClick={() => navigate("/watchlist")}>
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="sm" className="border-primary/30 font-medium uppercase tracking-wide btn-animate" onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Button>
                <Button variant="outline" size="sm" className="border-primary/30 font-medium uppercase tracking-wide btn-animate" onClick={() => navigate("/collection")}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Sammlung
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground btn-animate" onClick={async () => { await signOut(); navigate("/"); }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="border-primary/30 font-medium uppercase tracking-wide btn-animate hover:bg-primary hover:text-primary-foreground" onClick={() => navigate("/auth")}>
                <User className="mr-2 h-4 w-4" />
                Login
              </Button>
            )}
          </div>

          {/* Mobile toggle */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Category bar - desktop */}
      <div className="hidden border-b border-border bg-secondary lg:block">
        <div className="container mx-auto flex items-center gap-6 px-4 py-2">
          {["Bundesliga", "Premier League", "La Liga", "Serie A", "Nationalteams", "Klassiker", "Raritäten"].map((cat) => (
            <Link
              key={cat}
              to={`/trade?cat=${cat.toLowerCase()}`}
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-3 pt-4">
            <Link to="/" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Entdecken</Link>
            <Link to="/shop" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Marktplatz</Link>
            <Link to="/trade" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Tauschbörse</Link>
            <Link to="/community" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Community</Link>
            {user && (
              <>
                <Link to="/profile" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Profil</Link>
                <Link to="/collection" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Sammlung</Link>
                <Link to="/watchlist" className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  Beobachtungsliste
                </Link>
                <Link to="/trades" className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Tausch-Anfragen
                  {pendingTradeCount > 0 && (
                    <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {pendingTradeCount}
                    </Badge>
                  )}
                </Link>
              </>
            )}
            <div className="vintage-divider my-2" />
            {["Bundesliga", "Premier League", "La Liga", "Serie A", "Nationalteams"].map((cat) => (
              <Link key={cat} to={`/trade?cat=${cat.toLowerCase()}`} className="text-xs text-muted-foreground">{cat}</Link>
            ))}
            {user ? (
              <Button variant="outline" size="sm" className="mt-2 w-full border-primary/30 font-medium uppercase tracking-wide" onClick={async () => { await signOut(); navigate("/"); }}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="mt-2 w-full border-primary/30 font-medium uppercase tracking-wide" onClick={() => navigate("/auth")}>
                <User className="mr-2 h-4 w-4" /> Login
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;