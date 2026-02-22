import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import TitleBar from "./components/TitleBar";
import UpdateNotification from "./components/UpdateNotification";
import HomePage from "./pages/HomePage";
import MoviesPage from "./pages/MoviesPage";
import SeriesPage from "./pages/SeriesPage";
import VaultPage from "./pages/VaultPage";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import WatchlistPage from "./pages/WatchlistPage";
import NotFound from "./pages/NotFound";
import AppUpdater from "./lib/updater";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const queryClient = new QueryClient();

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const App = () => {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    // Check for updates on app startup
    const initializeUpdater = async () => {
      try {
        const updater = AppUpdater.getInstance();
        await updater.checkOnStartup();
        
        // Show notification if update is available
        const updateInfo = updater.getUpdateInfo();
        if (updateInfo?.available) {
          setShowUpdateNotification(true);
        }
      } catch (error) {
        console.error('Failed to initialize updater:', error);
      }
    };

    initializeUpdater();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="h-screen flex flex-col">
          <TitleBar title="Movie Tracker" version="1.1.1" />
          <div className="flex-1 overflow-hidden">
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
          </div>
        </div>
        
        {showUpdateNotification && (
          <UpdateNotification onClose={() => setShowUpdateNotification(false)} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
