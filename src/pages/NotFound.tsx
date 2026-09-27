import { useEffect } from "react";
import Headline from "@/components/brand/Headline";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Link, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const page = useSiteContent("notfound");
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex flex-1 flex-col justify-center px-4 py-20 md:px-10 md:py-28">
        <div className="cap text-rosso">{page.eyebrow}</div>
        <h1 className="display mt-4 text-[62px] md:text-[136px]">
          <Headline text={page.headline} />
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          {page.text}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/shop">{page.primaryCta}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">{page.secondaryCta}</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
