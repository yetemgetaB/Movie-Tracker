// API service layer - connect your backend endpoints here

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:8080/api";

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Movies
export const moviesApi = {
  search: (query: string) => request<Movie[]>(`/movies/search?q=${encodeURIComponent(query)}`),
  getDetails: (id: string) => request<MovieDetail>(`/movies/${id}`),
  addToCollection: (movie: AddMoviePayload) => request<void>("/movies/collection", { method: "POST", body: movie }),
  getCollection: () => request<Movie[]>("/movies/collection"),
};

// Series
export const seriesApi = {
  search: (query: string) => request<Series[]>(`/series/search?q=${encodeURIComponent(query)}`),
  getDetails: (id: string) => request<SeriesDetail>(`/series/${id}`),
  addToCollection: (series: AddSeriesPayload) => request<void>("/series/collection", { method: "POST", body: series }),
  getCollection: () => request<Series[]>("/series/collection"),
};

// Stats
export const statsApi = {
  getDashboard: () => request<DashboardStats>("/stats/dashboard"),
};

// Settings
export const settingsApi = {
  get: () => request<AppSettings>("/settings"),
  update: (settings: Partial<AppSettings>) => request<void>("/settings", { method: "PUT", body: settings }),
  exportData: () => request<Blob>("/settings/export"),
  importData: (data: FormData) =>
    fetch(`${API_BASE_URL}/settings/import`, { method: "POST", body: data }),
};

// Types
export interface Movie {
  id: string;
  title: string;
  poster: string;
  year: string;
  genre: string;
  rating_imdb?: string;
  rating_rt?: string;
}

export interface MovieDetail extends Movie {
  plot: string;
  director: string;
  writer: string;
  cast: string;
  runtime: string;
  rated: string;
  released: string;
  language: string;
  country: string;
  awards: string;
  trailer?: string;
  tags: string[];
  ratings: { source: string; value: string }[];
}

export interface AddMoviePayload {
  title: string;
  runtime: string;
  genre: string;
  watch_date: string;
  release_date: string;
  rate: number;
  rating_imdb: string;
  rating_rt: string;
  director: string;
  writer: string;
  rated: string;
  poster: string;
}

export interface Series {
  id: string;
  title: string;
  poster: string;
  year: string;
  genre: string;
  seasons: number;
  rating_imdb?: string;
  rating_rt?: string;
}

export interface SeriesDetail extends Series {
  plot: string;
  director: string;
  writer: string;
  cast: string;
  runtime: string;
  rated: string;
  released: string;
  total_seasons: string;
  status: string;
  next_season?: string;
  tags: string[];
  ratings: { source: string; value: string }[];
}

export interface AddSeriesPayload {
  title: string;
  season: number;
  episode: number;
  genre: string;
  start_date: string;
  finish_date: string;
  first_episode_date: string;
  rate: number;
  rating_imdb: string;
  rating_rt: string;
  finished: string;
  poster: string;
}

export interface DashboardStats {
  total_movies: number;
  total_series: number;
  recent_movies: Movie[];
  recent_series: Series[];
  genres_breakdown: { genre: string; count: number }[];
  monthly_additions: { month: string; movies: number; series: number }[];
}

export interface AppSettings {
  tmdb_api_key: string;
  omdb_api_key: string;
  data_path: string;
  theme: string;
}
