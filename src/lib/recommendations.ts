// Smart Recommendations Engine — algorithm-based, no AI

import { getCollection, type CollectionItem } from "./collection";
import { tmdbApi, tmdbSeriesApi, type TmdbMovie, type TmdbSeries } from "./tmdb";

interface UserProfile {
  topGenres: { name: string; count: number }[];
  topDirectors: string[];
  topActors: string[];
  avgRating: number;
  preferredDecade: string;
}

export function buildUserProfile(): UserProfile {
  const collection = getCollection();
  if (collection.length === 0) {
    return { topGenres: [], topDirectors: [], topActors: [], avgRating: 7, preferredDecade: "2020s" };
  }

  // Genre analysis
  const genreCounts: Record<string, number> = {};
  collection.forEach((item) => {
    (item.genre || "").split(",").forEach((g) => {
      const t = g.trim();
      if (t) genreCounts[t] = (genreCounts[t] || 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Director analysis
  const dirCounts: Record<string, number> = {};
  collection.forEach((i) => {
    if (i.director && i.director !== "—") {
      dirCounts[i.director] = (dirCounts[i.director] || 0) + 1;
    }
  });
  const topDirectors = Object.entries(dirCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  // Actor analysis
  const actorCounts: Record<string, number> = {};
  collection.forEach((i) => {
    if (i.stars && i.stars !== "—") {
      i.stars.split(",").forEach((a) => {
        const t = a.trim();
        if (t) actorCounts[t] = (actorCounts[t] || 0) + 1;
      });
    }
  });
  const topActors = Object.entries(actorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  // Average rating
  const rated = collection.filter(
    (i) => i.userRating && i.userRating !== "—" && !isNaN(parseFloat(i.userRating))
  );
  const avgRating = rated.length
    ? rated.reduce((s, i) => s + parseFloat(i.userRating), 0) / rated.length
    : 7;

  // Preferred decade
  const decadeCounts: Record<string, number> = {};
  collection.forEach((i) => {
    if (i.year) {
      const d = `${Math.floor(parseInt(i.year) / 10) * 10}s`;
      decadeCounts[d] = (decadeCounts[d] || 0) + 1;
    }
  });
  const preferredDecade =
    Object.entries(decadeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "2020s";

  return { topGenres, topDirectors, topActors, avgRating, preferredDecade };
}

export function scoreMovie(movie: TmdbMovie, profile: UserProfile, genreMap: Record<number, string>): number {
  let score = 0;
  const movieGenres = (movie.genre_ids || []).map((id) => genreMap[id]).filter(Boolean);

  // Genre overlap scoring (max 50)
  const profileGenreNames = profile.topGenres.map((g) => g.name);
  const genreOverlap = movieGenres.filter((g) => profileGenreNames.includes(g)).length;
  score += genreOverlap * 15;

  // Rating proximity scoring (max 20)
  const ratingDiff = Math.abs(movie.vote_average - profile.avgRating);
  score += Math.max(0, 20 - ratingDiff * 4);

  // Decade match (max 10)
  const movieDecade = movie.release_date ? `${Math.floor(parseInt(movie.release_date) / 10) * 10}s` : "";
  if (movieDecade === profile.preferredDecade) score += 10;

  // Popularity bonus (max 10)
  score += Math.min(10, movie.vote_average);

  // Freshness bonus for newer movies
  const year = parseInt(movie.release_date?.slice(0, 4) || "0");
  if (year >= new Date().getFullYear() - 2) score += 5;

  return Math.round(score);
}

export async function getRecommendedMovies(): Promise<(TmdbMovie & { matchScore: number })[]> {
  const collection = getCollection();
  const collectionIds = new Set(collection.map((c) => c.id));
  const profile = buildUserProfile();

  if (profile.topGenres.length === 0) return [];

  // Build genre map from TMDB
  let genreMap: Record<number, string> = {};
  try {
    const genres = await tmdbApi.genreList();
    genres.forEach((g) => (genreMap[g.id] = g.name));
  } catch {
    // fallback
  }

  // Discover movies based on top genres
  const topGenreIds = Object.entries(genreMap)
    .filter(([_, name]) => profile.topGenres.some((g) => g.name === name))
    .map(([id]) => id)
    .slice(0, 3);

  let movies: TmdbMovie[] = [];
  try {
    movies = await tmdbApi.discover({
      with_genres: topGenreIds.join(","),
      sort_by: "vote_average.desc",
      "vote_count.gte": "100",
      "vote_average.gte": String(Math.max(5, profile.avgRating - 2)),
    });
  } catch {
    return [];
  }

  // Filter out already in collection and score
  const scored = movies
    .filter((m) => !collectionIds.has(m.id))
    .map((m) => ({ ...m, matchScore: scoreMovie(m, profile, genreMap) }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20);

  return scored;
}

export async function getRecommendedSeries(): Promise<(TmdbSeries & { matchScore: number })[]> {
  const collection = getCollection();
  const collectionIds = new Set(collection.map((c) => c.id));
  const profile = buildUserProfile();

  if (profile.topGenres.length === 0) return [];

  let genreMap: Record<number, string> = {};
  try {
    const genres = await tmdbApi.tvGenreList();
    genres.forEach((g) => (genreMap[g.id] = g.name));
  } catch {}

  const topGenreIds = Object.entries(genreMap)
    .filter(([_, name]) => profile.topGenres.some((g) => g.name === name))
    .map(([id]) => id)
    .slice(0, 3);

  let series: TmdbSeries[] = [];
  try {
    series = await tmdbSeriesApi.discover({
      with_genres: topGenreIds.join(","),
      sort_by: "vote_average.desc",
      "vote_count.gte": "100",
    });
  } catch {
    return [];
  }

  const scored = series
    .filter((s) => !collectionIds.has(s.id))
    .map((s) => {
      const genres = (s.genre_ids || []).map((id) => genreMap[id]).filter(Boolean);
      const profileGenreNames = profile.topGenres.map((g) => g.name);
      const overlap = genres.filter((g) => profileGenreNames.includes(g)).length;
      let score = overlap * 15 + Math.min(10, s.vote_average);
      return { ...s, matchScore: Math.round(score) };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20);

  return scored;
}
