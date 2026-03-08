import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { Home, Film, Tv, Database, Settings, BarChart3, Clock, Compass, CalendarDays } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavSettings, type NavPosition } from "@/hooks/use-nav-settings";

const ICON_MAP: Record<string, any> = {
  "/": Home,
  "/movies": Film,
  "/series": Tv,
  "/browse": Compass,
  "/library": Database,
  "/watchlist": Clock,
  "/calendar": CalendarDays,
  "/analytics": BarChart3,
  "/settings": Settings,
};

const LABEL_MAP: Record<string, string> = {
  "/": "Home",
  "/movies": "Movies",
  "/series": "Series",
  "/browse": "Browse",
  "/library": "Vault",
  "/watchlist": "Watchlist",
  "/calendar": "Calendar",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

const BottomNav = () => {
  const location = useLocation();
  const { settings } = useNavSettings();
  
  // Auto-hide logic (inlined to avoid HMR issues with separate hook functions)
  const [autoHideVisible, setAutoHideVisible] = useState(true);
  const [navHovered, setNavHovered] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!settings.autoHide) { setAutoHideVisible(true); return; }

    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 50) {
        setAutoHideVisible(true);
      } else if (currentY > lastScrollY.current + 10) {
        setAutoHideVisible(false);
      } else if (currentY < lastScrollY.current - 10) {
        setAutoHideVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [settings.autoHide, settings.position]);

  const visible = autoHideVisible || navHovered;

function getGlowStyle(glowColor: string): React.CSSProperties {
  if (glowColor === "accent") return {};
  return {
    "--nav-glow": glowColor,
    boxShadow: `0 0 30px ${glowColor}33, 0 0 50px ${glowColor}22`,
  } as React.CSSProperties;
}

  const [showHidden, setShowHidden] = useState(false);

  const visibleItems = settings.order.filter(p => settings.visibleItems.includes(p));
  const hiddenItems = settings.order.filter(p => !settings.visibleItems.includes(p));

  const isHorizontal = settings.position === "bottom" || settings.position === "top";
  const isVertical = settings.position === "left" || settings.position === "right";

  const getPositionClasses = (): string => {
    const base = "fixed z-50 transition-all duration-300";
    switch (settings.position) {
      case "top":
        return `${base} top-4 left-1/2 -translate-x-1/2 ${visible ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"}`;
      case "left":
        return `${base} left-4 top-1/2 -translate-y-1/2 ${visible ? "translate-x-0 opacity-100" : "-translate-x-20 opacity-0"}`;
      case "right":
        return `${base} right-4 top-1/2 -translate-y-1/2 ${visible ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0"}`;
      default: // bottom
        return `${base} bottom-4 left-1/2 -translate-x-1/2 ${visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`;
    }
  };

  return (
    <nav
      className={`${getPositionClasses()} nav-glow rounded-2xl ${isVertical ? "px-2.5 py-3" : "px-3 py-2.5"}`}
      style={getGlowStyle(settings.glowColor)}
      onMouseEnter={() => { setNavHovered(true); setShowHidden(true); }}
      onMouseLeave={() => { setNavHovered(false); setShowHidden(false); }}
    >
      <ul className={`flex items-center ${isVertical ? "flex-col" : ""} gap-0.5`}>
        {visibleItems.map((path) => {
          const Icon = ICON_MAP[path];
          const label = LABEL_MAP[path];
          if (!Icon) return null;
          const isActive = location.pathname === path ||
            (path !== "/" && location.pathname.startsWith(path));

          return (
            <li key={path}>
              <RouterNavLink
                to={path}
                className={`flex ${isVertical ? "flex-row gap-2 px-3 py-2" : "flex-col gap-0.5 px-3.5 py-2"} items-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-primary/15 glow-text"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`${isVertical ? "text-xs" : "text-[9px]"} font-medium`}>{label}</span>
              </RouterNavLink>
            </li>
          );
        })}

        {/* Hidden items revealed on hover */}
        {showHidden && hiddenItems.length > 0 && (
          <>
            <li className={`${isVertical ? "w-6 h-px" : "h-6 w-px"} bg-border/50 mx-1`} />
            {hiddenItems.map((path) => {
              const Icon = ICON_MAP[path];
              const label = LABEL_MAP[path];
              if (!Icon) return null;
              const isActive = location.pathname === path ||
                (path !== "/" && location.pathname.startsWith(path));

              return (
                <li key={path} className="animate-in fade-in zoom-in-95 duration-150">
                  <RouterNavLink
                    to={path}
                    className={`flex ${isVertical ? "flex-row gap-2 px-3 py-2" : "flex-col gap-0.5 px-3.5 py-2"} items-center rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-primary/15 glow-text"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                    <span className={`${isVertical ? "text-xs" : "text-[9px]"} font-medium`}>{label}</span>
                  </RouterNavLink>
                </li>
              );
            })}
          </>
        )}
      </ul>
    </nav>
  );
};

export default BottomNav;
