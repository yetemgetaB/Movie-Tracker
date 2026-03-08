// In-app Notification System

import WatchlistManager from "./watchlist";
import { tmdbApi, tmdbSeriesApi } from "./tmdb";

export interface AppNotification {
  id: string;
  type: "upcoming_movie" | "new_episode" | "achievement" | "info";
  title: string;
  message: string;
  tmdbId?: number;
  mediaType?: "movie" | "series";
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = "movie_tracker_notifications";
const NOTIFIED_KEY = "movie_tracker_notified_ids";

function getNotifications(): AppNotification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveNotifications(notifs: AppNotification[]) {
  // Keep only last 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, 50)));
}

function getNotifiedIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function addNotifiedId(id: string) {
  const ids = getNotifiedIds();
  ids.add(id);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids]));
}

export function getAllNotifications(): AppNotification[] {
  return getNotifications();
}

export function getUnreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

export function markAsRead(id: string) {
  const notifs = getNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(notifs);
}

export function markAllAsRead() {
  const notifs = getNotifications().map((n) => ({ ...n, read: true }));
  saveNotifications(notifs);
}

export function clearNotifications() {
  saveNotifications([]);
}

export function addNotification(notif: Omit<AppNotification, "id" | "createdAt" | "read">) {
  const notifs = getNotifications();
  notifs.unshift({
    ...notif,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
  });
  saveNotifications(notifs);
}

// Check watchlist items against upcoming releases
export async function checkWatchlistNotifications(): Promise<AppNotification[]> {
  const manager = WatchlistManager.getInstance();
  const watchlist = manager.getWatchlist();
  const notifiedIds = getNotifiedIds();
  const newNotifs: AppNotification[] = [];

  // Check for upcoming movies in watchlist
  const movieItems = watchlist.filter((w) => w.type === "movie");
  for (const item of movieItems.slice(0, 10)) {
    const notifKey = `movie-${item.id}`;
    if (notifiedIds.has(notifKey)) continue;

    try {
      const details = await tmdbApi.details(item.id);
      if (details.release_date) {
        const releaseDate = new Date(details.release_date);
        const now = new Date();
        const daysUntil = Math.ceil(
          (releaseDate.getTime() - now.getTime()) / 86400000
        );

        if (daysUntil > 0 && daysUntil <= 30) {
          const notif: Omit<AppNotification, "id" | "createdAt" | "read"> = {
            type: "upcoming_movie",
            title: `🎬 ${item.title}`,
            message: `Releases in ${daysUntil} day${daysUntil !== 1 ? "s" : ""} (${details.release_date})`,
            tmdbId: item.id,
            mediaType: "movie",
          };
          addNotification(notif);
          addNotifiedId(notifKey);
          newNotifs.push({
            ...notif,
            id: "",
            createdAt: new Date().toISOString(),
            read: false,
          });
        }
      }
    } catch {
      // Skip on error
    }
  }

  // Check for series next episodes
  const seriesItems = watchlist.filter((w) => w.type === "series");
  for (const item of seriesItems.slice(0, 10)) {
    const notifKey = `series-next-${item.id}`;
    if (notifiedIds.has(notifKey)) continue;

    try {
      const details = await tmdbSeriesApi.details(item.id);
      if (details.next_episode_to_air) {
        const airDate = new Date(details.next_episode_to_air.air_date);
        const now = new Date();
        const daysUntil = Math.ceil(
          (airDate.getTime() - now.getTime()) / 86400000
        );

        if (daysUntil >= 0 && daysUntil <= 7) {
          const ep = details.next_episode_to_air;
          const notif: Omit<AppNotification, "id" | "createdAt" | "read"> = {
            type: "new_episode",
            title: `📺 ${item.title}`,
            message: `S${ep.season_number}E${ep.episode_number} ${daysUntil === 0 ? "airs today!" : `airs in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`}`,
            tmdbId: item.id,
            mediaType: "series",
          };
          addNotification(notif);
          addNotifiedId(notifKey);
          newNotifs.push({
            ...notif,
            id: "",
            createdAt: new Date().toISOString(),
            read: false,
          });
        }
      }
    } catch {
      // Skip on error
    }
  }

  return newNotifs;
}
