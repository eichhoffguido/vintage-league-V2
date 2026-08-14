import { Search, User, ShoppingBag, Menu, X, ShieldCheck, ArrowLeftRight, LogOut, Heart, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { HEADER_CATEGORY_CHIPS, categoryToShopUrl, isCategoryChipActive, isJustDroppedActive } from "@/data/categoryFilters";
import { parseFiltersFromParams } from "@/hooks/useFilterState";

const JUST_DROPPED_CHIP = { label: "Just Dropped", url: "/shop?sort=newest" };

const chipClassName = (active: boolean, base: string) =>
  `${base} ${active ? "text-primary underline underline-offset-4 decoration-2" : "text-muted-foreground"}`;

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const shopFilters = location.pathname === "/shop" ? parseFiltersFromParams(new URLSearchParams(location.search)) : null;
  const isJustDroppedChipActive = shopFilters !== null && isJustDroppedActive(shopFilters);
  const activeCategoryChipKey = shopFilters !== null
    ? HEADER_CATEGORY_CHIPS.find((chip) => isCategoryChipActive(chip.key, shopFilters))?.key ?? null
    : null;

  return (
    <header className="sticky top-0 z-30">
      <EmailVerificationBanner />
      {/* Main header */}
      <div className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/vintageleague-logo.svg" alt="Vintage League Logo" className="h-10 object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 lg:flex">
            <Link to="/shop" className="text-sm font-medium uppercase tracking-wide text-muted-foreground link-animate">
              Marktplatz
            </Link>
            <Link to="/community" className="text-sm font-medium uppercase tracking-wide text-muted-foreground link-animate">
              Community
            </Link>
            {user && (
              <Link to="/collection" className="text-sm font-medium uppercase tracking-wide text-muted-foreground link-animate">
                Sammlung
              </Link>
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
                <Button variant="outline" size="sm" className="border-primary/30 font-medium uppercase tracking-wide btn-animate" onClick={() => navigate("/my-bids")}>
                  <Gavel className="mr-2 h-4 w-4" />
                  Gebote
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
          <Link
            to={JUST_DROPPED_CHIP.url}
            className={chipClassName(isJustDroppedChipActive, "text-xs font-medium uppercase tracking-wider transition-colors hover:text-primary")}
          >
            {JUST_DROPPED_CHIP.label}
          </Link>
          {HEADER_CATEGORY_CHIPS.map((chip) => (
            <Link
              key={chip.key}
              to={categoryToShopUrl(chip.key)}
              className={chipClassName(activeCategoryChipKey === chip.key, "text-xs font-medium uppercase tracking-wider transition-colors hover:text-primary")}
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-3 pt-4">
            <Link to="/shop" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Marktplatz</Link>
            <Link to="/community" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Community</Link>
            {user && (
              <>
                <Link to="/collection" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Sammlung</Link>
                <Link to="/my-bids" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Meine Gebote</Link>
              </>
            )}
            <div className="vintage-divider my-2" />
            <Link to={JUST_DROPPED_CHIP.url} className={chipClassName(isJustDroppedChipActive, "text-xs")}>{JUST_DROPPED_CHIP.label}</Link>
            {HEADER_CATEGORY_CHIPS.map((chip) => (
              <Link key={chip.key} to={categoryToShopUrl(chip.key)} className={chipClassName(activeCategoryChipKey === chip.key, "text-xs")}>{chip.label}</Link>
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