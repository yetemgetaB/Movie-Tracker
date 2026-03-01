import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Grid3X3, List, X, Film, Star, SlidersHorizontal,
  ChevronDown, Clock, User, Calendar, TrendingUp, History
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { tmdbApi, img, hasTmdbKey, type TmdbMovie } from "@/lib/tmdb";
import MovieDetailView from "@/components/MovieDetailView";
import { getCollection } from "@/lib/collection";
const GENRES = [
  { id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" }, { id: 80, name: "Crime" }, { id: 18, name: "Drama" },
  { id: 14, name: "Fantasy" }, { id: 27, name: "Horror" }, { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" }, { id: 878, name: "Sci-Fi" }, { id: 53, name: "Thriller" },
];

const SEARCH_HISTORY_KEY = "movie_tracker_search_history_movies";

function getSearchHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]"); } catch { return []; }
}

function addToSearchHistory(term: string) {
  const history = getSearchHistory().filter(h => h !== term).slice(0, 9);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify([term, ...history]));
}

const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Advanced filters
  const [yearRange, setYearRange] = useState([1980, new Date().getFullYear()]);
  const [ratingMin, setRatingMin] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [runtimeMax, setRuntimeMax] = useState(300);
  const [sortBy, setSortBy] = useState("popularity.desc");

  const hasKey = hasTmdbKey();

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setSelectedMovieId(Number(id));
      setSearchParams({}, { replace: true });
    }
    const genre = searchParams.get("genre");
    if (genre) {
      setSelectedGenre(Number(genre));
    }
  }, [searchParams, setSearchParams]);

  // Autocomplete
  const { data: suggestionsRaw } = useQuery({
    queryKey: ["movie-autocomplete", query],
    queryFn: () => tmdbApi.search(query),
    enabled: query.length >= 2 && !searchTerm && hasKey,
    staleTime: 1000 * 30,
  });
  const suggestions = suggestionsRaw?.results || [];

  // Full search
  const { data: searchResultsRaw, isFetching } = useQuery({
    queryKey: ["movie-search", searchTerm],
    queryFn: () => tmdbApi.search(searchTerm),
    enabled: searchTerm.length >= 2 && hasKey,
  });
  const searchResults = searchResultsRaw?.results || [];

  // Discover (when no search term, apply filters)
  const { data: discoverResults = [], isFetching: loadingDiscover } = useQuery({
    queryKey: ["movie-discover", selectedGenre, yearRange, ratingMin, runtimeMax, sortBy],
    queryFn: () => {
      const params: Record<string, string> = {
        sort_by: sortBy,
        "vote_average.gte": String(ratingMin),
        "primary_release_date.gte": `${yearRange[0]}-01-01`,
        "primary_release_date.lte": `${yearRange[1]}-12-31`,
        "with_runtime.lte": String(runtimeMax),
      };
      if (selectedGenre) params.with_genres = String(selectedGenre);
      return tmdbApi.discover(params);
    },
    enabled: !searchTerm && hasKey,
    staleTime: 1000 * 60 * 5,
  });

  // Trending for "you might also like"
  const collection = getCollection();
  const { data: trending = [] } = useQuery({
    queryKey: ["trending-movies-suggest"],
    queryFn: () => tmdbApi.trending(),
    enabled: hasKey && collection.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    addToSearchHistory(query.trim());
    setSearchTerm(query.trim());
    setShowHistory(false);
  }, [query]);

  const handleSelect = (movie: TmdbMovie) => {
    setSelectedMovieId(movie.id);
    setSearchTerm("");
    setQuery("");
  };

  const handleBack = () => setSelectedMovieId(null);

  if (selectedMovieId) {
    return (
      <MovieDetailView
        movieId={selectedMovieId}
        onBack={handleBack}
        onSelectMovie={setSelectedMovieId}
      />
    );
  }

  const history = getSearchHistory();
  const showSuggestions = query.length >= 2 && !searchTerm && suggestions.length > 0;
  const displayResults = searchTerm ? searchResults : discoverResults;
  const isLoading = isFetching || loadingDiscover;

  return (
    <div className="px-4 pt-6 space-y-5 pb-4">
      {/* Header */}
      <div className="fade-up px-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Film size={22} className="text-primary" /> Movies
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Search, filter & discover</p>
      </div>

      {/* Search Bar */}
      <div className="relative fade-up px-2" style={{ animationDelay: "0.1s" }}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search movies, actors, directors..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (searchTerm) setSearchTerm(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              className="pl-9 bg-secondary/50 border-border/50 focus:border-primary/50"
            />
            {query && (
              <button onClick={() => { setQuery(""); setSearchTerm(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          <Button onClick={handleSearch}>Search</Button>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <SlidersHorizontal size={15} />
          </Button>
        </div>

        {/* Search History */}
        {showHistory && !query && history.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-panel-strong border border-border/50 rounded-xl overflow-hidden">
            <div className="p-2 border-b border-border/30">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><History size={12} /> Recent Searches</p>
            </div>
            {history.slice(0, 6).map((h) => (
              <button
                key={h}
                onClick={() => { setQuery(h); setSearchTerm(h); setShowHistory(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors flex items-center gap-2"
              >
                <Clock size={12} className="text-muted-foreground" /> {h}
              </button>
            ))}
          </div>
        )}

        {/* Autocomplete */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-panel-strong border border-border/50 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
            {suggestions.slice(0, 8).map((movie) => (
              <button
                key={movie.id}
                onMouseDown={() => handleSelect(movie)}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <img src={img(movie.poster_path, "w92")} alt={movie.title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{movie.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{movie.release_date?.slice(0, 4)}</span>
                    {movie.vote_average > 0 && (
                      <span className="flex items-center gap-0.5 text-primary">
                        <Star size={10} fill="currentColor" /> {movie.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="glass-panel p-4 space-y-4 fade-up mx-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-primary" /> Advanced Filters
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Genre */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Genre</label>
              <Select
                value={selectedGenre ? String(selectedGenre) : "all"}
                onValueChange={(v) => setSelectedGenre(v === "all" ? null : Number(v))}
              >
                <SelectTrigger className="h-8 text-xs bg-secondary/50">
                  <SelectValue placeholder="All genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {GENRES.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 text-xs bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity.desc">Most Popular</SelectItem>
                  <SelectItem value="vote_average.desc">Top Rated</SelectItem>
                  <SelectItem value="primary_release_date.desc">Newest</SelectItem>
                  <SelectItem value="revenue.desc">Box Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Year Range */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Year Range: {yearRange[0]} – {yearRange[1]}
            </label>
            <Slider
              min={1900} max={new Date().getFullYear()}
              value={yearRange}
              onValueChange={setYearRange}
              step={1}
              className="py-1"
            />
          </div>

          {/* Min Rating */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Min Rating: {ratingMin}/10</label>
            <Slider min={0} max={10} step={0.5} value={[ratingMin]} onValueChange={([v]) => setRatingMin(v)} className="py-1" />
          </div>

          {/* Max Runtime */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Max Runtime: {runtimeMax >= 300 ? "Any" : `${runtimeMax} min`}
            </label>
            <Slider min={30} max={300} step={10} value={[runtimeMax]} onValueChange={([v]) => setRuntimeMax(v)} className="py-1" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setYearRange([1980, new Date().getFullYear()]);
              setRatingMin(0);
              setSelectedGenre(null);
              setRuntimeMax(300);
              setSortBy("popularity.desc");
            }}
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* Genre Quick Filter pills */}
      {!searchTerm && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-2 py-1">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selectedGenre ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
          >
            All
          </button>
          {GENRES.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedGenre === g.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* View Toggle */}
      {displayResults.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground">{displayResults.length}+ results</p>
          <div className="flex gap-1 glass-panel p-1 rounded-lg">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
              <Grid3X3 size={15} />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
              <List size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 px-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : displayResults.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-3 gap-3 px-2">
            {displayResults.map((movie) => (
              <div key={movie.id} className="poster-card cursor-pointer" onClick={() => handleSelect(movie)}>
                <img src={img(movie.poster_path, "w342")} alt={movie.title} className="w-full aspect-[2/3] object-cover rounded-lg" loading="lazy" />
                <div className="poster-overlay absolute inset-0 bg-gradient-to-t from-background/90 via-transparent opacity-0 transition-opacity flex flex-col justify-end p-2 rounded-lg">
                  <p className="text-xs font-medium truncate">{movie.title}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">{movie.release_date?.slice(0, 4)}</span>
                    {movie.vote_average > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-primary">
                        <Star size={8} fill="currentColor" /> {movie.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 px-2">
            {displayResults.map((movie) => (
              <div key={movie.id} onClick={() => handleSelect(movie)} className="glass-panel p-3 flex gap-3 card-hover cursor-pointer">
                <img src={img(movie.poster_path, "w185")} alt={movie.title} className="w-14 h-20 object-cover rounded-md flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{movie.title}</p>
                  <p className="text-xs text-muted-foreground">{movie.release_date?.slice(0, 4)}</p>
                  {movie.vote_average > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} className="text-primary fill-primary" />
                      <span className="text-xs">{movie.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{movie.overview}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : !searchTerm ? (
        // You might also like
        collection.length > 0 && trending.length > 0 ? (
          <div className="space-y-3 px-2">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" /> You Might Also Like
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {trending.slice(0, 9).map(movie => (
                <div key={movie.id} className="poster-card cursor-pointer" onClick={() => setSelectedMovieId(movie.id)}>
                  <img src={img(movie.poster_path, "w342")} alt={movie.title} className="w-full aspect-[2/3] object-cover rounded-lg" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-panel p-12 text-center fade-up mx-2">
            <Film size={48} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Search or use filters to discover movies</p>
          </div>
        )
      ) : null}
    </div>
  );
};

export default MoviesPage;
