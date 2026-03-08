// Per-episode watched state tracker (localStorage-based)

export interface EpisodeWatchState {
  seriesId: number;
  seasonNum: number;
  episodeNum: number;
  watched: boolean;
  watchedAt: string | null;
}

const KEY = "movie_tracker_episode_tracker";

function getAll(): EpisodeWatchState[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch { return []; }
}

function saveAll(states: EpisodeWatchState[]) {
  localStorage.setItem(KEY, JSON.stringify(states));
}

export function getEpisodeStates(seriesId: number): EpisodeWatchState[] {
  return getAll().filter(e => e.seriesId === seriesId);
}

export function getSeasonStates(seriesId: number, seasonNum: number): EpisodeWatchState[] {
  return getAll().filter(e => e.seriesId === seriesId && e.seasonNum === seasonNum);
}

export function isEpisodeWatched(seriesId: number, seasonNum: number, episodeNum: number): boolean {
  return getAll().some(e => e.seriesId === seriesId && e.seasonNum === seasonNum && e.episodeNum === episodeNum && e.watched);
}

export function toggleEpisode(seriesId: number, seasonNum: number, episodeNum: number): boolean {
  const all = getAll();
  const idx = all.findIndex(e => e.seriesId === seriesId && e.seasonNum === seasonNum && e.episodeNum === episodeNum);
  
  if (idx >= 0) {
    all[idx].watched = !all[idx].watched;
    all[idx].watchedAt = all[idx].watched ? new Date().toISOString() : null;
    saveAll(all);
    return all[idx].watched;
  } else {
    all.push({ seriesId, seasonNum, episodeNum, watched: true, watchedAt: new Date().toISOString() });
    saveAll(all);
    return true;
  }
}

export function markSeasonWatched(seriesId: number, seasonNum: number, totalEpisodes: number): void {
  const all = getAll().filter(e => !(e.seriesId === seriesId && e.seasonNum === seasonNum));
  for (let ep = 1; ep <= totalEpisodes; ep++) {
    all.push({ seriesId, seasonNum, episodeNum: ep, watched: true, watchedAt: new Date().toISOString() });
  }
  saveAll(all);
}

export function unmarkSeasonWatched(seriesId: number, seasonNum: number): void {
  const all = getAll().filter(e => !(e.seriesId === seriesId && e.seasonNum === seasonNum));
  saveAll(all);
}

export function getSeasonProgress(seriesId: number, seasonNum: number, totalEpisodes: number): { watched: number; total: number; percent: number } {
  const watched = getSeasonStates(seriesId, seasonNum).filter(e => e.watched).length;
  return {
    watched,
    total: totalEpisodes,
    percent: totalEpisodes > 0 ? Math.round((watched / totalEpisodes) * 100) : 0,
  };
}

export function getNextEpisode(seriesId: number, seasons: { seasonNum: number; episodeCount: number }[]): { season: number; episode: number } | null {
  for (const s of seasons) {
    for (let ep = 1; ep <= s.episodeCount; ep++) {
      if (!isEpisodeWatched(seriesId, s.seasonNum, ep)) {
        return { season: s.seasonNum, episode: ep };
      }
    }
  }
  return null;
}

export function getSeriesProgress(seriesId: number, totalEpisodes: number): number {
  const watched = getEpisodeStates(seriesId).filter(e => e.watched).length;
  return totalEpisodes > 0 ? Math.round((watched / totalEpisodes) * 100) : 0;
}
