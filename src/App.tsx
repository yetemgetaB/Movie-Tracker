import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import MoviesPage from "./pages/MoviesPage";
import SeriesPage from "./pages/SeriesPage";
import VaultPage from "./pages/VaultPage";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import WatchlistPage from "./pages/WatchlistPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LayoutWrapper><HomePage /></LayoutWrapper>} />
            <Route path="/movies" element={<LayoutWrapper><MoviesPage /></LayoutWrapper>} />
            <Route path="/series" element={<LayoutWrapper><SeriesPage /></LayoutWrapper>} />
            <Route path="/library" element={<LayoutWrapper><VaultPage /></LayoutWrapper>} />
            <Route path="/settings" element={<LayoutWrapper><SettingsPage /></LayoutWrapper>} />
            <Route path="/analytics" element={<LayoutWrapper><AnalyticsPage /></LayoutWrapper>} />
            <Route path="/watchlist" element={<LayoutWrapper><WatchlistPage /></LayoutWrapper>} />
            <Route path="*" element={<LayoutWrapper><NotFound /></LayoutWrapper>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
