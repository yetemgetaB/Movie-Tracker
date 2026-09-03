import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dices, Sparkles, Star, Film, Tv, Clock, RotateCcw, ExternalLink } from "lucide-react";
import { getCollection, type CollectionItem } from "@/lib/collection";
import { WatchlistManager, type WatchlistItem } from "@/lib/watchlist";
import { tmdbApi, tmdbSeriesApi, img, type TmdbMovie, type TmdbSeries } from "@/lib/tmdb";
import MovieDetailView from "./MovieDetailView";
import SeriesDetailView from "./SeriesDetailView";

interface RouletteCandidate {
  id: number;
  title: string;
  type: "movie" | "series";
  poster: string;
  rating?: string | number;
  year?: string;
  runtime?: number;
  genre?: string;
  overview?: string;
}

interface RouletteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RouletteModal({ open, onOpenChange }: RouletteModalProps) {
  const [source, setSource] = useState<"watchlist" | "vault" | "trending_movies" | "trending_tv">("watchlist");
  const [mediaType, setMediaType] = useState<"all" | "movie" | "series">("all");
  const [minRating, setMinRating] = useState<string>("any");
  const [maxRuntime, setMaxRuntime] = useState<string>("any");

  const [isSpinning, setIsSpinning] = useState(false);
  const [displayItem, setDisplayItem] = useState<RouletteCandidate | null>(null);
  const [selectedItem, setSelectedItem] = useState<RouletteCandidate | null>(null);

  const [detailMovieId, setDetailMovieId] = useState<number | null>(null);
  const [detailSeriesId, setDetailSeriesId] = useState<number | null>(null);

