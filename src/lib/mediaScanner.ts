import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./db";
import { tmdbApi, tmdbSeriesApi, img } from "./tmdb";

export interface ScannedMediaFile {
  path: string;
  filename: string;
  size_bytes: number;
  modified_timestamp: number;
}

export interface ParsedMediaItem {
  type: "movie" | "series";
  rawFilename: string;
  title: string;
  year?: number;
  season?: number;
  episode?: number;
  resolution?: string;
  format: string;
  filePath: string;
  sizeFormatted: string;
  tmdbMatch?: {
    id: number;
    title: string;
    poster: string;
    backdrop?: string;
    overview: string;
    year?: string;
    rating?: number;
    episodeTitle?: string;
  };
}

export interface LocalSeriesGroup {
  seriesTitle: string;
  tmdbId?: number;
  poster?: string;
  backdrop?: string;
  overview?: string;
  rating?: number;
  seasons: {
    seasonNumber: number;
    episodes: ParsedMediaItem[];
  }[];
  totalEpisodes: number;
}

const FOLDERS_STORAGE_KEY = "movie_tracker_local_media_folders";
const TMDB_CACHE_KEY = "movie_tracker_local_tmdb_cache";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Extract resolution (4K, 1080p, 720p, etc.)
function extractResolution(str: string): string | undefined {
  if (/2160p|4k|uhd/i.test(str)) return "4K";
  if (/1080p|1080i/i.test(str)) return "1080p";
  if (/720p/i.test(str)) return "720p";
  if (/480p|576p|dvdrip/i.test(str)) return "SD";
  return undefined;
}

// Clean noisy tags
function cleanTitle(str: string): string {
  let cleaned = str
    .replace(/[._]/g, " ")
    .replace(/\[.*?\]|\(.*?\)/g, "")
    .replace(/\b(2160p|4k|1080p|1080i|720p|480p|576p)\b/gi, "")
    .replace(/\b(bluray|blu-ray|bdrip|brrip|web-dl|webdl|web-rip|webrip|hdrip|dvdrip|hdtv)\b/gi, "")
    .replace(/\b(x264|x265|h264|h265|hevc|av1|xvid|divx|10bit|8bit)\b/gi, "")
    .replace(/\b(aac|ac3|dts|dts-hd|truehd|ddp5\.1|dd5\.1|atmos|flac|mp3)\b/gi, "")
    .replace(/\b(remux|repack|proper|unrated|extended|directors\.cut|hdr|sdr)\b/gi, "")
    .replace(/\b(yify|yts|rarbg|eztv|sparks|dimension|fleet|psa|rartv)\b/gi, "")
    .trim();

  // Remove trailing dashes or spaces
  cleaned = cleaned.replace(/[-–—\s]+$/, "").trim();
  return cleaned;
}

