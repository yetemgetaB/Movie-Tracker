// TMDB + OMDB API service layer — direct API calls

const TMDB_BASE = "https://api.themoviedb.org/3";
const OMDB_BASE = "https://www.omdbapi.com";
const TMDB_IMG = "https://image.tmdb.org/t/p";

function getApiKey(keyName: string): string {
  const key = localStorage.getItem(`movie_tracker_${keyName}`);
  if (!key) {
    throw new Error(`API key not found. Please set your ${keyName} in Settings.`);
  }
  return key;
}

const getTmdbKey = () => getApiKey('tmdb_key');
const getOmdbKey = () => getApiKey('omdb_key');

export const img = (path: string | null, size = "w500") =>
  path ? `${TMDB_IMG}/${size}${path}` : "/placeholder.svg";

export const imgOriginal = (path: string | null) => img(path, "original");

async function tmdb<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  const apiKey = getTmdbKey();
  url.searchParams.set("api_key", apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  return res.json();
}

async function omdb<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(OMDB_BASE);
  const apiKey = getOmdbKey();
  url.searchParams.set("apikey", apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`OMDB Error: ${res.status}`);
  return res.json();
}

// --- TMDB Types ---
export interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TmdbMovieDetail {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number;
  runtime: number;
  genres: { id: number; name: string }[];
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
  imdb_id: string | null;
  production_companies: { name: string }[];
  spoken_languages: { english_name: string }[];
}

export interface TmdbCredits {
  cast: { id: number; name: string; character: string; profile_path: string | null; order: number }[];
  crew: { id: number; name: string; job: string; department: string }[];
}

export interface TmdbVideos {
  results: { key: string; site: string; type: string; name: string }[];
}

export interface TmdbKeywords {
  keywords: { id: number; name: string }[];
}

// --- OMDB Types ---
export interface OmdbDetail {
  Title: string;
  Rated: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Awards: string;
  Ratings: { Source: string; Value: string }[];
  imdbRating: string;
  imdbVotes: string;
  Response: string;
}

// --- Movie API ---
export const tmdbApi = {
  trending: () =>
    tmdb<{ results: TmdbMovie[] }>("/trending/movie/week").then((r) => r.results),
  popular: () =>
    tmdb<{ results: TmdbMovie[] }>("/movie/popular").then((r) => r.results),
  topRated: () =>
    tmdb<{ results: TmdbMovie[] }>("/movie/top_rated").then((r) => r.results),
  nowPlaying: () =>
    tmdb<{ results: TmdbMovie[] }>("/movie/now_playing").then((r) => r.results),
  search: (query: string) =>
    tmdb<{ results: TmdbMovie[] }>("/search/movie", { query }).then((r) => r.results),
  details: (id: number) => tmdb<TmdbMovieDetail>(`/movie/${id}`),
  credits: (id: number) => tmdb<TmdbCredits>(`/movie/${id}/credits`),
  videos: (id: number) =>
    tmdb<TmdbVideos>(`/movie/${id}/videos`).then((r) => r.results),
  keywords: (id: number) =>
    tmdb<TmdbKeywords>(`/movie/${id}/keywords`).then((r) => r.keywords),
  similar: (id: number) =>
    tmdb<{ results: TmdbMovie[] }>(`/movie/${id}/similar`).then((r) => r.results),
  discoverByKeyword: (keywordId: number) =>
    tmdb<{ results: TmdbMovie[] }>("/discover/movie", { with_keywords: String(keywordId) }).then((r) => r.results),
};

export const omdbApi = {
  getByImdbId: (imdbId: string) => omdb<OmdbDetail>({ i: imdbId }),
};

// --- Series ---
export interface TmdbSeries {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  overview: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TmdbSeriesDetail {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  overview: string;
  vote_average: number;
  number_of_seasons: number;
  number_of_episodes: number;
  genres: { id: number; name: string }[];
  tagline: string;
  status: string;
  type: string;
  created_by: { id: number; name: string }[];
  networks: { id: number; name: string; logo_path: string | null }[];
  seasons: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    air_date: string | null;
    poster_path: string | null;
    overview: string;
    vote_average: number;
  }[];
  next_episode_to_air: { air_date: string; season_number: number; episode_number: number } | null;
  external_ids?: { imdb_id: string | null };
}

export interface TmdbEpisode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  vote_average: number;
  air_date: string;
  overview: string;
}

export interface TmdbSeasonDetail {
  id: number;
  name: string;
  season_number: number;
  episodes: TmdbEpisode[];
}

export const tmdbSeriesApi = {
  trending: () =>
    tmdb<{ results: TmdbSeries[] }>("/trending/tv/week").then((r) => r.results),
  popular: () =>
    tmdb<{ results: TmdbSeries[] }>("/tv/popular").then((r) => r.results),
  search: (query: string) =>
    tmdb<{ results: TmdbSeries[] }>("/search/tv", { query }).then((r) => r.results),
  details: (id: number) =>
    tmdb<TmdbSeriesDetail>(`/tv/${id}`, { append_to_response: "external_ids" }),
  credits: (id: number) => tmdb<TmdbCredits>(`/tv/${id}/credits`),
  videos: (id: number) =>
    tmdb<TmdbVideos>(`/tv/${id}/videos`).then((r) => r.results),
  similar: (id: number) =>
    tmdb<{ results: TmdbSeries[] }>(`/tv/${id}/similar`).then((r) => r.results),
  seasonDetails: (seriesId: number, seasonNumber: number) =>
    tmdb<TmdbSeasonDetail>(`/tv/${seriesId}/season/${seasonNumber}`),
  seasonVideos: (seriesId: number, seasonNumber: number) =>
    tmdb<TmdbVideos>(`/tv/${seriesId}/season/${seasonNumber}/videos`).then((r) => r.results),
};
