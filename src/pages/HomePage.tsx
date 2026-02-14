import { useState, useEffect, useRef } from "react";
import { ChevronRight, Play, Plus, Star, TrendingUp, Clock, Film, Tv, Sparkles, ChevronLeft, Search, Menu, AlertCircle, ExternalLink, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { tmdbApi, tmdbSeriesApi, img, imgOriginal } from "@/lib/tmdb";
import { useNavigate } from "react-router-dom";
import { getCollection } from "@/lib/collection";
import { toast } from "@/hooks/use-toast";

const ContentRow = ({
  title,
  icon: Icon,
  items,
  type = "movie",
  autoScroll = false,
}: {
  title: string;
  icon: React.ElementType;
  items: { id: number; title: string; poster: string; year: string; rating: string }[];
  type?: "movie" | "series";
  autoScroll?: boolean;
}) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll || items.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    let scrollPos = 0;
    const timer = setInterval(() => {
      scrollPos += 1;
      if (scrollPos >= el.scrollWidth - el.clientWidth) scrollPos = 0;
      el.scrollTo({ left: scrollPos, behavior: "auto" });
    }, 30);
    const stop = () => clearInterval(timer);
    el.addEventListener("mouseenter", stop);
    el.addEventListener("touchstart", stop);
    return () => {
      clearInterval(timer);
      el.removeEventListener("mouseenter", stop);
      el.removeEventListener("touchstart", stop);
    };
  }, [autoScroll, items.length]);

  const handleClick = (id: number) => {
    navigate(type === "movie" ? `/movies?id=${id}` : `/series?id=${id}`);
  };

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section className="space-y-3">
      <div className="px-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold font-display flex items-center gap-2">
          <Icon size={18} className="text-primary" />
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll(-1)} className="p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll(1)} className="p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      {items.length > 0 ? (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-6 pb-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="poster-card flex-shrink-0 w-[140px] group cursor-pointer"
              onClick={() => handleClick(item.id)}
            >
              <img src={item.poster} alt={item.title} className="w-full h-[210px] object-cover rounded-lg" loading="lazy" />
              <div className="poster-overlay absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent opacity-0 transition-opacity flex flex-col justify-end p-3">
                <p className="text-xs font-semibold truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-0.5 text-[10px] text-primary">
                    <Star size={10} fill="currentColor" /> {item.rating}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{item.year}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-6 glass-panel p-6 text-center">
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[100px] h-[150px] rounded-lg bg-secondary/50 animate-pulse" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const mapMovies = (movies: { id: number; title: string; poster_path: string | null; release_date: string; vote_average: number }[]) =>
  movies.map((m) => ({
    id: m.id,
    title: m.title,
    poster: img(m.poster_path, "w342"),
    year: m.release_date?.slice(0, 4) || "",
    rating: m.vote_average.toFixed(1),
  }));

const mapSeries = (series: { id: number; name: string; poster_path: string | null; first_air_date: string; vote_average: number }[]) =>
  series.map((s) => ({
    id: s.id,
    title: s.name,
    poster: img(s.poster_path, "w342"),
    year: s.first_air_date?.slice(0, 4) || "",
    rating: s.vote_average.toFixed(1),
  }));

const HomePage = () => {
  const navigate = useNavigate();
  const [heroIndex, setHeroIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ movies: any[], series: any[] }>({ movies: [], series: [] });
  const collection = getCollection();

  const { data: trending = [], error: trendingError } = useQuery({
    queryKey: ["trending-movies"],
    queryFn: tmdbApi.trending,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: popular = [], error: popularError } = useQuery({
    queryKey: ["popular-movies"],
    queryFn: tmdbApi.popular,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: topRated = [], error: topRatedError } = useQuery({
    queryKey: ["top-rated-movies"],
    queryFn: tmdbApi.topRated,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: nowPlaying = [], error: nowPlayingError } = useQuery({
    queryKey: ["now-playing"],
    queryFn: tmdbApi.nowPlaying,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: trendingSeries = [], error: trendingSeriesError } = useQuery({
    queryKey: ["trending-series"],
    queryFn: tmdbSeriesApi.trending,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: popularSeries = [], error: popularSeriesError } = useQuery({
    queryKey: ["popular-series"],
    queryFn: tmdbSeriesApi.popular,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Universal search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults({ movies: [], series: [] });
      return;
    }
    
    setIsSearching(true);
    try {
      const [movieResults, seriesResults] = await Promise.all([
        tmdbApi.search(query),
        tmdbSeriesApi.search(query)
      ]);
      setSearchResults({ movies: movieResults, series: seriesResults });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to search. Please check your API keys.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check for API key errors and show helpful message
  const hasApiKeyError = trendingError || popularError || topRatedError || nowPlayingError || trendingSeriesError || popularSeriesError;
  
  useEffect(() => {
    if (hasApiKeyError && trendingError?.message?.includes('API key not found')) {
      toast({
        title: "API Keys Required",
        description: "Please configure your TMDB and OMDB API keys in Settings.",
        variant: "destructive",
        action: (
          <Button size="sm" onClick={() => navigate('/settings')}>
            Configure Keys
          </Button>
        ),
      });
    }
  }, [hasApiKeyError, trendingError?.message, navigate]);
  useEffect(() => {
    if (trending.length === 0) return;
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % Math.min(trending.length, 8));
    }, 6000);
    return () => clearInterval(timer);
  }, [trending.length]);

  const hero = trending[heroIndex];




  return (
    <div className="space-y-8 pb-4">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* App Icon */}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <PlayCircle size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold font-display glow-text">Movie Tracker</h1>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Film size={16} />
                <span>{collection.filter(c => c.type === 'movie').length} Movies</span>
                <Tv size={16} />
                <span>{collection.filter(c => c.type === 'series').length} Series</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-gradient-to-r from-background via-secondary/30 to-background border border-border/50 rounded-xl px-4 py-2.5 w-80 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <Search size={18} className="text-primary mr-3 group-hover:scale-110 transition-transform" />
                <Input
                  placeholder="Search movies & series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 text-sm placeholder:text-muted-foreground/70 focus:ring-0 font-medium"
                />
                {isSearching && (
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                )}
              </div>
              
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu size={20} />
              </Button>
            </div>
          </div>
          
          {/* Mobile Search & Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 space-y-3">
              <div className="flex items-center bg-gradient-to-r from-background via-secondary/30 to-background border border-border/50 rounded-xl px-4 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <Search size={18} className="text-primary mr-3 group-hover:scale-110 transition-transform" />
                <Input
                  placeholder="Search movies & series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 text-sm placeholder:text-muted-foreground/70 focus:ring-0 font-medium"
                />
                {isSearching && (
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Film size={16} />
                  <span>{collection.filter(c => c.type === 'movie').length} Movies</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tv size={16} />
                  <span>{collection.filter(c => c.type === 'series').length} Series</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Search Results */}
      {searchQuery.trim().length >= 2 && (searchResults.movies.length > 0 || searchResults.series.length > 0) && (
        <div className="px-6 space-y-4 fade-up" style={{ animationDelay: "0.05s" }}>
          <div className="glass-panel p-4">
            <h2 className="text-lg font-semibold font-display mb-4 flex items-center gap-2">
              <Search size={18} className="text-primary" />
              Search Results for "{searchQuery}"
            </h2>
            
            {/* Movies Results */}
            {searchResults.movies.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3 flex items-center gap-2">
                  <Film size={16} className="text-primary" />
                  Movies ({searchResults.movies.length})
                </h3>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {searchResults.movies.slice(0, 10).map((movie) => (
                    <div
                      key={movie.id}
                      className="flex-shrink-0 w-[120px] group cursor-pointer"
                      onClick={() => navigate(`/movies?id=${movie.id}`)}
                    >
                      <img src={img(movie.poster_path, "w342")} alt={movie.title} className="w-full h-[180px] object-cover rounded-lg" loading="lazy" />
                      <div className="mt-2">
                        <p className="text-xs font-medium truncate">{movie.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="flex items-center gap-0.5 text-[10px] text-primary">
                            <Star size={8} fill="currentColor" /> {movie.vote_average.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{movie.release_date?.slice(0, 4)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Series Results */}
            {searchResults.series.length > 0 && (
              <div>
                <h3 className="text-md font-medium mb-3 flex items-center gap-2">
                  <Tv size={16} className="text-primary" />
                  Series ({searchResults.series.length})
                </h3>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {searchResults.series.slice(0, 10).map((series) => (
                    <div
                      key={series.id}
                      className="flex-shrink-0 w-[120px] group cursor-pointer"
                      onClick={() => navigate(`/series?id=${series.id}`)}
                    >
                      <img src={img(series.poster_path, "w342")} alt={series.name} className="w-full h-[180px] object-cover rounded-lg" loading="lazy" />
                      <div className="mt-2">
                        <p className="text-xs font-medium truncate">{series.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="flex items-center gap-0.5 text-[10px] text-primary">
                            <Star size={8} fill="currentColor" /> {series.vote_average.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{series.first_air_date?.slice(0, 4)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Banner with auto-cycling */}
      <section className="relative h-[460px] overflow-hidden mx-4 rounded-2xl">
        {hero ? (
          <>
            <img
              key={hero.id}
              src={imgOriginal(hero.backdrop_path)}
              alt={hero.title}
              className="absolute inset-0 w-full h-full object-cover animate-fade-in"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-secondary/30 animate-pulse rounded-2xl" />
        )}

        {/* Hero indicators */}
        {trending.length > 1 && (
          <div className="absolute top-4 right-4 z-20 flex gap-1.5">
            {trending.slice(0, 8).map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className={`h-1 rounded-full transition-all ${i === heroIndex ? "w-6 bg-primary" : "w-2 bg-white/30"}`}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 flex flex-col justify-end h-full px-6 pb-8">
          {hasApiKeyError ? (
            <div className="glass-panel p-6 max-w-md fade-up">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">API Keys Required</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    To browse movies and series, please configure your TMDB and OMDB API keys in Settings.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate('/settings')}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Configure Keys
                    </Button>
                    <Button size="sm" variant="outline" className="border-border/50 hover:bg-secondary/50">
                      <ExternalLink size={14} className="mr-1" /> Get API Keys
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : hero ? (
            <>
              <span className="text-xs font-medium text-primary tracking-wider uppercase mb-2 fade-up">
                🔥 Trending This Week
              </span>
              <h1 className="text-3xl font-bold font-display tracking-tight fade-up">
                {hero.title}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground fade-up" style={{ animationDelay: "0.05s" }}>
                <span className="flex items-center gap-1 text-primary">
                  <Star size={14} fill="currentColor" /> {hero.vote_average.toFixed(1)}
                </span>
                <span>{hero.release_date?.slice(0, 4)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg line-clamp-2 fade-up" style={{ animationDelay: "0.1s" }}>
                {hero.overview}
              </p>
              <div className="flex gap-3 mt-4 fade-up" style={{ animationDelay: "0.15s" }}>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  onClick={() => navigate(`/movies?id=${hero.id}`)}
                >
                  <Sparkles size={14} /> View Details
                </Button>
                <Button size="sm" variant="outline" className="border-border/50 hover:bg-secondary/50 gap-2">
                  <Plus size={14} /> Add to Collection
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold font-display tracking-tight fade-up">
                Movie <span className="glow-text">Tracker</span>
              </h1>
              <p className="text-muted-foreground mt-2 max-w-md fade-up" style={{ animationDelay: "0.1s" }}>
                Your personal cinema vault. Track every movie and series you watch.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Content Rows */}
      <ContentRow title="Trending Now" icon={TrendingUp} items={mapMovies(trending)} autoScroll />
      <ContentRow title="Now Playing" icon={Play} items={mapMovies(nowPlaying)} />
      <ContentRow title="Top Rated" icon={Star} items={mapMovies(topRated)} />
      <ContentRow title="Popular Movies" icon={Film} items={mapMovies(popular)} />
      <ContentRow title="Trending Series" icon={Tv} items={mapSeries(trendingSeries)} type="series" autoScroll />
      <ContentRow title="Popular Series" icon={Tv} items={mapSeries(popularSeries)} type="series" />
    </div>
  );
};

export default HomePage;
