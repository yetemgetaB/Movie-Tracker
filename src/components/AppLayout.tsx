import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import NotificationBell from "./NotificationBell";
import { initAccentColor } from "@/hooks/use-accent-color";
import { initPlugins } from "@/lib/plugins";
import { checkAchievements } from "@/lib/achievements";
import { toast } from "@/hooks/use-toast";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    initAccentColor();
    applyStoredTheme();
    applyStoredZoom();
    initPlugins();

    // Check achievements on navigation
    const { newlyUnlocked } = checkAchievements();
    newlyUnlocked.forEach((a) => {
      toast({ title: `${a.icon} Achievement Unlocked!`, description: `${a.icon} ${a.id.replace(/_/g, " ")}` });
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen mica-bg">
      {/* Skip to content for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg">
        Skip to content
      </a>
      {/* Notification bell - fixed top right */}
      <div className="fixed top-3 right-3 z-40">
        <NotificationBell />
      </div>
      <main id="main-content" className="pb-28" role="main">{children}</main>
      <BottomNav />
    </div>
  );
};

export function applyStoredTheme() {
  const theme = localStorage.getItem("movie_tracker_theme");
  const r = document.documentElement;
  if (theme === "light") {
    r.style.setProperty("--background", "0 0% 98%");
    r.style.setProperty("--foreground", "220 15% 15%");
    r.style.setProperty("--card", "0 0% 100%");
    r.style.setProperty("--card-foreground", "220 15% 15%");
    r.style.setProperty("--popover", "0 0% 100%");
    r.style.setProperty("--popover-foreground", "220 15% 15%");
    r.style.setProperty("--secondary", "220 15% 92%");
    r.style.setProperty("--secondary-foreground", "220 15% 30%");
    r.style.setProperty("--muted", "220 15% 95%");
    r.style.setProperty("--muted-foreground", "215 12% 45%");
    r.style.setProperty("--border", "220 15% 85%");
    r.style.setProperty("--input", "220 15% 85%");
    r.style.setProperty("--primary-foreground", "0 0% 100%");
    // Light-mode custom tokens
    r.style.setProperty("--glass", "0 0% 100% / 0.7");
    r.style.setProperty("--glass-border", "220 15% 80% / 0.5");
    r.style.setProperty("--glow-soft", "209 95% 50% / 0.15");
    r.style.setProperty("--glow-medium", "209 95% 50% / 0.25");
    r.style.setProperty("--surface-hover", "220 15% 93%");
    r.style.setProperty("--mica-from", "0 0% 95%");
    r.style.setProperty("--mica-to", "0 0% 98%");
  } else {
    r.style.setProperty("--background", "220 20% 7%");
    r.style.setProperty("--foreground", "210 20% 92%");
    r.style.setProperty("--card", "220 18% 10%");
    r.style.setProperty("--card-foreground", "210 20% 92%");
    r.style.setProperty("--popover", "220 18% 10%");
    r.style.setProperty("--popover-foreground", "210 20% 92%");
    r.style.setProperty("--secondary", "220 15% 15%");
    r.style.setProperty("--secondary-foreground", "210 20% 85%");
    r.style.setProperty("--muted", "220 15% 13%");
    r.style.setProperty("--muted-foreground", "215 12% 50%");
    r.style.setProperty("--border", "220 15% 18%");
    r.style.setProperty("--input", "220 15% 18%");
    r.style.setProperty("--primary-foreground", "210 20% 95%");
    // Dark-mode custom tokens
    r.style.setProperty("--glass", "220 18% 10% / 0.6");
    r.style.setProperty("--glass-border", "220 15% 25% / 0.4");
    r.style.setProperty("--glow-soft", "209 95% 35% / 0.2");
    r.style.setProperty("--glow-medium", "209 95% 35% / 0.35");
    r.style.setProperty("--surface-hover", "220 15% 16%");
    r.style.setProperty("--mica-from", "220 18% 12%");
    r.style.setProperty("--mica-to", "220 20% 7%");
  }
}

export function applyStoredZoom() {
  const zoom = localStorage.getItem("movie_tracker_zoom");
  if (zoom) {
    document.documentElement.style.fontSize = `${zoom}%`;
  }
}

export default AppLayout;
