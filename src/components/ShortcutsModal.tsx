import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard, Command, Compass, Film, Tv, Database, Clock, CalendarDays, BarChart3, Settings, Dices } from "lucide-react";

interface ShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  icon?: any;
}

export default function ShortcutsModal({ open, onOpenChange }: ShortcutsModalProps) {
  const navigationShortcuts: ShortcutItem[] = [
    { keys: ["1"], description: "Home page", icon: Compass },
    { keys: ["2"], description: "Movies discover", icon: Film },
    { keys: ["3"], description: "TV Series discover", icon: Tv },
    { keys: ["4"], description: "Browse genres", icon: Compass },
    { keys: ["5"], description: "My Library / Vault", icon: Database },
    { keys: ["6"], description: "Watchlist", icon: Clock },
    { keys: ["7"], description: "Release Calendar", icon: CalendarDays },
    { keys: ["8"], description: "Analytics & Achievements", icon: BarChart3 },
    { keys: ["9"], description: "Settings & Preferences", icon: Settings },
  ];

  const actionShortcuts: ShortcutItem[] = [
    { keys: ["Ctrl / ⌘", "K"], description: "Open Command Palette & Global Search", icon: Command },
    { keys: ["/"], description: "Quick Search", icon: Command },
    { keys: ["R"], description: "What to Watch Tonight Roulette", icon: Dices },
    { keys: ["?"], description: "Toggle Shortcuts Cheat Sheet", icon: Keyboard },
    { keys: ["Esc"], description: "Close any modal or dialog" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border/60 text-card-foreground p-6 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Keyboard className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Keyboard Shortcuts
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Navigate and control Movie Tracker faster with native keybindings.
          </p>
        </DialogHeader>

        <div className="space-y-5 pt-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* Action shortcuts */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Actions
            </h4>
            <div className="space-y-1.5">
              {actionShortcuts.map((sc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded-md hover:bg-secondary/40 transition-colors"
                >
                  <span className="text-foreground/90 font-medium">{sc.description}</span>
                  <div className="flex items-center gap-1">
                    {sc.keys.map((k, ki) => (
                      <kbd
                        key={ki}
                        className="px-2 py-0.5 text-[11px] font-mono bg-secondary/80 border border-border/80 rounded shadow-sm text-foreground/90"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation shortcuts */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Page Navigation
            </h4>
            <div className="space-y-1.5">
              {navigationShortcuts.map((sc, i) => {
                const Icon = sc.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-md hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon size={13} className="text-muted-foreground" />}
                      <span className="text-foreground/90">{sc.description}</span>
                    </div>
                    <kbd className="px-2 py-0.5 text-[11px] font-mono bg-secondary/80 border border-border/80 rounded shadow-sm text-foreground/90">
                      {sc.keys[0]}
                    </kbd>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
