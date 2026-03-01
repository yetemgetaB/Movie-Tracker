// Continue watching / watch progress tracker
export interface WatchProgress {
  id: number;
  type: "movie" | "series";
  title: string;
  poster: string;
  progressPercent: number; // 0-100
  lastWatchedAt: string;
  // For series
  currentSeason?: number;
  currentEpisode?: number;
  totalEpisodes?: number;
}

const KEY = "movie_tracker_watch_progress";

export function getWatchProgress(): WatchProgress[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

export function saveProgress(item: Omit<WatchProgress, 'lastWatchedAt'>): void {
  const all = getWatchProgress();
  const idx = all.findIndex(i => i.id === item.id);
  const updated: WatchProgress = { ...item, lastWatchedAt: new Date().toISOString() };
  if (idx >= 0) all[idx] = updated;
  else all.unshift(updated);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 20)));
}

export function getProgress(id: number): WatchProgress | undefined {
  return getWatchProgress().find(i => i.id === id);
}

export function removeProgress(id: number): void {
  const all = getWatchProgress().filter(i => i.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