export function parseFilename(filePath: string, filename: string, sizeBytes: number): ParsedMediaItem {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const base = filename.substring(0, filename.lastIndexOf(".")) || filename;
  const resolution = extractResolution(base);

  // 1. Check for Series (S01E02 or 1x02 or Season 1 Episode 2)
  const seriesPattern1 = /^(.*?)[ ._\-[{(]+[sS](\d{1,2})[eE](\d{1,2})/i;
  const match1 = base.match(seriesPattern1);
  if (match1) {
    const rawTitle = match1[1];
    const season = parseInt(match1[2], 10);
    const episode = parseInt(match1[3], 10);
    return {
      type: "series",
      rawFilename: filename,
      title: cleanTitle(rawTitle),
      season,
      episode,
      resolution,
      format: ext,
      filePath,
      sizeFormatted: formatBytes(sizeBytes),
    };
  }

  const seriesPattern2 = /^(.*?)[ ._\-[{(]+(\d{1,2})x(\d{1,2})/i;
  const match2 = base.match(seriesPattern2);
  if (match2) {
    const rawTitle = match2[1];
    const season = parseInt(match2[2], 10);
    const episode = parseInt(match2[3], 10);
    return {
      type: "series",
      rawFilename: filename,
      title: cleanTitle(rawTitle),
      season,
      episode,
      resolution,
      format: ext,
      filePath,
      sizeFormatted: formatBytes(sizeBytes),
    };
  }

  // 2. Check for Movie with Year (e.g. Inception 2010 or Interstellar.2014)
  const moviePattern = /^(.*?)[ ._\-[{(]+(19\d{2}|20\d{2})/i;
  const matchMovie = base.match(moviePattern);
  if (matchMovie) {
    const rawTitle = matchMovie[1];
    const year = parseInt(matchMovie[2], 10);
    return {
      type: "movie",
      rawFilename: filename,
      title: cleanTitle(rawTitle),
      year,
      resolution,
      format: ext,
      filePath,
      sizeFormatted: formatBytes(sizeBytes),
    };
  }

  // 3. Fallback: treat as Movie
  return {
    type: "movie",
    rawFilename: filename,
    title: cleanTitle(base),
    resolution,
    format: ext,
    filePath,
    sizeFormatted: formatBytes(sizeBytes),
  };
}

// Configured local folders
export function getSavedFolders(): string[] {
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFolders(folders: string[]): void {
  localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
}

// Native command wrappers
export async function pickFolderNative(): Promise<string | null> {
  if (!isTauri()) {
    console.warn("Folder picking is only available in Tauri desktop application.");
    return null;
  }
  try {
    const picked = await invoke<string | null>("pick_folder");
    return picked;
  } catch (err) {
    console.error("Failed to pick folder:", err);
    return null;
  }
}

export async function scanFolderNative(dirPath: string): Promise<ScannedMediaFile[]> {
  if (!isTauri()) return [];
  return await invoke<ScannedMediaFile[]>("scan_media_directory", { dirPath });
}

export async function launchMediaNative(filePath: string, customPlayerPath?: string): Promise<string> {
  if (!isTauri()) {
    console.warn("Media launch is only available in Tauri desktop application.");
    return "Web preview mode (simulation)";
  }
  return await invoke<string>("launch_media_file", {
    filePath,
    playerPath: customPlayerPath || null,
  });
}

export async function detectPotplayerNative(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<string | null>("detect_potplayer");
  } catch {
    return null;
  }
}

// Cache for TMDB matches to prevent excess API calls
function getTmdbCache(): Record<string, any> {
  try {
    const raw = localStorage.getItem(TMDB_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTmdbCache(cache: Record<string, any>): void {
  try {
    localStorage.setItem(TMDB_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

export async function matchMediaWithTmdb(item: ParsedMediaItem): Promise<ParsedMediaItem> {
  const cacheKey = `${item.type}:${item.title.toLowerCase()}:${item.year || ""}`;
  const cache = getTmdbCache();

  if (cache[cacheKey]) {
    return { ...item, tmdbMatch: cache[cacheKey] };
  }

  try {
    if (item.type === "series") {
      const res = await tmdbSeriesApi.search(item.title);
      const match = res?.results?.[0];
      if (match) {
        const matchData = {
          id: match.id,
          title: match.name,
          poster: img(match.poster_path, "w342"),
          backdrop: img(match.backdrop_path, "w780"),
          overview: match.overview,
          year: match.first_air_date?.slice(0, 4),
          rating: match.vote_average,
        };
        cache[cacheKey] = matchData;
        saveTmdbCache(cache);
        return { ...item, tmdbMatch: matchData };
      }
    } else {
      const res = await tmdbApi.search(item.title);
      let match = res?.results?.[0];
      if (item.year && res?.results) {
        const yearMatch = res.results.find(
          (m) => m.release_date && m.release_date.startsWith(String(item.year))
        );
        if (yearMatch) match = yearMatch;
      }
      if (match) {
        const matchData = {
          id: match.id,
          title: match.title,
          poster: img(match.poster_path, "w342"),
          backdrop: img(match.backdrop_path, "w780"),
          overview: match.overview,
          year: match.release_date?.slice(0, 4),
          rating: match.vote_average,
        };
        cache[cacheKey] = matchData;
        saveTmdbCache(cache);
        return { ...item, tmdbMatch: matchData };
      }
    }
  } catch (err) {
    console.error("TMDB match failed for", item.title, err);
  }

  return item;
}

// Group series into Series -> Season -> Episodes
export function groupSeriesEpisodes(items: ParsedMediaItem[]): LocalSeriesGroup[] {
  const map = new Map<string, LocalSeriesGroup>();

  items.forEach((item) => {
    const key = item.tmdbMatch?.title || item.title;
    if (!map.has(key)) {
      map.set(key, {
        seriesTitle: key,
        tmdbId: item.tmdbMatch?.id,
        poster: item.tmdbMatch?.poster,
        backdrop: item.tmdbMatch?.backdrop,
        overview: item.tmdbMatch?.overview,
        rating: item.tmdbMatch?.rating,
        seasons: [],
        totalEpisodes: 0,
      });
    }

    const group = map.get(key)!;
    group.totalEpisodes += 1;

    const seasonNum = item.season || 1;
    let seasonGroup = group.seasons.find((s) => s.seasonNumber === seasonNum);
    if (!seasonGroup) {
      seasonGroup = { seasonNumber: seasonNum, episodes: [] };
      group.seasons.push(seasonGroup);
    }
    seasonGroup.episodes.push(item);
  });

  // Sort seasons and episodes
  const result = Array.from(map.values());
  result.forEach((group) => {
    group.seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
    group.seasons.forEach((s) => {
      s.episodes.sort((a, b) => (a.episode || 0) - (b.episode || 0));
    });
  });

  return result.sort((a, b) => a.seriesTitle.localeCompare(b.seriesTitle));
}