  const [trendingMovies, setTrendingMovies] = useState<TmdbMovie[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<TmdbSeries[]>([]);

  // Fetch trending for roulette choices
  useEffect(() => {
    if (open && (source === "trending_movies" || source === "trending_tv")) {
      if (source === "trending_movies" && trendingMovies.length === 0) {
        tmdbApi.trending().then(setTrendingMovies).catch(() => {});
      } else if (source === "trending_tv" && trendingSeries.length === 0) {
        tmdbSeriesApi.trending().then(setTrendingSeries).catch(() => {});
      }
    }
  }, [open, source, trendingMovies.length, trendingSeries.length]);

  // Build filtered pool
  const candidatePool = useMemo(() => {
    let rawList: RouletteCandidate[] = [];

    if (source === "watchlist") {
      const items = WatchlistManager.getInstance().getWatchlist();
      rawList = items.map((w: WatchlistItem) => ({
        id: w.id,
        title: w.title,
        type: w.type,
        poster: w.poster,
        rating: w.imdb || w.userRating,
        year: w.year,
        runtime: undefined,
        genre: w.genre,
      }));
    } else if (source === "vault") {
      const items = getCollection();
      rawList = items.map((c: CollectionItem) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        poster: c.poster,
        rating: c.userRating || c.imdb,
        year: c.year,
        runtime: c.runtime,
        genre: c.genre,
      }));
    } else if (source === "trending_movies") {
      rawList = trendingMovies.map((m) => ({
        id: m.id,
        title: m.title,
        type: "movie" as const,
        poster: img(m.poster_path, "w500"),
        rating: m.vote_average.toFixed(1),
        year: m.release_date?.slice(0, 4),
        overview: m.overview,
      }));
    } else if (source === "trending_tv") {
      rawList = trendingSeries.map((s) => ({
        id: s.id,
        title: s.name,
        type: "series" as const,
        poster: img(s.poster_path, "w500"),
        rating: s.vote_average.toFixed(1),
        year: s.first_air_date?.slice(0, 4),
        overview: s.overview,
      }));
    }

    return rawList.filter((item) => {
      if (mediaType !== "all" && item.type !== mediaType) return false;
      if (minRating !== "any") {
        const r = parseFloat(String(item.rating || "0"));
        if (isNaN(r) || r < parseFloat(minRating)) return false;
      }
      if (maxRuntime !== "any" && item.runtime) {
        if (item.runtime > parseInt(maxRuntime, 10)) return false;
      }
      return true;
    });
  }, [source, mediaType, minRating, maxRuntime, trendingMovies, trendingSeries]);

  // Spin animation
  const handleSpin = useCallback(() => {
    if (candidatePool.length === 0) return;
    setIsSpinning(true);
    setSelectedItem(null);

    const duration = 1800;
    const interval = 60;
    const steps = Math.floor(duration / interval);
    let step = 0;

    const timer = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * candidatePool.length);
      setDisplayItem(candidatePool[randomIndex]);
      step++;

      if (step >= steps) {
        clearInterval(timer);
        const finalItem = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        setDisplayItem(finalItem);
        setSelectedItem(finalItem);
        setIsSpinning(false);
      }
    }, interval);
  }, [candidatePool]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl bg-card border-border/60 text-card-foreground p-6 shadow-2xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Dices className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                What to Watch Tonight
              </DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Can't decide? Let the cinematic roulette pick your next watch.
            </p>
          </DialogHeader>

          {/* Controls & Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Source
              </label>
              <Select value={source} onValueChange={(v: any) => { setSource(v); setSelectedItem(null); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="watchlist">Watchlist</SelectItem>
                  <SelectItem value="vault">My Vault</SelectItem>
                  <SelectItem value="trending_movies">Trending Movies</SelectItem>
                  <SelectItem value="trending_tv">Trending Series</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Type
              </label>
              <Select value={mediaType} onValueChange={(v: any) => setMediaType(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="movie">Movies</SelectItem>
                  <SelectItem value="series">Series</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Min Rating
              </label>
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="6.0">★ 6.0+</SelectItem>
                  <SelectItem value="7.0">★ 7.0+</SelectItem>
                  <SelectItem value="8.0">★ 8.0+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Max Runtime
              </label>
              <Select value={maxRuntime} onValueChange={setMaxRuntime}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="90">&lt; 90 min</SelectItem>
                  <SelectItem value="120">&lt; 120 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Roulette Card Display */}
          <div className="mt-4 relative rounded-xl border border-border/50 bg-secondary/30 p-5 flex flex-col items-center justify-center min-h-[280px] overflow-hidden">
            {displayItem ? (
              <div className="flex flex-col sm:flex-row items-center gap-5 w-full">
                <div className="relative w-32 h-48 rounded-lg overflow-hidden shrink-0 shadow-lg border border-border/50 bg-secondary">
                  <img
                    src={displayItem.poster || "/placeholder.svg"}
                    alt={displayItem.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0.5 px-1.5 backdrop-blur-md bg-background/80">
                      {displayItem.type === "movie" ? <Film size={10} className="mr-1 inline" /> : <Tv size={10} className="mr-1 inline" />}
                      {displayItem.type}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  {selectedItem && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles size={14} className="animate-spin text-primary" />
                      Tonight's Pick!
                    </div>
                  )}
                  <h3 className="text-xl font-bold tracking-tight line-clamp-2">
                    {displayItem.title}
                  </h3>

                  <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground">
                    {displayItem.year && <span>{displayItem.year}</span>}
                    {displayItem.rating && (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <Star size={12} fill="currentColor" />
                        {displayItem.rating}
                      </span>
                    )}
                    {displayItem.runtime && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {displayItem.runtime}m
                      </span>
                    )}
                  </div>

                  {displayItem.genre && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-1">
                      {displayItem.genre}
                    </p>
                  )}

                  {displayItem.overview && (
                    <p className="text-xs text-muted-foreground line-clamp-3 pt-1">
                      {displayItem.overview}
                    </p>
                  )}

                  {selectedItem && (
                    <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedItem.type === "movie") {
                            setDetailMovieId(selectedItem.id);
                          } else {
                            setDetailSeriesId(selectedItem.id);
                          }
                        }}
                        className="gap-1.5 h-8 text-xs font-semibold"
                      >
                        <ExternalLink size={13} />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSpin}
                        className="gap-1.5 h-8 text-xs"
                      >
                        <RotateCcw size={13} />
                        Spin Again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 py-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Dices className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Ready to roll?</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
                    {candidatePool.length} eligible titles match your current criteria.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Pool: <strong className="text-foreground">{candidatePool.length}</strong> titles
            </span>
            <Button
              onClick={handleSpin}
              disabled={isSpinning || candidatePool.length === 0}
              className="gap-2 px-6 font-semibold shadow-md"
            >
              <Dices className={`h-4 w-4 ${isSpinning ? "animate-spin" : ""}`} />
              {isSpinning ? "Rolling..." : "Spin Roulette"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details View modals if clicked */}
      {detailMovieId && (
        <MovieDetailView
          movieId={detailMovieId}
          onClose={() => setDetailMovieId(null)}
        />
      )}
      {detailSeriesId && (
        <SeriesDetailView
          seriesId={detailSeriesId}
          onClose={() => setDetailSeriesId(null)}
        />
      )}
    </>
  );
}
