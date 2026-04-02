import { Search, User, ShoppingBag, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-tight">
            VINTAGE<span className="text-primary"> LEAGUE</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Entdecken
          </Link>
          <Link to="/shop" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Shop
          </Link>
          <Link to="/sell" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Verkaufen
          </Link>
          <Link to="/how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            So funktioniert's
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ShoppingBag className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" className="font-medium">
            <User className="mr-2 h-4 w-4" />
            Login
          </Button>
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-3 pt-4">
            <Link to="/" className="text-sm font-medium text-muted-foreground">Entdecken</Link>
            <Link to="/shop" className="text-sm font-medium text-muted-foreground">Shop</Link>
            <Link to="/sell" className="text-sm font-medium text-muted-foreground">Verkaufen</Link>
            <Link to="/how-it-works" className="text-sm font-medium text-muted-foreground">So funktioniert's</Link>
            <Button variant="outline" size="sm" className="mt-2 w-full font-medium">
              <User className="mr-2 h-4 w-4" />
              Login
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
