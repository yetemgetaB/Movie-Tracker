import { useState, useEffect, useCallback } from "react";

export type NavPosition = "bottom" | "top" | "left" | "right";

export interface NavSettings {
  position: NavPosition;
  autoHide: boolean;
  glowColor: string; // "accent" or hex like "#ff0000"
  order: string[]; // array of nav item paths in order
  visibleItems: string[]; // array of visible nav item paths
}

const DEFAULT_NAV_ITEMS = ["/", "/movies", "/series", "/browse", "/library", "/watchlist", "/calendar", "/analytics", "/settings"];

const STORAGE_KEY = "movie_tracker_nav_settings";

function getDefaults(): NavSettings {
  return {
    position: "bottom",
    autoHide: false,
    glowColor: "accent",
    order: [...DEFAULT_NAV_ITEMS],
    visibleItems: [...DEFAULT_NAV_ITEMS],
  };
}

function load(): NavSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaults();
    const parsed = JSON.parse(raw);
    return { ...getDefaults(), ...parsed };
  } catch {
    return getDefaults();
  }
}

function save(settings: NavSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("nav-settings-changed", { detail: settings }));
}

export function useNavSettings() {
  const [settings, setSettings] = useState<NavSettings>(load);

  const update = useCallback((partial: Partial<NavSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      save(next);
      return next;
    });
  }, []);

  const resetDefaults = useCallback(() => {
    const defaults = getDefaults();
    save(defaults);
    setSettings(defaults);
  }, []);

  return { settings, update, resetDefaults, DEFAULT_NAV_ITEMS };
}
