import { ReactNode, useEffect } from "react";
import BottomNav from "./BottomNav";
import { initAccentColor } from "@/hooks/use-accent-color";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  useEffect(() => {
    initAccentColor();
    // Restore theme
    const theme = localStorage.getItem("movie_tracker_theme");
    if (theme === "light") {
      const r = document.documentElement;
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
    }
    // Restore custom color
    const customHex = localStorage.getItem("movie_tracker_custom_color");
    if (customHex) {
      const rv = parseInt(customHex.slice(1, 3), 16) / 255;
      const gv = parseInt(customHex.slice(3, 5), 16) / 255;
      const bv = parseInt(customHex.slice(5, 7), 16) / 255;
      const max = Math.max(rv, gv, bv), min = Math.min(rv, gv, bv);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === rv) h = ((gv - bv) / d + (gv < bv ? 6 : 0)) / 6;
        else if (max === gv) h = ((bv - rv) / d + 2) / 6;
        else h = ((rv - gv) / d + 4) / 6;
      }
      const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      const rr = document.documentElement;
      rr.style.setProperty("--primary", hsl);
      rr.style.setProperty("--accent", hsl);
      rr.style.setProperty("--ring", hsl);
    }
  }, []);

  return (
    <div className="min-h-screen mica-bg">
      <main className="pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
