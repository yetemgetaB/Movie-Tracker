import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Info, ChevronLeft, ChevronRight, Volume2, VolumeX, AlertCircle, Plus, Star, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { tmdbApi, tmdbSeriesApi, img, imgOriginal, hasTmdbKey, type TmdbMovie, type TmdbSeries } from "@/lib/tmdb";
import { useNavigate } from "react-router-dom";
import { getCollection } from "@/lib/collection";
import { getWatchProgress } from "@/lib/watchProgress";
import { toast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/use-online-status";
import MovieDetailView from "@/components/MovieDetailView";
import SeriesDetailView from "@/components/SeriesDetailView";


const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
};

// ─── Mini Carousel Row ────────────────────────────────────────────────────────
const ContentRow = ({
  title,
  badge,
  items,
  type = "movie",
  onSelectItem,
}: {
  title: string;
  badge?: string;
  items: { id: number; title: string; poster: string | null; backdrop: string | null; year: string; rating: number; overview?: string; genre_ids?: number[] }[];
  type?: "movie" | "series";
  onSelectItem: (id: number, type: "movie" | "series") => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll, items]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="group/row relative mb-8">
      <div className="flex items-center gap-3 mb-3 px-6">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {badge && <Badge variant="outline" className="text-primary border-primary/30 text-xs">{badge}</Badge>}
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-20 w-12 flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity hover:from-background/80"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-6 py-2"
        >
          {items.map((item) => (
            <MoviePosterCard
              key={item.id}
              item={item}
              type={type}
              onSelect={() => onSelectItem(item.id, type)}
            />
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-20 w-12 flex items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity hover:from-background/80"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Movie Poster Card ────────────────────────────────────────────────────────
const MoviePosterCard = ({
  item,
  type,
  onSelect,
}: {
  item: { id: number; title: string; poster: string | null; backdrop: string | null; year: string; rating: number; overview?: string; genre_ids?: number[] };
  type: "movie" | "series";
  onSelect: () => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const progress = getWatchProgress().find(p => p.id === item.id);
  const genres = (item.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 3);
  const matchScore = Math.round(40 + item.rating * 6);

  const handleEnter = () => {
    setHovered(true);
    timerRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cardW = 288;
        const cardH = 340;
        let left = rect.left + rect.width / 2 - cardW / 2;
        if (left + cardW > vw - 8) left = vw - cardW - 8;
        if (left < 8) left = 8;
        let top = rect.top - 20;
        if (top + cardH > vh - 16) top = rect.bottom - cardH + 20;
        if (top < 8) top = 8;
        setCardStyle({ position: "fixed", top, left, width: cardW, zIndex: 9999 });
        setShowCard(true);
      }
    }, 400);
  };

  const handleLeave = () => {
    clearTimeout(timerRef.current);
    setHovered(false);
    setShowCard(false);
  };

  return (
    <>
      <div
        ref={cardRef}
        className="relative flex-shrink-0 cursor-pointer transition-transform duration-200 hover:scale-105"
        style={{ width: "160px" }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={onSelect}
      >
        <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-secondary">
          <img
            src={img(item.poster)}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {progress && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div className="h-full bg-primary" style={{ width: `${progress.progressPercent}%` }} />
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground truncate">{item.title}</p>
      </div>

      {/* Hover expanded card */}
      {showCard && (
        <div
          style={cardStyle}
          className="rounded-xl overflow-hidden shadow-2xl border border-border/40 animate-in fade-in zoom-in-95 duration-150"
          onMouseEnter={() => { clearTimeout(timerRef.current); setShowCard(true); }}
          onMouseLeave={handleLeave}
          onClick={onSelect}
        >
          <div className="relative aspect-video overflow-hidden bg-secondary">
            <img
              src={img(item.backdrop || item.poster, "w780")}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3">
              <p className="font-bold text-sm line-clamp-1">{item.title}</p>
            </div>
          </div>

          <div className="p-3 space-y-2" style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
                style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
              >
                <Play size={13} fill="currentColor" />
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-foreground/50 transition-colors"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-foreground/50 transition-colors ml-auto"
              >
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold" style={{ color: "hsl(142 70% 45%)" }}>{matchScore}% Match</span>
              <span className="text-muted-foreground">{item.year}</span>
              <span className="border border-muted-foreground/30 px-1 rounded text-muted-foreground text-[10px]">
                {type === "series" ? "Series" : "Movie"}
              </span>
            </div>

            {genres.length > 0 && (
              <p className="text-[11px] text-muted-foreground">{genres.join(" • ")}</p>
            )}

            {item.overview && (
              <p className="text-[11px] text-muted-foreground line-clamp-2">{item.overview}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ─── No API Key prompt ────────────────────────────────────────────────────────
const NoApiKeyBanner = ({ onGoSettings }: { onGoSettings: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
    <div className="text-center space-y-4 max-w-md">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <AlertCircle size={32} className="text-primary" />
      </div>
      <h1 className="text-3xl font-bold">Welcome to Movie Tracker</h1>
      <p className="text-muted-foreground">
        To get started, you need to add your TMDB API key in Settings. It's free and only takes a minute!
      </p>
      <Button onClick={onGoSettings} size="lg" className="gap-2">
        Go to Settings
      </Button>
      <p className="text-xs text-muted-foreground">
        Get your free API key at{" "}
        <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          themoviedb.org
        </a>
      </p>
    </div>
  </div>
);

// ─── Hero Banner ──────────────────────────────────────────────────────────────
const HeroBanner = ({
  movie,
  trailerKey,
  onPlay,
  onMoreInfo,
}: {
  movie: TmdbMovie;
  trailerKey?: string;
  onPlay: () => void;
  onMoreInfo: () => void;
}) => {
  const [muted, setMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowVideo(!!trailerKey), 2000);
    return () => clearTimeout(timer);
  }, [trailerKey]);

  const genres = (movie.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 3);

  return (
    <div className="relative w-full h-[75vh] min-h-[500px] overflow-hidden">
      {/* Background */}
      {showVideo && trailerKey ? (
        <iframe
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&iv_load_policy=3`}
          className="absolute inset-0 w-full h-full scale-150 pointer-events-none"
          allow="autoplay"
          title="Hero trailer"
        />
      ) : (
        <img
          src={imgOriginal(movie.backdrop_path)}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-20 left-0 right-0 px-8 md:px-16 max-w-2xl">
        <div className="space-y-4 fade-up">
          <div className="flex items-center gap-2">
            {genres.map(g => (
              <Badge key={g} variant="outline" className="border-border/60 text-xs text-muted-foreground">{g}</Badge>
            ))}
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-none tracking-tight">{movie.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star size={13} fill="hsl(var(--primary))" className="text-primary" />
              {movie.vote_average.toFixed(1)}
            </span>
            <span>{movie.release_date?.slice(0, 4)}</span>
          </div>
          <p className="text-sm md:text-base text-muted-foreground line-clamp-3 max-w-lg">{movie.overview}</p>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={onPlay} size="lg" className="gap-2 px-8 font-bold">
              <Play size={18} fill="currentColor" /> Play
            </Button>
            <Button onClick={onMoreInfo} variant="secondary" size="lg" className="gap-2 px-6">
              <Info size={18} /> More Info
            </Button>
          </div>
        </div>
      </div>

      {/* Mute toggle */}
      {trailerKey && (
        <button
          onClick={() => setMuted(!muted)}
          className="absolute bottom-24 right-8 w-10 h-10 rounded-full border border-border/60 flex items-center justify-center hover:bg-secondary/50 transition-colors"
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
};

// ── Offline Banner ────────────────────────────────────────────────────────────
const OfflineBanner = () => (
  <div className="mx-6 mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3">
    <WifiOff size={18} className="text-yellow-500 flex-shrink-0" />
    <div>
      <p className="text-sm font-medium text-yellow-500">You're offline</p>
      <p className="text-xs text-muted-foreground">Showing your saved collection</p>
    </div>
  </div>
);

// ── Main HomePage ─────────────────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<{ id: number; type: "movie" | "series" } | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const hasKey = hasTmdbKey();
  const { isOnline } = useOnlineStatus();

  const { data: trendingMovies = [], isLoading: loadingTrending, isError: trendingError } = useQuery({
    queryKey: ["trending-movies"],
    queryFn: () => tmdbApi.trending(),
    enabled: hasKey && isOnline,
    staleTime: 1000 * 60 * 5,
  });

  const { data: trendingSeries = [] } = useQuery({
    queryKey: ["trending-series"],
    queryFn: () => tmdbSeriesApi.trending(),
    enabled: hasKey && isOnline,
    staleTime: 1000 * 60 * 5,
  });

  const { data: topRatedMovies = [] } = useQuery({
    queryKey: ["top-rated-movies"],
    queryFn: () => tmdbApi.topRated(),
    enabled: hasKey && isOnline,
    staleTime: 1000 * 60 * 10,
  });

  const { data: topRatedSeries = [] } = useQuery({
    queryKey: ["top-rated-series"],
    queryFn: () => tmdbSeriesApi.topRated(),
    enabled: hasKey && isOnline,
    staleTime: 1000 * 60 * 10,
  });

  const { data: nowPlayingMovies = [] } = useQuery({
    queryKey: ["now-playing"],
    queryFn: () => tmdbApi.nowPlaying(),
    enabled: hasKey && isOnline,
    staleTime: 1000 * 60 * 10,
  });

  const { data: popularSeries = [] } = useQuery({
    queryKey: ["popular-series"],
    queryFn: () => tmdbSeriesApi.popular(),
    enabled: hasKey && isOnline,
    staleTime: 1000 * 60 * 10,
  });

  const heroMovie = trendingMovies[heroIndex];
  const { data: heroVideos = [] } = useQuery({
    queryKey: ["hero-videos", heroMovie?.id],
    queryFn: () => tmdbApi.videos(heroMovie.id),
    enabled: !!heroMovie && isOnline,
    staleTime: 1000 * 60 * 30,
  });

  const trailerKey = heroVideos.find(v => v.site === "YouTube" && v.type === "Trailer")?.key
    || heroVideos.find(v => v.site === "YouTube")?.key;

  useEffect(() => {
    if (trendingMovies.length === 0) return;
    const t = setInterval(() => {
      setHeroIndex(i => (i + 1) % Math.min(trendingMovies.length, 5));
    }, 15000);
    return () => clearInterval(t);
  }, [trendingMovies.length]);

  const continueWatching = getWatchProgress();
  const collection = getCollection();

  const mapMovies = (items: TmdbMovie[]) => items.map(m => ({
    id: m.id,
    title: m.title,
    poster: m.poster_path,
    backdrop: m.backdrop_path,
    year: m.release_date?.slice(0, 4) || "",
    rating: m.vote_average,
    overview: m.overview,
    genre_ids: m.genre_ids,
  }));

  const mapSeries = (items: TmdbSeries[]) => items.map(s => ({
    id: s.id,
    title: s.name,
    poster: s.poster_path,
    backdrop: s.backdrop_path,
    year: s.first_air_date?.slice(0, 4) || "",
    rating: s.vote_average,
    overview: s.overview,
    genre_ids: s.genre_ids,
  }));

  const handleSelectItem = (id: number, type: "movie" | "series") => {
    setSelectedItem({ id, type });
  };

  if (!hasKey) {
    return <NoApiKeyBanner onGoSettings={() => navigate("/settings")} />;
  }

  if (selectedItem) {
    if (selectedItem.type === "movie") {
      return (
        <MovieDetailView
          movieId={selectedItem.id}
          onBack={() => setSelectedItem(null)}
          onSelectMovie={(id) => setSelectedItem({ id, type: "movie" })}
        />
      );
    }
    return (
      <SeriesDetailView
        seriesId={selectedItem.id}
        onBack={() => setSelectedItem(null)}
        onSelectSeries={(id) => setSelectedItem({ id, type: "series" })}
      />
    );
  }

  // Determine if we should show offline fallback
  const showOffline = !isOnline || (trendingError && trendingMovies.length === 0);
  const collectionMovies = collection.filter(c => c.type === "movie");
  const collectionSeries = collection.filter(c => c.type === "series");

  const mapCollection = (items: typeof collection) => items.map(item => ({
    id: item.id,
    title: item.title,
    poster: item.poster,
    backdrop: null,
    year: item.year,
    rating: parseFloat(item.imdb) || 0,
  }));

  return (
    <div className="relative">
      {/* Offline banner */}
      {!isOnline && <div className="pt-6"><OfflineBanner /></div>}

      {/* Hero Banner */}
      {showOffline ? (
        // Offline: show a simple collection header
        collection.length > 0 ? (
          <div className="px-8 pt-12 pb-8">
            <h1 className="text-3xl font-bold mb-2">Your Collection</h1>
            <p className="text-muted-foreground">Browsing offline — {collection.length} items saved locally</p>
          </div>
        ) : (
          <div className="px-8 pt-12 pb-8">
            <h1 className="text-3xl font-bold mb-2">You're Offline</h1>
            <p className="text-muted-foreground">Add movies and series to your collection to browse them offline</p>
          </div>
        )
      ) : loadingTrending ? (
        <Skeleton className="w-full h-[75vh]" />
      ) : heroMovie ? (
        <HeroBanner
          movie={heroMovie}
          trailerKey={trailerKey}
          onPlay={() => handleSelectItem(heroMovie.id, "movie")}
          onMoreInfo={() => handleSelectItem(heroMovie.id, "movie")}
        />
      ) : null}

      {/* Hero dot navigation (online only) */}
      {!showOffline && trendingMovies.length > 0 && (
        <div className="flex justify-center gap-2 py-3 -mt-6 relative z-10">
          {trendingMovies.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === heroIndex ? "bg-primary w-4" : "bg-muted-foreground/40"}`}
            />
          ))}
        </div>
      )}

      {/* Rows */}
      <div className="pt-4">
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <ContentRow
            title="Continue Watching"
            badge="In Progress"
            items={continueWatching.map(p => ({
              id: p.id,
              title: p.title,
              poster: p.poster,
              backdrop: null,
              year: "",
              rating: 0,
            }))}
            type="movie"
            onSelectItem={(id) => {
              const item = continueWatching.find(p => p.id === id);
              handleSelectItem(id, item?.type || "movie");
            }}
          />
        )}

        {showOffline ? (
          <>
            {collectionMovies.length > 0 && (
              <ContentRow title="Your Movies" badge="Offline" items={mapCollection(collectionMovies)} type="movie"
                onSelectItem={(id) => handleSelectItem(id, "movie")} />
            )}
            {collectionSeries.length > 0 && (
              <ContentRow title="Your Series" badge="Offline" items={mapCollection(collectionSeries)} type="series"
                onSelectItem={(id) => handleSelectItem(id, "series")} />
            )}
          </>
        ) : (
          <>
            <ContentRow title="Trending Now" badge="This Week" items={mapMovies(trendingMovies)} type="movie" onSelectItem={handleSelectItem} />
            <ContentRow title="Trending Series" items={mapSeries(trendingSeries)} type="series" onSelectItem={handleSelectItem} />
            <ContentRow title="Top Rated Movies" items={mapMovies(topRatedMovies)} type="movie" onSelectItem={handleSelectItem} />
            <ContentRow title="Now Playing in Theaters" items={mapMovies(nowPlayingMovies)} type="movie" onSelectItem={handleSelectItem} />
            <ContentRow title="Popular Series" items={mapSeries(popularSeries)} type="series" onSelectItem={handleSelectItem} />
            <ContentRow title="Top Rated Series" items={mapSeries(topRatedSeries)} type="series" onSelectItem={handleSelectItem} />
          </>
        )}

        {collection.length > 0 && !showOffline && (
          <ContentRow
            title="From Your Collection"
            badge="Vault"
            items={collection.slice(0, 20).map(item => ({
              id: item.id,
              title: item.title,
              poster: item.poster,
              backdrop: null,
              year: item.year,
              rating: parseFloat(item.imdb) || 0,
            }))}
            type="movie"
            onSelectItem={(id) => {
              const item = collection.find(c => c.id === id);
              handleSelectItem(id, item?.type || "movie");
            }}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
