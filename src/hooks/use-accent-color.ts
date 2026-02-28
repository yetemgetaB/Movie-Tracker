import { useState, useEffect } from "react";

export const ACCENT_PRESETS: Record<string, { primary: string; glow: string }> = {
  blue: { primary: "209 95% 48%", glow: "209 95% 55%" },
  purple: { primary: "260 70% 50%", glow: "260 70% 60%" },
  rose: { primary: "340 70% 50%", glow: "340 70% 60%" },
  amber: { primary: "45 90% 50%", glow: "45 90% 60%" },
  emerald: { primary: "160 70% 40%", glow: "160 70% 50%" },
  red: { primary: "0 90% 50%", glow: "0 90% 60%" },
};

export type AccentColor = keyof typeof ACCENT_PRESETS;

// Support both storage keys for backwards compatibility
const STORAGE_KEY = "movie_tracker_accent_color";
const LEGACY_KEY = "movie_tracker_accent";

function applyAccent(name: string) {
  const p = ACCENT_PRESETS[name];
  if (!p) return;
  const r = document.documentElement;
  r.style.setProperty("--primary", p.primary);
  r.style.setProperty("--accent", p.primary);
  r.style.setProperty("--glow", p.glow);
  r.style.setProperty("--ring", p.primary);
  r.style.setProperty("--sidebar-primary", p.primary);
  r.style.setProperty("--sidebar-ring", p.primary);
}

export function initAccentColor() {
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
  if (saved && ACCENT_PRESETS[saved]) applyAccent(saved);
}

export function useAccentColor() {
  const [accent, setAccentState] = useState<AccentColor>(
    () => {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
      return (saved as AccentColor) || "blue";
    }
  );

  const setAccent = (name: AccentColor) => {
    setAccentState(name);
    applyAccent(name);
    localStorage.setItem(STORAGE_KEY, name);
    localStorage.setItem(LEGACY_KEY, name); // keep legacy key in sync
  };

  useEffect(() => {
    applyAccent(accent);
  }, []);

  return { accent, setAccent };
}
