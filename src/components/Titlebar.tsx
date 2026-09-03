import { useLocation } from "react-router-dom";
import { Minus, Square, X, Dices, Keyboard } from "lucide-react";
import { useEffect, useState } from "react";

interface TitlebarProps {
  onOpenRoulette?: () => void;
  onOpenShortcuts?: () => void;
}

const ROUTE_TITLES: Record<string, string> = {
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

const Titlebar = ({ onOpenRoulette, onOpenShortcuts }: TitlebarProps) => {
  const location = useLocation();
  const [isTauri, setIsTauri] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const tauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    setIsTauri(tauri);
  }, []);

  const currentSection = ROUTE_TITLES[location.pathname] || "Movie Tracker";

  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().minimize();
    } catch {}
  };

  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      await win.toggleMaximize();
      setIsMaximized(await win.isMaximized());
    } catch {}
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    } catch {}
  };

  const handleDragStart = async (e: React.MouseEvent) => {
    // Only start drag if clicking the drag region itself, not buttons
    if ((e.target as HTMLElement).closest("button")) return;
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().startDragging();
    } catch {}
  };

  return (
    <div
      className="titlebar fixed top-0 left-0 right-0 z-[60] h-9 flex items-center select-none"
      onMouseDown={handleDragStart}
    >
      {/* Left: App name */}
      <div className="flex items-center gap-2 pl-3 pointer-events-none">
        <span className="text-xs font-semibold text-foreground/70 font-display tracking-wide">
          Movie Tracker
        </span>
      </div>

      {/* Center: Current section */}
      <div className="flex-1 flex justify-center pointer-events-none">
        <span className="text-[11px] font-medium text-muted-foreground">
          {currentSection}
        </span>
      </div>

      {/* Right: Quick actions & Window controls */}
      <div className="flex items-center h-full">
        {onOpenRoulette && (
          <button
            onClick={onOpenRoulette}
            className="titlebar-btn h-full px-2.5 flex items-center justify-center gap-1 hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground text-[11px]"
            title="What to Watch Roulette (R)"
          >
            <Dices size={13} className="text-primary" />
            <span className="hidden sm:inline font-medium">Roulette</span>
          </button>
        )}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="titlebar-btn h-full px-2.5 flex items-center justify-center hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard size={13} />
          </button>
        )}
        <div className="h-3 w-px bg-border/40 mx-1" />
        <button
          onClick={handleMinimize}
            className="titlebar-btn h-full px-3 flex items-center justify-center hover:bg-secondary/60 transition-colors"
            aria-label="Minimize"
          >
            <Minus size={14} className="text-muted-foreground" />
          </button>
          <button
            onClick={handleMaximize}
            className="titlebar-btn h-full px-3 flex items-center justify-center hover:bg-secondary/60 transition-colors"
            aria-label="Maximize"
          >
            <Square size={11} className="text-muted-foreground" />
          </button>
          <button
            onClick={handleClose}
            className="titlebar-btn h-full px-3 flex items-center justify-center hover:bg-destructive/80 hover:text-destructive-foreground transition-colors rounded-tr-none"
            aria-label="Close"
          >
            <X size={14} className="text-muted-foreground hover:text-destructive-foreground" />
          </button>
        </div>
    </div>
  );
};

export default Titlebar;
