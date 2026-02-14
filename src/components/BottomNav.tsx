import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { Home, Film, Tv, Database, Settings } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/movies", icon: Film, label: "Movies" },
  { to: "/series", icon: Tv, label: "Series" },
  { to: "/library", icon: Database, label: "Vault" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 nav-glow rounded-2xl px-5 py-3">
      <ul className="flex items-center gap-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || 
            (to !== "/" && location.pathname.startsWith(to));
          
          return (
            <li key={to}>
              <RouterNavLink
                to={to}
                className={`flex flex-col items-center gap-0.5 px-5 py-2.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-primary/15 glow-text"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </RouterNavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
