import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import { initAccentColor } from "@/hooks/use-accent-color";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    initAccentColor();
    applyStoredTheme();
    applyStoredZoom();
  }, [location.pathname]);

  return (
    <div className="min-h-screen mica-bg">
      <main className="pb-28">{children}</main>
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
  }
}

export function applyStoredZoom() {
  const zoom = localStorage.getItem("movie_tracker_zoom");
  if (zoom) {
    document.documentElement.style.fontSize = `${zoom}%`;
  }
}

export default AppLayout;
