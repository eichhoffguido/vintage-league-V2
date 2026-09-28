import { Search, User, ShoppingBag, Menu, X, LogOut, Heart, Gavel, ChevronDown, ShieldCheck, PenLine, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useOpenOrderCount } from "@/hooks/useOrders";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import Logo from "@/components/brand/Logo";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { HEADER_CATEGORY_CHIPS, categoryToShopUrl, isCategoryChipActive, isJustDroppedActive } from "@/data/categoryFilters";
import { parseFiltersFromParams } from "@/hooks/useFilterState";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/config/features";

const JUST_DROPPED_CHIP = { label: "Just Dropped", url: "/shop?sort=newest" };

const NAV_LINK = "cap text-xs text-nero underline-offset-4 decoration-1 hover:underline";
const chipClassName = (active: boolean) =>
  cn("cap whitespace-nowrap text-[11px] underline-offset-4 hover:text-nero hover:underline", active ? "text-nero underline decoration-2" : "text-muted-foreground");

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileHeaderSearch, setMobileHeaderSearch] = useState("");
  const { user, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  // Bestellungen, bei denen der Nutzer etwas tun muss (versenden / Erhalt bestätigen)
  const openOrders = useOpenOrderCount(user?.id);
  const navigate = useNavigate();
  const location = useLocation();

  const closeHeaderSearch = () => {
    setSearchOpen(false);
    setHeaderSearch("");
  };

  const submitHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = headerSearch.trim();
    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
    closeHeaderSearch();
  };

  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    setMobileHeaderSearch("");
  };

  const submitMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = mobileHeaderSearch.trim();
    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
    closeMobileSearch();
  };

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate("/");
  };

  const goSell = () => navigate(user ? "/collection" : "/auth");

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileSearch();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileSearchOpen]);

  // Mobile-Menü bei Seitenwechsel schließen
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const shopFilters = location.pathname === "/shop" ? parseFiltersFromParams(new URLSearchParams(location.search)) : null;
  const isJustDroppedChipActive = shopFilters !== null && isJustDroppedActive(shopFilters);
  const activeCategoryChipKey = shopFilters !== null
    ? HEADER_CATEGORY_CHIPS.find((chip) => isCategoryChipActive(chip.key, shopFilters))?.key ?? null
    : null;

  return (
    <header className="sticky top-0 z-30 bg-background">
      <div className="tricolore" aria-hidden />
      <AnnouncementBar />
      <EmailVerificationBanner />

      {/* Hauptleiste */}
      <div className="border-b border-nero bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between gap-6 px-4 md:h-[72px] md:px-10">
          <Link to="/" aria-label="Calcio Classics — Startseite" className="shrink-0">
            <Logo monogramClassName="h-8 md:h-9" />
          </Link>

          {/* Desktop-Navigation */}
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Hauptnavigation">
            <Link to="/shop" className={NAV_LINK}>Marktplatz</Link>
            {FEATURES.trade && <Link to="/shop?tradeable=true" className={NAV_LINK}>Tauschen</Link>}
            <Link to="/community" className={NAV_LINK}>Community</Link>
            {user && <Link to="/collection" className={NAV_LINK}>Sammlung</Link>}
            <Link to="/#faq" className={NAV_LINK}>FAQ</Link>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {searchOpen ? (
              <form onSubmit={submitHeaderSearch} className="flex items-center">
                <input
                  autoFocus
                  type="text"
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  placeholder="Team, Trikot, Spieler…"
                  aria-label="Trikots durchsuchen"
                  className="h-9 w-48 border border-nero bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" variant="ghost" size="icon" aria-label="Suchen">
                  <Search className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={closeHeaderSearch} aria-label="Suche schließen">
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <button type="button" className={cn(NAV_LINK, "flex items-center gap-2 px-2")} onClick={() => setSearchOpen(true)} aria-label="Desktop-Suche öffnen">
                <Search className="h-4 w-4" /> Suche
              </button>
            )}

            {user ? (
              <>
                <Link to="/watchlist" className={cn(NAV_LINK, "flex items-center gap-2 px-2")} aria-label="Merkliste">
                  <Heart className="h-4 w-4" /> Merkliste
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger className={cn(NAV_LINK, "flex items-center gap-1.5 px-2 outline-none")}>
                    <User className="h-4 w-4" /> Konto
                    {openOrders > 0 && (
                      <span className="num inline-flex h-4 min-w-4 items-center justify-center bg-rosso px-1 text-[11px] leading-none text-avorio" aria-label={`${openOrders} offene Bestellungen`}>
                        {openOrders}
                      </span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px] border-2 border-nero bg-card p-1">
                    <DropdownMenuItem className="cap cursor-pointer py-2.5 text-xs" onSelect={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" /> Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cap cursor-pointer py-2.5 text-xs" onSelect={() => navigate("/collection")}>
                      <ShoppingBag className="mr-2 h-4 w-4" /> Sammlung
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cap cursor-pointer py-2.5 text-xs" onSelect={() => navigate("/my-bids")}>
                      <Gavel className="mr-2 h-4 w-4" /> Gebote
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cap cursor-pointer py-2.5 text-xs" onSelect={() => navigate("/orders")}>
                      <Package className="mr-2 h-4 w-4" /> Käufe & Verkäufe
                      {openOrders > 0 && <span className="num ml-auto bg-rosso px-1.5 text-xs text-avorio">{openOrders}</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cap cursor-pointer py-2.5 text-xs" onSelect={() => navigate("/watchlist")}>
                      <Heart className="mr-2 h-4 w-4" /> Merkliste
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator className="bg-nero" />
                        <DropdownMenuItem className="cap cursor-pointer py-2.5 text-xs" onSelect={() => navigate("/admin")}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cap cursor-pointer py-2.5 text-xs" onSelect={() => navigate("/admin/cms")}>
                          <PenLine className="mr-2 h-4 w-4" /> CMS
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className="bg-nero" />
                    <DropdownMenuItem className="cap cursor-pointer py-2.5 text-xs" onSelect={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth" className={cn(NAV_LINK, "px-2")}>Login</Link>
            )}
            <Button size="sm" className="ml-2" onClick={goSell}>Trikot verkaufen</Button>
          </div>

          {/* Mobile-Aktionen */}
          <div className="flex items-center lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={() => {
                if (menuOpen) setMenuOpen(false);
                setMobileSearchOpen((open) => !open);
              }}
              aria-label={mobileSearchOpen ? "Suche schließen" : "Suche öffnen"}
            >
              {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={() => {
                if (mobileSearchOpen) closeMobileSearch();
                setMenuOpen(!menuOpen);
              }}
              aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile-Suche */}
      {mobileSearchOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-20" onClick={closeMobileSearch} aria-hidden="true" />
          <div className="relative z-30 border-b border-nero bg-background px-4 py-3">
            <form onSubmit={submitMobileSearch} className="flex items-stretch border border-nero">
              <input
                autoFocus
                type="text"
                value={mobileHeaderSearch}
                onChange={(e) => setMobileHeaderSearch(e.target.value)}
                placeholder="Team, Trikot, Spieler…"
                aria-label="Trikots durchsuchen"
                className="h-11 flex-1 bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button type="submit" className="flex w-12 items-center justify-center bg-nero text-avorio" aria-label="Suchen">
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Kategorie-Leiste (Desktop) */}
      <div className="hidden border-b border-nero bg-background lg:block">
        <div className="container mx-auto flex items-center gap-7 px-4 py-2.5 md:px-10">
          <Link to={JUST_DROPPED_CHIP.url} className={cn(chipClassName(isJustDroppedChipActive), "text-rosso")}>
            {JUST_DROPPED_CHIP.label}
          </Link>
          {HEADER_CATEGORY_CHIPS.map((chip) => (
            <Link key={chip.key} to={categoryToShopUrl(chip.key)} className={chipClassName(activeCategoryChipKey === chip.key)}>
              {chip.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile-Menü */}
      {menuOpen && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-nero bg-background px-4 pb-6 lg:hidden">
          <nav className="flex flex-col pt-2" aria-label="Mobile Navigation">
            {[
              { to: "/shop", label: "Marktplatz" },
              ...(FEATURES.trade ? [{ to: "/shop?tradeable=true", label: "Tauschen" }] : []),
              { to: "/community", label: "Community" },
              ...(user
                ? [
                    { to: "/collection", label: "Sammlung" },
                    { to: "/watchlist", label: "Merkliste" },
                    { to: "/my-bids", label: "Meine Gebote" },
                    { to: "/orders", label: openOrders > 0 ? `Käufe & Verkäufe (${openOrders} offen)` : "Käufe & Verkäufe" },
                    { to: "/profile", label: "Profil" },
                    ...(isAdmin ? [{ to: "/admin", label: "Admin" }, { to: "/admin/cms", label: "CMS" }] : []),
                  ]
                : []),
              { to: "/#faq", label: "FAQ" },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="border-b border-nero/20 py-3 font-display text-lg font-semibold tracking-[-0.02em]">
                {item.label}
              </Link>
            ))}
            <div className="cap mt-5 text-[10px] text-muted-foreground">Kategorien</div>
            <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
              <Link to={JUST_DROPPED_CHIP.url} className="cap shrink-0 border border-nero px-3 py-2 text-[11px] text-rosso">
                {JUST_DROPPED_CHIP.label}
              </Link>
              {HEADER_CATEGORY_CHIPS.map((chip) => (
                <Link
                  key={chip.key}
                  to={categoryToShopUrl(chip.key)}
                  className={cn(
                    "cap shrink-0 border border-nero px-3 py-2 text-[11px]",
                    activeCategoryChipKey === chip.key && "bg-nero text-avorio",
                  )}
                >
                  {chip.label}
                </Link>
              ))}
            </div>
            <Button className="mt-6 w-full" onClick={goSell}>Trikot verkaufen</Button>
            {user ? (
              <Button variant="outline" className="mt-2 w-full" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            ) : (
              <Button variant="outline" className="mt-2 w-full" onClick={() => navigate("/auth")}>
                <User className="h-4 w-4" /> Login
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
