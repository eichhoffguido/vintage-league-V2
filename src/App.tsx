import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Collection from "./pages/Collection.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Trade from "./pages/Trade.tsx";
import Trades from "./pages/Trades.tsx";
import Community from "./pages/Community.tsx";
import CommunityPost from "./pages/CommunityPost.tsx";
import Shop from "./pages/Shop.tsx";
import Watchlist from "./pages/Watchlist.tsx";
import Imprint from "./pages/Imprint.tsx";
import Privacy from "./pages/Privacy.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/:id" element={<CommunityPost />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/imprint" element={<Imprint />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
