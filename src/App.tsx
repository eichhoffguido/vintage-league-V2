import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Collection from "./pages/Collection.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Admin from "./pages/Admin.tsx";
import Trade from "./pages/Trade.tsx";
import Trades from "./pages/Trades.tsx";
import Community from "./pages/Community.tsx";
import CommunityPost from "./pages/CommunityPost.tsx";
import Shop from "./pages/Shop.tsx";
import Watchlist from "./pages/Watchlist.tsx";
import Favorites from "./pages/Favorites.tsx";
import JerseyDetail from "./pages/JerseyDetail.tsx";
import PaymentSuccess from "./pages/PaymentSuccess.tsx";
import SellerProfile from "./pages/SellerProfile.tsx";
import Imprint from "./pages/Imprint.tsx";
import Privacy from "./pages/Privacy.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

// Route guard component that checks profile completeness
const ProfileGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;

    // Only redirect after Google OAuth or email signup (on initial page load)
    const pathname = window.location.pathname;
    // Only apply guard when user first logs in (pathname is "/" or root)
    if (pathname === "/" || pathname === "") {
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error checking profile:", error);
            return;
          }
          // If profile has display_name, redirect to collection
          // Otherwise, redirect to onboarding
          if (data?.display_name) {
            navigate("/collection");
          } else {
            navigate("/onboarding");
          }
        })
        .catch((err) => {
          console.error("Profile check failed:", err);
        });
    }
  }, [user, loading, navigate]);

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProfileGuard>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/jersey/:id" element={<JerseyDetail />} />
              <Route path="/success" element={<PaymentSuccess />} />
              <Route path="/seller/:userId" element={<SellerProfile />} />
              <Route path="/trade" element={<Trade />} />
              <Route path="/trades" element={<Trades />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/:id" element={<CommunityPost />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/imprint" element={<Imprint />} />
              <Route path="/privacy" element={<Privacy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProfileGuard>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
