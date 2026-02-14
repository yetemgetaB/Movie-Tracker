import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Grid3X3, List, X, Tv, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { tmdbSeriesApi, img, type TmdbSeries } from "@/lib/tmdb";
import SeriesDetailView from "@/components/SeriesDetailView";

const SeriesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setSelectedSeriesId(Number(id));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Live autocomplete
  const { data: suggestions = [] } = useQuery({
    queryKey: ["series-autocomplete", query],
    queryFn: () => tmdbSeriesApi.search(query),
    enabled: query.length >= 2 && !searchTerm,
    staleTime: 1000 * 30,
  });

  // Full search on Enter
  const { data: searchResults = [], isFetching } = useQuery({
    queryKey: ["series-search", searchTerm],
    queryFn: () => tmdbSeriesApi.search(searchTerm),
    enabled: searchTerm.length >= 2,
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearchTerm(query);
  };

  const handleSelect = (series: TmdbSeries) => {
    setSelectedSeriesId(series.id);
    setSearchTerm("");
    setQuery("");
  };

  const handleBack = () => setSelectedSeriesId(null);

  if (selectedSeriesId) {
    return (
      <SeriesDetailView
        seriesId={selectedSeriesId}
        onBack={handleBack}
        onSelectSeries={setSelectedSeriesId}
      />
    );
  }

  const showSuggestions = query.length >= 2 && !searchTerm && suggestions.length > 0;

  return (
    <div className="px-6 pt-6 space-y-6">
      {/* Header */}
      <div className="fade-up">
        <h1 className="text-2xl font-bold font-display">
          <Tv size={24} className="inline mr-2 text-primary" />
          Series
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Search, explore, and track your series</p>
      </div>

      {/* Search Bar */}
      <div className="relative fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search series..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (searchTerm) setSearchTerm("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setSearchTerm(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button onClick={handleSearch} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Search
          </Button>
        </div>

        {/* Autocomplete Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-panel-strong border border-border/50 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
            {suggestions.slice(0, 8).map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <img src={img(s.poster_path, "w92")} alt={s.name} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{s.first_air_date?.slice(0, 4)}</span>
                    {s.vote_average > 0 && (
                      <span className="flex items-center gap-0.5 text-primary">
                        <Star size={10} fill="currentColor" /> {s.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View Toggle */}
      {searchResults.length > 0 && (
        <div className="flex items-center justify-between fade-up" style={{ animationDelay: "0.15s" }}>
          <p className="text-sm text-muted-foreground">{searchResults.length} results</p>
          <div className="flex gap-1 glass-panel p-1">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
              <Grid3X3 size={16} />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
              <List size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {searchResults.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-3 gap-3">
            {searchResults.map((s) => (
              <div key={s.id} className="poster-card cursor-pointer" onClick={() => handleSelect(s)}>
                <img src={img(s.poster_path, "w342")} alt={s.name} className="w-full aspect-[2/3] object-cover rounded-lg" loading="lazy" />
                <div className="poster-overlay absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 transition-opacity flex flex-col justify-end p-2">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{s.first_air_date?.slice(0, 4)}</span>
                    {s.vote_average > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-primary">
                        <Star size={8} fill="currentColor" /> {s.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {searchResults.map((s) => (
              <div key={s.id} onClick={() => handleSelect(s)} className="glass-panel p-3 flex gap-3 card-hover cursor-pointer">
                <img src={img(s.poster_path, "w185")} alt={s.name} className="w-14 h-20 object-cover rounded-md flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.first_air_date?.slice(0, 4)}</p>
                  {s.vote_average > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} className="text-primary fill-primary" />
                      <span className="text-xs">{s.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.overview}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : !searchTerm && !showSuggestions ? (
        <div className="glass-panel p-12 text-center fade-up" style={{ animationDelay: "0.2s" }}>
          <Tv size={48} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Search for a TV series to get started</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Start typing to see live suggestions</p>
        </div>
      ) : isFetching ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SeriesPage;
