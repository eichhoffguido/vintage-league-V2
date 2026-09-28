import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { retryAsync } from "@/utils/retry";
import { takePostLoginPath } from "@/utils/postLoginRedirect";
import { AUTH_MESSAGES, authErrorFromUrl } from "@/lib/authErrors";
import Index from "./pages/Index.tsx";
import RouteSeo from "@/components/RouteSeo";
import Auth from "./pages/Auth.tsx";
import AuthReset from "./pages/AuthReset.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Collection from "./pages/Collection.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Admin from "./pages/Admin.tsx";
import AdminCms from "./pages/AdminCms.tsx";
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
import Terms from "./pages/Terms.tsx";
import NotFound from "./pages/NotFound.tsx";
import MyBids from "./pages/MyBids.tsx";
import Orders from "./pages/Orders.tsx";
import { FEATURES } from "@/config/features";

const queryClient = new QueryClient();

// Route guard component that checks if onboarding is complete
const ProfileGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const guardExecutedRef = useRef(false);

  useEffect(() => {
    if (loading || !user) return;

    // Only redirect after Google OAuth or email signup (on initial page load)
    const pathname = window.location.pathname;
    // Only apply guard when user first logs in (pathname is "/" or root)
    if ((pathname === "/" || pathname === "") && !guardExecutedRef.current) {
      guardExecutedRef.current = true;

      retryAsync(
        async () => {
          const { data, error } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", user.id)
            .single();

          if (error) {
            throw error;
          }

          // If onboarding is complete, redirect to collection
          // Otherwise, redirect to onboarding
          const next = takePostLoginPath();
          if (data?.onboarding_completed) {
            navigate(next ?? "/collection");
          } else {
            navigate("/onboarding");
          }
        },
        3,
        100
      ).catch((err) => {
        console.error("Profile check failed after retries:", err);
        // Default to onboarding if check fails
        navigate("/onboarding");
      });
    }
  }, [user, loading, navigate]);

  return children;
};

// Fehler aus einem Mail-Link (Supabase hängt ihn an die Adresse, z. B. #error_code=otp_expired) — einmal beim Laden lesen.
const initialAuthLinkError = authErrorFromUrl(window.location.hash, window.location.search);

/** Abgelaufener/benutzter Bestätigungslink landet sonst stumm auf der Startseite → zur Anmeldung mit Hinweis. */
const AuthLinkErrorRedirect = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const handledRef = useRef(false);

  useEffect(() => {
    // /auth/reset zeigt den Fehler selbst an
    if (!initialAuthLinkError || handledRef.current || pathname === "/auth/reset") return;
    handledRef.current = true;
    navigate("/auth", { replace: true, state: { linkError: AUTH_MESSAGES.signupLinkUsed } });
  }, [navigate, pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthLinkErrorRedirect />
          <RouteSeo />
          <ProfileGuard>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/reset" element={<AuthReset />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/jersey/:id" element={<JerseyDetail />} />
              <Route path="/success" element={<PaymentSuccess />} />
              <Route path="/seller/:userId" element={<SellerProfile />} />
              {/* Tausch vorerst aus (src/config/features.ts) → alte Links führen in den Shop */}
              <Route path="/trade" element={FEATURES.trade ? <Trade /> : <Navigate to="/shop" replace />} />
              <Route path="/trades" element={FEATURES.trade ? <Trades /> : <Navigate to="/shop" replace />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/:id" element={<CommunityPost />} />
              <Route path="/my-bids" element={<MyBids />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/cms" element={<AdminCms />} />
              <Route path="/imprint" element={<Imprint />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/agb" element={<Terms />} />
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
