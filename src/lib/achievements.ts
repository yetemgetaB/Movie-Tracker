// Achievement / Gamification System

import { getCollection } from "./collection";

export interface Achievement {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalMovies: number;
  totalSeries: number;
  totalItems: number;
  uniqueGenres: number;
  totalRated: number;
  completedSeries: number;
  maxItemsInOneDay: number;
  longestStreak: number;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

const STORAGE_KEY = "movie_tracker_achievements";

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_movie",
    icon: "🎬",
    titleKey: "achievement.firstMovie",
    descKey: "achievement.firstMovieDesc",
    check: (s) => s.totalMovies >= 1,
  },
  {
    id: "first_series",
    icon: "📺",
    titleKey: "achievement.firstSeries",
    descKey: "achievement.firstSeriesDesc",
    check: (s) => s.totalSeries >= 1,
  },
  {
    id: "movie_buff",
    icon: "🎞️",
    titleKey: "achievement.movieBuff",
    descKey: "achievement.movieBuffDesc",
    check: (s) => s.totalMovies >= 10,
  },
  {
    id: "cinephile",
    icon: "🏆",
    titleKey: "achievement.cinephile",
    descKey: "achievement.cinephileDesc",
    check: (s) => s.totalMovies >= 50,
  },
  {
    id: "centurion",
    icon: "💯",
    titleKey: "achievement.centurion",
    descKey: "achievement.centurionDesc",
    check: (s) => s.totalMovies >= 100,
  },
  {
    id: "genre_explorer",
    icon: "🧭",
    titleKey: "achievement.genreExplorer",
    descKey: "achievement.genreExplorerDesc",
    check: (s) => s.uniqueGenres >= 5,
  },
  {
    id: "binge_watcher",
    icon: "🔥",
    titleKey: "achievement.bingeWatcher",
    descKey: "achievement.bingeWatcherDesc",
    check: (s) => s.maxItemsInOneDay >= 5,
  },
  {
    id: "critic",
    icon: "⭐",
    titleKey: "achievement.critic",
    descKey: "achievement.criticDesc",
    check: (s) => s.totalRated >= 50,
  },
  {
    id: "series_finisher",
    icon: "✅",
    titleKey: "achievement.seriesFinisher",
    descKey: "achievement.seriesFinisherDesc",
    check: (s) => s.completedSeries >= 5,
  },
  {
    id: "dedicated",
    icon: "🎯",
    titleKey: "achievement.dedicated",
    descKey: "achievement.dedicatedDesc",
    check: (s) => s.longestStreak >= 7,
  },
];

function getUnlocked(): UnlockedAchievement[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUnlocked(unlocked: UnlockedAchievement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
}

export function getAchievementStats(): AchievementStats {
  const collection = getCollection();
  const movies = collection.filter((i) => i.type === "movie");
  const series = collection.filter((i) => i.type === "series");

  // Unique genres
  const genres = new Set<string>();
  collection.forEach((item) => {
    (item.genre || "").split(",").forEach((g) => {
      const trimmed = g.trim();
      if (trimmed) genres.add(trimmed);
    });
  });

  // Rated count
  const rated = collection.filter(
    (i) => i.userRating && i.userRating !== "—" && !isNaN(parseFloat(i.userRating))
  );

  // Completed series — normalize status check
  const completedSeries = series.filter((s) => {
    const st = (s.status || "").trim().toLowerCase();
    return st === "yes" || st === "completed" || st === "ended" || st === "finished" || !!s.finishDate;
  });

  // Max items in one day
  const dayMap: Record<string, number> = {};
  collection.forEach((i) => {
    if (i.addedAt) {
      const day = i.addedAt.slice(0, 10);
      dayMap[day] = (dayMap[day] || 0) + 1;
    }
  });
  const maxItemsInOneDay = Math.max(0, ...Object.values(dayMap));

  // Longest streak
  const days = new Set<string>();
  collection.forEach((i) => {
    if (i.addedAt) days.add(i.addedAt.slice(0, 10));
  });
  const sorted = [...days].sort();
  let longest = sorted.length > 0 ? 1 : 0;
  let temp = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      temp++;
      if (temp > longest) longest = temp;
    } else {
      temp = 1;
    }
  }

  return {
    totalMovies: movies.length,
    totalSeries: series.length,
    totalItems: collection.length,
    uniqueGenres: genres.size,
    totalRated: rated.length,
    completedSeries: completedSeries.length,
    maxItemsInOneDay,
    longestStreak: longest,
  };
}

export function checkAchievements(): { newlyUnlocked: Achievement[] } {
  const stats = getAchievementStats();
  const unlocked = getUnlocked();
  const unlockedIds = new Set(unlocked.map((u) => u.id));
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!unlockedIds.has(achievement.id) && achievement.check(stats)) {
      newlyUnlocked.push(achievement);
      unlocked.push({ id: achievement.id, unlockedAt: new Date().toISOString() });
    }
  }

  if (newlyUnlocked.length > 0) {
    saveUnlocked(unlocked);
  }

  return { newlyUnlocked };
}

export function getUnlockedAchievements(): UnlockedAchievement[] {
  return getUnlocked();
}

export function getAllAchievementsWithStatus(): Array<Achievement & { unlocked: boolean; unlockedAt?: string }> {
  const unlocked = getUnlocked();
  const unlockedMap = new Map(unlocked.map((u) => [u.id, u]));

  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id)?.unlockedAt,
  }));
}
