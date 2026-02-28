import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Film, Tv, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { tmdbApi, tmdbSeriesApi, img, hasTmdbKey } from "@/lib/tmdb";
import { Badge } from "@/components/ui/badge";
import MovieDetailView from "@/components/MovieDetailView";
import SeriesDetailView from "@/components/SeriesDetailView";

const MOVIE_GENRES = [
  { id: 28, name: "Action", emoji: "💥" }, { id: 35, name: "Comedy", emoji: "😂" },
  { id: 18, name: "Drama", emoji: "🎭" }, { id: 27, name: "Horror", emoji: "👻" },
  { id: 878, name: "Sci-Fi", emoji: "🚀" }, { id: 10749, name: "Romance", emoji: "💕" },
  { id: 53, name: "Thriller", emoji: "🔪" }, { id: 14, name: "Fantasy", emoji: "🧙" },
  { id: 12, name: "Adventure", emoji: "🗺️" }, { id: 80, name: "Crime", emoji: "🔍" },
];

const TV_GENRES = [
  { id: 10759, name: "Action & Adventure", emoji: "⚔️" }, { id: 35, name: "Comedy", emoji: "😄" },
  { id: 18, name: "Drama", emoji: "🎬" }, { id: 10765, name: "Sci-Fi & Fantasy", emoji: "🌌" },
  { id: 9648, name: "Mystery", emoji: "🕵️" }, { id: 80, name: "Crime", emoji: "🔎" },
];

const BrowsePage = () => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<{ id: number; type: "movie" | "series" } | null>(null);
  const hasKey = hasTmdbKey();

  const handleGenreClick = (genreId: number, type: "movie" | "series") => {
    if (type === "movie") navigate(`/movies?genre=${genreId}`);
    else navigate(`/series?genre=${genreId}`);
  };

  if (selectedItem) {
    if (selectedItem.type === "movie") return <MovieDetailView movieId={selectedItem.id} onBack={() => setSelectedItem(null)} onSelectMovie={id => setSelectedItem({ id, type: "movie" })} />;
    return <SeriesDetailView seriesId={selectedItem.id} onBack={() => setSelectedItem(null)} onSelectSeries={id => setSelectedItem({ id, type: "series" })} />;
  }

  return (
    <div className="px-4 pt-6 space-y-6 pb-4">
      <div className="px-2">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Compass size={22} className="text-primary" /> Browse</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Explore by genre</p>
      </div>

      <div className="px-2 space-y-2">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Film size={14} className="text-primary" /> Movies by Genre</h2>
        <div className="grid grid-cols-2 gap-2">
          {MOVIE_GENRES.map(g => (
            <button
              key={g.id}
              onClick={() => handleGenreClick(g.id, "movie")}
              className="glass-panel p-3 flex items-center gap-3 card-hover text-left"
            >
              <span className="text-2xl">{g.emoji}</span>
              <span className="text-sm font-medium">{g.name}</span>
              <ChevronRight size={14} className="ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 space-y-2">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Tv size={14} className="text-primary" /> Series by Genre</h2>
        <div className="grid grid-cols-2 gap-2">
          {TV_GENRES.map(g => (
            <button
              key={g.id}
              onClick={() => handleGenreClick(g.id, "series")}
              className="glass-panel p-3 flex items-center gap-3 card-hover text-left"
            >
              <span className="text-2xl">{g.emoji}</span>
              <span className="text-sm font-medium">{g.name}</span>
              <ChevronRight size={14} className="ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrowsePage;
