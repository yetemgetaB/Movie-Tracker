// Centralized genre definitions — single source of truth

export interface Genre {
  id: number;
  name: string;
  emoji?: string;
}

// TMDB Movie genres
export const MOVIE_GENRES: Genre[] = [
  { id: 28, name: "Action", emoji: "💥" },
  { id: 12, name: "Adventure", emoji: "🗺️" },
  { id: 16, name: "Animation", emoji: "🎨" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 80, name: "Crime", emoji: "🔍" },
  { id: 99, name: "Documentary", emoji: "📹" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 10751, name: "Family", emoji: "👨‍👩‍👧" },
  { id: 14, name: "Fantasy", emoji: "🧙" },
  { id: 36, name: "History", emoji: "📜" },
  { id: 27, name: "Horror", emoji: "👻" },
  { id: 10402, name: "Music", emoji: "🎵" },
  { id: 9648, name: "Mystery", emoji: "🕵️" },
  { id: 10749, name: "Romance", emoji: "💕" },
  { id: 878, name: "Sci-Fi", emoji: "🚀" },
  { id: 10770, name: "TV Movie", emoji: "📺" },
  { id: 53, name: "Thriller", emoji: "🔪" },
  { id: 10752, name: "War", emoji: "⚔️" },
  { id: 37, name: "Western", emoji: "🤠" },
];

// TMDB TV genres
export const TV_GENRES: Genre[] = [
  { id: 10759, name: "Action & Adventure", emoji: "⚔️" },
  { id: 16, name: "Animation", emoji: "🎨" },
  { id: 35, name: "Comedy", emoji: "😄" },
  { id: 80, name: "Crime", emoji: "🔎" },
  { id: 99, name: "Documentary", emoji: "📹" },
  { id: 18, name: "Drama", emoji: "🎬" },
  { id: 10751, name: "Family", emoji: "👨‍👩‍👧" },
  { id: 10762, name: "Kids", emoji: "🧒" },
  { id: 9648, name: "Mystery", emoji: "🕵️" },
  { id: 10763, name: "News", emoji: "📰" },
  { id: 10764, name: "Reality", emoji: "🎥" },
  { id: 10765, name: "Sci-Fi & Fantasy", emoji: "🌌" },
  { id: 10766, name: "Soap", emoji: "📺" },
  { id: 10767, name: "Talk", emoji: "🎤" },
  { id: 10768, name: "War & Politics", emoji: "⚔️" },
  { id: 37, name: "Western", emoji: "🤠" },
];

// ID → name lookup (movies + TV combined, movies take precedence)
export const GENRE_MAP: Record<number, string> = {};
TV_GENRES.forEach(g => { GENRE_MAP[g.id] = g.name; });
MOVIE_GENRES.forEach(g => { GENRE_MAP[g.id] = g.name; });

export function genreName(id: number): string {
  return GENRE_MAP[id] || "Unknown";
}

export function genreNames(ids: number[]): string[] {
  return ids.map(genreName).filter(n => n !== "Unknown");
}
