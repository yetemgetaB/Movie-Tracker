import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Star, Clock, Copy, Download, ArrowLeft, Plus, ExternalLink, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { tmdbApi, omdbApi, img, imgOriginal } from "@/lib/tmdb";
import { addToCollection, type CollectionMovie } from "@/lib/collection";
import RatingBadge from "@/components/RatingBadge";
import { toast } from "@/hooks/use-toast";

interface Props {
  movieId: number;
  onBack: () => void;
  onSelectMovie: (id: number) => void;
}

const MovieDetailView = ({ movieId, onBack, onSelectMovie }: Props) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [watchDate, setWatchDate] = useState(new Date().toISOString().split("T")[0]);
  const [userRating, setUserRating] = useState("");

  const { data: movie } = useQuery({
    queryKey: ["movie-detail", movieId],
    queryFn: () => tmdbApi.details(movieId),
  });

  const { data: credits } = useQuery({
    queryKey: ["movie-credits", movieId],
    queryFn: () => tmdbApi.credits(movieId),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["movie-videos", movieId],
    queryFn: () => tmdbApi.videos(movieId),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ["movie-keywords", movieId],
    queryFn: () => tmdbApi.keywords(movieId),
  });

  const { data: similar = [] } = useQuery({
    queryKey: ["movie-similar", movieId],
    queryFn: () => tmdbApi.similar(movieId),
  });

  const { data: omdb } = useQuery({
    queryKey: ["omdb-detail", movie?.imdb_id],
    queryFn: () => (movie?.imdb_id ? omdbApi.getByImdbId(movie.imdb_id) : Promise.resolve(null)),
    enabled: !!movie?.imdb_id,
  });

  const trailer = videos.find((v) => v.type === "Trailer" && v.site === "YouTube");
  const director = credits?.crew.find((c) => c.job === "Director");
  const writers = credits?.crew.filter((c) => c.department === "Writing").slice(0, 3);
  const topCast = credits?.cast.slice(0, 6);

  const copyPoster = async () => {
    if (!movie?.poster_path) return;
    try {
      await navigator.clipboard.writeText(imgOriginal(movie.poster_path));
      toast({ title: "Poster URL copied!" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const downloadPoster = () => {
    if (!movie?.poster_path) return;
    const a = document.createElement("a");
    a.href = imgOriginal(movie.poster_path);
    a.target = "_blank";
    a.download = `${movie.title}-poster.jpg`;
    a.click();
  };

  const handleAddToCollection = () => {
    if (!movie) return;
    const item: CollectionMovie = {
      id: movie.id,
      type: "movie",
      title: movie.title,
      poster: img(movie.poster_path, "w342"),
      genre: movie.genres.map((g) => g.name).join(", "),
      year: movie.release_date?.slice(0, 4) || "",
      runtime: `${movie.runtime} min`,
      director: director?.name || omdb?.Director || "—",
      writer: writers?.map((w) => w.name).join(", ") || omdb?.Writer || "—",
      stars: topCast?.slice(0, 3).map((c) => c.name).join(", ") || "—",
      rated: omdb?.Rated || "—",
      imdb: omdb?.Ratings?.find((r) => r.Source === "Internet Movie Database")?.Value || "—",
      rt: omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value || "—",
      metacritic: omdb?.Ratings?.find((r) => r.Source === "Metacritic")?.Value || "—",
      userRating: userRating || "—",
      watchDate,
      releaseDate: movie.release_date,
      addedAt: new Date().toISOString(),
    };
    addToCollection(item);
    toast({ title: `${movie.title} added to Vault!` });
    setShowAddDialog(false);
  };

  if (!movie) {
    return (
      <div className="px-6 pt-6 space-y-4">
        <div className="h-[300px] rounded-xl bg-secondary/30 animate-pulse" />
        <div className="h-6 w-48 bg-secondary/30 animate-pulse rounded" />
        <div className="h-4 w-full bg-secondary/30 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Backdrop */}
      <div className="relative h-[320px] overflow-hidden">
        <img src={imgOriginal(movie.backdrop_path)} alt={movie.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <button onClick={onBack} className="absolute top-4 left-4 z-20 p-2 rounded-full glass-panel hover:bg-secondary/60 transition-colors">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="px-6 -mt-24 relative z-10 space-y-6">
        {/* Poster + Core Info */}
        <div className="flex gap-5">
          <div className="relative group flex-shrink-0">
            <img src={img(movie.poster_path, "w342")} alt={movie.title} className="w-[140px] h-[210px] object-cover rounded-xl shadow-2xl" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
              <button onClick={copyPoster} className="p-2 rounded-full bg-white/10 hover:bg-white/20"><Copy size={16} /></button>
              <button onClick={downloadPoster} className="p-2 rounded-full bg-white/10 hover:bg-white/20"><Download size={16} /></button>
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-24 space-y-2">
            <h1 className="text-2xl font-bold font-display leading-tight">{movie.title}</h1>
            {movie.tagline && <p className="text-xs text-muted-foreground italic">"{movie.tagline}"</p>}
            <div className="flex flex-wrap gap-1.5">
              {omdb?.Rated && omdb.Rated !== "N/A" && (
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">{omdb.Rated}</Badge>
              )}
              <Badge variant="outline" className="text-xs border-border/50">
                <Clock size={10} className="mr-1" /> {movie.runtime} min
              </Badge>
              <Badge variant="outline" className="text-xs border-border/50">{movie.release_date?.slice(0, 4)}</Badge>
            </div>
          </div>
        </div>

        {/* Ratings with icons */}
        <div className="glass-panel p-4">
          <div className="flex gap-6 flex-wrap items-end">
            <div className="text-center flex flex-col items-center gap-1">
              <p className="text-[10px] text-muted-foreground">TMDB</p>
              <p className="text-lg font-bold glow-text">{movie.vote_average.toFixed(1)}</p>
            </div>
            {omdb?.Ratings?.map((r) => (
              <RatingBadge key={r.Source} source={r.Source} value={r.Value} imdbId={movie.imdb_id} />
            ))}
          </div>
        </div>

        {/* Trailer */}
        {trailer && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold font-display flex items-center gap-2">
              <Play size={14} className="text-primary" /> Trailer
            </h3>
            <div className="rounded-xl overflow-hidden aspect-video">
              <iframe src={`https://www.youtube.com/embed/${trailer.key}`} title={trailer.name} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
        )}

        {/* Synopsis */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold font-display">Synopsis</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{movie.overview}</p>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {keywords.slice(0, 12).map((kw) => (
              <Badge key={kw.id} variant="secondary" className="text-xs cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors capitalize">{kw.name}</Badge>
            ))}
          </div>
        )}

        {/* Genres */}
        <div className="flex flex-wrap gap-1.5">
          {movie.genres.map((g) => (
            <Badge key={g.id} className="bg-primary/10 text-primary border-0 text-xs">{g.name}</Badge>
          ))}
        </div>

        {/* Credits */}
        <div className="grid grid-cols-3 gap-4 glass-panel p-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Director</p>
            <p className="text-sm font-medium">{director?.name || omdb?.Director || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Writer</p>
            <p className="text-sm font-medium">{writers?.map((w) => w.name).join(", ") || omdb?.Writer || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Stars</p>
            <p className="text-sm font-medium">{topCast?.slice(0, 3).map((c) => c.name).join(", ") || "—"}</p>
          </div>
        </div>

        {/* Cast */}
        {topCast && topCast.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold font-display">Cast</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {topCast.map((c) => (
                <div key={c.id} className="flex-shrink-0 w-[80px] text-center">
                  <img src={img(c.profile_path, "w185")} alt={c.name} className="w-16 h-16 rounded-full object-cover mx-auto mb-1" />
                  <p className="text-[10px] font-medium truncate">{c.name}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{c.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Awards */}
        {omdb?.Awards && omdb.Awards !== "N/A" && (
          <div className="glass-panel p-3"><p className="text-xs text-muted-foreground">🏆 {omdb.Awards}</p></div>
        )}

        {/* IMDb Link */}
        {movie.imdb_id && (
          <a href={`https://www.imdb.com/title/${movie.imdb_id}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink size={12} /> View on IMDb
          </a>
        )}

        {/* Add to Collection */}
        <Button onClick={() => setShowAddDialog(true)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-border">
          <Plus size={16} className="mr-2" /> Add to Collection
        </Button>

        {/* Similar Movies */}
        {similar.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold font-display">Similar Movies</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {similar.slice(0, 10).map((s) => (
                <div key={s.id} className="flex-shrink-0 w-[100px] cursor-pointer group" onClick={() => onSelectMovie(s.id)}>
                  <img src={img(s.poster_path, "w185")} alt={s.title} className="w-full h-[150px] object-cover rounded-lg group-hover:ring-2 ring-primary transition-all" loading="lazy" />
                  <p className="text-[10px] font-medium mt-1 truncate">{s.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add to Collection Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="glass-panel-strong border-border/50 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Add to Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Title</label><p className="font-medium">{movie.title}</p></div>
              <div><label className="text-xs text-muted-foreground">Runtime</label><p className="font-medium">{movie.runtime} min</p></div>
              <div><label className="text-xs text-muted-foreground">Genre</label><p className="font-medium">{movie.genres.map((g) => g.name).join(", ")}</p></div>
              <div><label className="text-xs text-muted-foreground">Release Date</label><p className="font-medium">{movie.release_date}</p></div>
              <div><label className="text-xs text-muted-foreground">Director</label><p className="font-medium">{director?.name || "—"}</p></div>
              <div><label className="text-xs text-muted-foreground">Rated</label><p className="font-medium">{omdb?.Rated || "—"}</p></div>
              <div><label className="text-xs text-muted-foreground">IMDb</label><p className="font-medium">{omdb?.Ratings?.find((r) => r.Source === "Internet Movie Database")?.Value || "—"}</p></div>
              <div><label className="text-xs text-muted-foreground">Rotten Tomatoes</label><p className="font-medium">{omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value || "—"}</p></div>
              <div><label className="text-xs text-muted-foreground">Writer</label><p className="font-medium">{writers?.map((w) => w.name).join(", ") || "—"}</p></div>
              <div><label className="text-xs text-muted-foreground">Stars</label><p className="font-medium">{topCast?.slice(0, 3).map((c) => c.name).join(", ") || "—"}</p></div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Watch Date</label>
              <Input type="date" value={watchDate} onChange={(e) => setWatchDate(e.target.value)} className="bg-secondary/50 border-border/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Your Rating (/10)</label>
              <Input type="number" min={0} max={10} step={0.5} placeholder="8.5" value={userRating} onChange={(e) => setUserRating(e.target.value)} className="bg-secondary/50 border-border/50" />
            </div>
            <Button onClick={handleAddToCollection} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus size={16} className="mr-2" /> Confirm & Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MovieDetailView;
