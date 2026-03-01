import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Grid3X3, List, X, Tv, Star, SlidersHorizontal, History, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { tmdbSeriesApi, img, hasTmdbKey, type TmdbSeries } from "@/lib/tmdb";
import SeriesDetailView from "@/components/SeriesDetailView";

const GENRES = [
  { id: 10759, name: "Action & Adventure" }, { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" }, { id: 80, name: "Crime" }, { id: 18, name: "Drama" },
  { id: 10765, name: "Sci-Fi & Fantasy" }, { id: 9648, name: "Mystery" },
  { id: 10751, name: "Family" }, { id: 10762, name: "Kids" }, { id: 10763, name: "News" },
];

const HISTORY_KEY = "movie_tracker_search_history_series";

function getSearchHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function addToHistory(term: string) {
  const h = getSearchHistory().filter(x => x !== term).slice(0, 9);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([term, ...h]));
}

const SeriesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);


  const [yearRange, setYearRange] = useState([1990, new Date().getFullYear()]);
  const [ratingMin, setRatingMin] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("popularity.desc");

  const hasKey = hasTmdbKey();

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) { setSelectedSeriesId(Number(id)); setSearchParams({}, { replace: true }); }
  }, [searchParams, setSearchParams]);

  const { data: suggestionsRaw } = useQuery({
    queryKey: ["series-autocomplete", query],
    queryFn: () => tmdbSeriesApi.search(query),
    enabled: query.length >= 2 && !searchTerm && hasKey,
    staleTime: 1000 * 30,
  });
  const suggestions = suggestionsRaw?.results || [];

  const { data: searchResultsRaw, isFetching } = useQuery({
    queryKey: ["series-search", searchTerm],
    queryFn: () => tmdbSeriesApi.search(searchTerm),
    enabled: searchTerm.length >= 2 && hasKey,
  });
  const searchResults = searchResultsRaw?.results || [];

  const { data: discoverResults = [], isFetching: loadingDiscover } = useQuery({
    queryKey: ["series-discover", selectedGenre, yearRange, ratingMin, sortBy],
    queryFn: () => tmdbSeriesApi.discover({
      sort_by: sortBy,
      "vote_average.gte": String(ratingMin),
      "first_air_date.gte": `${yearRange[0]}-01-01`,
      "first_air_date.lte": `${yearRange[1]}-12-31`,
      ...(selectedGenre ? { with_genres: String(selectedGenre) } : {}),
    }),
    enabled: !searchTerm && hasKey,
    staleTime: 1000 * 60 * 5,
  });

  const { data: trending = [] } = useQuery({
    queryKey: ["trending-series"],
    queryFn: () => tmdbSeriesApi.trending(),
    enabled: hasKey,
    staleTime: 1000 * 60 * 10,
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    addToHistory(query.trim());
    setSearchTerm(query.trim());
    setShowHistory(false);
  };

  const handleSelect = (s: TmdbSeries) => {
    setSelectedSeriesId(s.id);
    setSearchTerm(""); setQuery("");
  };

  if (selectedSeriesId) {
    return (
      <SeriesDetailView
        seriesId={selectedSeriesId}
        onBack={() => setSelectedSeriesId(null)}
        onSelectSeries={setSelectedSeriesId}
      />
    );
  }

  const displayResults = searchTerm ? searchResults : discoverResults;
  const isLoading = isFetching || loadingDiscover;
  const history = getSearchHistory();
  const showSuggestions = query.length >= 2 && !searchTerm && suggestions.length > 0;

  return (
    <div className="px-4 pt-6 space-y-5 pb-4">
      <div className="fade-up px-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tv size={22} className="text-primary" /> Series
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Search, filter & discover shows</p>
      </div>

      {/* Search */}
      <div className="relative fade-up px-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search series..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (searchTerm) setSearchTerm(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              className="pl-9 bg-secondary/50 border-border/50 focus:border-primary/50"
            />
            {query && <button onClick={() => { setQuery(""); setSearchTerm(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14} /></button>}
          </div>
          <Button onClick={handleSearch}>Search</Button>
          <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={15} />
          </Button>
        </div>

        {/* History */}
        {showHistory && !query && history.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-panel-strong border border-border/50 rounded-xl overflow-hidden">
            <div className="p-2 border-b border-border/30"><p className="text-xs text-muted-foreground flex items-center gap-1.5"><History size={12} /> Recent Searches</p></div>
            {history.slice(0, 5).map(h => (
              <button key={h} onMouseDown={() => { setQuery(h); setSearchTerm(h); setShowHistory(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 flex items-center gap-2">
                <Clock size={12} className="text-muted-foreground" /> {h}
              </button>
            ))}
          </div>
        )}

        {/* Autocomplete */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-panel-strong border border-border/50 rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
            {suggestions.slice(0, 8).map(s => (
              <button key={s.id} onMouseDown={() => handleSelect(s)} className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left">
                <img src={img(s.poster_path, "w92")} alt={s.name} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{s.first_air_date?.slice(0, 4)}</span>
                    {s.vote_average > 0 && <span className="flex items-center gap-0.5 text-primary"><Star size={10} fill="currentColor" /> {s.vote_average.toFixed(1)}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass-panel p-4 space-y-4 fade-up mx-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><SlidersHorizontal size={14} className="text-primary" /> Filters</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Genre</label>
              <Select value={selectedGenre ? String(selectedGenre) : "all"} onValueChange={(v) => setSelectedGenre(v === "all" ? null : Number(v))}>
                <SelectTrigger className="h-8 text-xs bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {GENRES.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 text-xs bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity.desc">Most Popular</SelectItem>
                  <SelectItem value="vote_average.desc">Top Rated</SelectItem>
                  <SelectItem value="first_air_date.desc">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Year Range: {yearRange[0]} – {yearRange[1]}</label>
            <Slider min={1950} max={new Date().getFullYear()} value={yearRange} onValueChange={setYearRange} step={1} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Min Rating: {ratingMin}/10</label>
            <Slider min={0} max={10} step={0.5} value={[ratingMin]} onValueChange={([v]) => setRatingMin(v)} />
          </div>
          <Button variant="outline" size="sm" onClick={() => { setYearRange([1990, new Date().getFullYear()]); setRatingMin(0); setSelectedGenre(null); setSortBy("popularity.desc"); }}>Reset</Button>
        </div>
      )}

      {/* Genre pills */}
      {!searchTerm && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-2">
          <button onClick={() => setSelectedGenre(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selectedGenre ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>All</button>
          {GENRES.map(g => (
            <button key={g.id} onClick={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedGenre === g.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{g.name}</button>
          ))}
        </div>
      )}

      {/* View toggle */}
      {displayResults.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground">{displayResults.length}+ results</p>
          <div className="flex gap-1 glass-panel p-1 rounded-lg">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}><Grid3X3 size={15} /></button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}><List size={15} /></button>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 px-2">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-[2/3] rounded-lg bg-secondary/30 animate-pulse" />)}</div>
      ) : displayResults.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-3 gap-3 px-2">
            {displayResults.map(s => (
              <div key={s.id} className="poster-card cursor-pointer" onClick={() => handleSelect(s)}>
                <img src={img(s.poster_path, "w342")} alt={s.name} className="w-full aspect-[2/3] object-cover rounded-lg" loading="lazy" />
                <div className="poster-overlay absolute inset-0 bg-gradient-to-t from-background/90 via-transparent opacity-0 transition-opacity flex flex-col justify-end p-2 rounded-lg">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <span className="text-[10px] text-muted-foreground">{s.first_air_date?.slice(0, 4)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 px-2">
            {displayResults.map(s => (
              <div key={s.id} onClick={() => handleSelect(s)} className="glass-panel p-3 flex gap-3 card-hover cursor-pointer">
                <img src={img(s.poster_path, "w185")} alt={s.name} className="w-14 h-20 object-cover rounded-md flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.first_air_date?.slice(0, 4)}</p>
                  {s.vote_average > 0 && <div className="flex items-center gap-1 mt-1"><Star size={12} className="text-primary fill-primary" /><span className="text-xs">{s.vote_average.toFixed(1)}</span></div>}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.overview}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="glass-panel p-12 text-center fade-up mx-2">
          <Tv size={48} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Search or browse series</p>
        </div>
      )}

    </div>
  );
};

export default SeriesPage;
