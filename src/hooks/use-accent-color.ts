import { useState, useEffect } from "react";

export const ACCENT_PRESETS: Record<string, { primary: string; glow: string }> = {
  blue: { primary: "209 95% 24%", glow: "209 95% 35%" },
  purple: { primary: "260 70% 40%", glow: "260 70% 50%" },
  rose: { primary: "340 70% 45%", glow: "340 70% 55%" },
  amber: { primary: "45 90% 45%", glow: "45 90% 55%" },
  emerald: { primary: "160 70% 35%", glow: "160 70% 45%" },
};

export type AccentColor = keyof typeof ACCENT_PRESETS;

const STORAGE_KEY = "movie_tracker_accent_color";

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
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && ACCENT_PRESETS[saved]) applyAccent(saved);
}

export function useAccentColor() {
  const [accent, setAccentState] = useState<AccentColor>(
    () => (localStorage.getItem(STORAGE_KEY) as AccentColor) || "blue"
  );

  const setAccent = (name: AccentColor) => {
    setAccentState(name);
    applyAccent(name);
    localStorage.setItem(STORAGE_KEY, name);
  };

  useEffect(() => {
    applyAccent(accent);
  }, []);

  return { accent, setAccent };
}
