import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import NotificationBell from "./NotificationBell";
import Titlebar from "./Titlebar";
import CommandPalette from "./CommandPalette";
import { initAccentColor } from "@/hooks/use-accent-color";
import { initPlugins } from "@/lib/plugins";
import { checkAchievements } from "@/lib/achievements";
import { toast } from "@/hooks/use-toast";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const [navVisible, setNavVisible] = useState(true);

  useEffect(() => {
    initAccentColor();
    applyStoredTheme();
    applyStoredZoom();
    initPlugins();

    const { newlyUnlocked } = checkAchievements();
    newlyUnlocked.forEach((a) => {
      toast({ title: `${a.icon} Achievement Unlocked!`, description: `${a.icon} ${a.id.replace(/_/g, " ")}` });
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen mica-bg">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg">
        Skip to content
      </a>
      <Titlebar />
      <NotificationBell visible={navVisible} />
      <CommandPalette />
      <main id="main-content" className="pt-9 pb-28" role="main">{children}</main>
      <BottomNav onVisibilityChange={setNavVisible} />
    </div>
  );
};
