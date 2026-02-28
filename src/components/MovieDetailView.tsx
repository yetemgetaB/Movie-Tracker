import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, Clock, Copy, Download, ArrowLeft, Plus, ExternalLink, Play, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { tmdbApi, omdbApi, img, imgOriginal, hasTmdbKey, hasOmdbKey } from "@/lib/tmdb";
import { addToCollection, isInCollection, type CollectionMovie } from "@/lib/collection";
import { saveProgress } from "@/lib/watchProgress";
import RatingBadge from "@/components/RatingBadge";
import WatchlistButton from "@/components/WatchlistButton";
import { toast } from "@/hooks/use-toast";

interface Props {
  movieId: number;
  onBack: () => void;
  onSelectMovie: (id: number) => void;
}

const MovieDetailView = ({ movieId, onBack, onSelectMovie }: Props) => {
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [personModal, setPersonModal] = useState<{ id: number; name: string } | null>(null);
  const [watchDate, setWatchDate] = useState(new Date().toISOString().split("T")[0]);
  const [userRating, setUserRating] = useState("");

  const { data: movie } = useQuery({
    queryKey: ["movie-detail", movieId],
    queryFn: () => tmdbApi.details(movieId),
    enabled: hasTmdbKey(),
  });

  const { data: credits } = useQuery({
    queryKey: ["movie-credits", movieId],
    queryFn: () => tmdbApi.credits(movieId),
    enabled: hasTmdbKey(),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["movie-videos", movieId],
    queryFn: () => tmdbApi.videos(movieId),
    enabled: hasTmdbKey(),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ["movie-keywords", movieId],
    queryFn: () => tmdbApi.keywords(movieId),
    enabled: hasTmdbKey(),
  });

  const { data: similar = [] } = useQuery({
    queryKey: ["movie-similar", movieId],
    queryFn: () => tmdbApi.similar(movieId),
    enabled: hasTmdbKey(),
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["movie-recommendations", movieId],
    queryFn: () => tmdbApi.recommendations(movieId),
    enabled: hasTmdbKey(),
  });

  const { data: omdb } = useQuery({
    queryKey: ["omdb-detail", movie?.imdb_id],
    queryFn: () => (movie?.imdb_id ? omdbApi.getByImdbId(movie.imdb_id) : Promise.resolve(null)),
    enabled: !!movie?.imdb_id && hasOmdbKey(),
  });

  const trailer = videos.find((v) => v.type === "Trailer" && v.site === "YouTube")
    || videos.find(v => v.site === "YouTube");
  const director = credits?.crew.find((c) => c.job === "Director");
  const writers = credits?.crew.filter((c) => c.department === "Writing").slice(0, 3);
  const topCast = credits?.cast.slice(0, 10);
  const alreadyInCollection = isInCollection(movieId);

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
      seasons: 0,
      episodes: 0,
      runtime: movie.runtime,
      director: director?.name || omdb?.Director || "—",
      stars: topCast?.slice(0, 3).map((c) => c.name).join(", ") || "—",
      rated: omdb?.Rated || "—",
      imdb: omdb?.Ratings?.find((r) => r.Source === "Internet Movie Database")?.Value || "—",
      rt: omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value || "—",
      userRating: userRating || "—",
      startDate: watchDate,
      finishDate: watchDate,
      status: "Watched",
      nextSeason: "",
      addedAt: new Date().toISOString(),
    };
    addToCollection(item);
    // Save to watch progress
    saveProgress({ id: movie.id, type: "movie", title: movie.title, poster: img(movie.poster_path), progressPercent: 100 });
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

      <div className="px-6 -mt-24 relative z-10 space-y-5">
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
            <h1 className="text-2xl font-bold leading-tight">{movie.title}</h1>
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

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {trailer && (
            <Button onClick={() => document.getElementById("movie-trailer")?.scrollIntoView({ behavior: "smooth" })} className="gap-2 flex-1">
              <Play size={16} fill="currentColor" /> Watch Trailer
            </Button>
          )}
          {!alreadyInCollection && (
            <Button variant="outline" onClick={() => setShowAddDialog(true)} className="gap-2 flex-1">
              <Plus size={16} /> Add to Vault
            </Button>
          )}
        </div>

        {/* Watchlist Button */}
        <WatchlistButton
          item={{
            id: movie.id, type: "movie", title: movie.title,
            poster: img(movie.poster_path), genre: movie.genres?.map(g => g.name).join(", ") || "",
            year: movie.release_date?.slice(0, 4) || "", seasons: 0, episodes: 0,
            director: director?.name || "", stars: topCast?.slice(0, 3).map(c => c.name).join(", ") || "",
            rated: "", imdb: "", rt: "", userRating: "", startDate: "", finishDate: "", status: "", nextSeason: "", addedAt: "",
          }}
          className="w-full"
        />

        {/* Ratings */}
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
          <div className="space-y-2" id="movie-trailer">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Play size={14} className="text-primary" /> Trailer
            </h3>
            <div className="rounded-xl overflow-hidden aspect-video">
              <iframe src={`https://www.youtube.com/embed/${trailer.key}`} title={trailer.name} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
        )}

        {/* Synopsis */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Synopsis</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{movie.overview}</p>
        </div>

        {/* Genres — clickable → filter by genre */}
        <div className="flex flex-wrap gap-1.5">
          {movie.genres.map((g) => (
            <Badge
              key={g.id}
              onClick={() => navigate(`/movies?genre=${g.id}`)}
              className="bg-primary/10 text-primary border-0 text-xs cursor-pointer hover:bg-primary/20 active:scale-95 transition-all"
            >🏷 {g.name}</Badge>
          ))}
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {keywords.slice(0, 12).map((kw) => (
              <Badge key={kw.id} variant="secondary" className="text-xs capitalize hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">{kw.name}</Badge>
            ))}
          </div>
        )}

        {/* Credits — director & writer clickable */}
        <div className="grid grid-cols-3 gap-4 glass-panel p-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Director</p>
            {director ? (
              <button onClick={() => setPersonModal({ id: director.id, name: director.name })}
                className="text-sm font-medium text-primary hover:underline text-left">
                {director.name}
              </button>
            ) : <p className="text-sm font-medium">{omdb?.Director || "—"}</p>}
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Writer</p>
            <p className="text-sm font-medium">{writers?.map((w) => w.name).join(", ") || omdb?.Writer || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Stars</p>
            <div className="flex flex-col gap-0.5">
              {topCast?.slice(0, 3).map(c => (
                <button key={c.id} onClick={() => setPersonModal({ id: c.id, name: c.name })}
                  className="text-sm font-medium text-primary hover:underline text-left truncate">
                  {c.name}
                </button>
              )) || <p className="text-sm font-medium">—</p>}
            </div>
          </div>
        </div>

        {/* Cast Grid — clickable → person modal */}
        {topCast && topCast.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Cast</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {topCast.map((c) => (
                <button key={c.id} onClick={() => setPersonModal({ id: c.id, name: c.name })}
                  className="flex-shrink-0 w-[80px] text-center cursor-pointer group">
                  <img
                    src={img(c.profile_path, "w185")}
                    alt={c.name}
                    className="w-16 h-16 rounded-full object-cover mx-auto mb-1 group-hover:ring-2 ring-primary transition-all"
                  />
                  <p className="text-[10px] font-medium truncate group-hover:text-primary transition-colors">{c.name}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{c.character}</p>
                </button>
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

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Recommended For You</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {recommendations.slice(0, 10).map((s) => (
                <div key={s.id} className="flex-shrink-0 w-[100px] cursor-pointer group" onClick={() => onSelectMovie(s.id)}>
                  <img src={img(s.poster_path, "w185")} alt={s.title} className="w-full h-[150px] object-cover rounded-lg group-hover:ring-2 ring-primary transition-all" loading="lazy" />
                  <p className="text-[10px] font-medium mt-1 truncate">{s.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Movies */}
        {similar.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Similar Movies</h3>
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

      {/* Add to Vault Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="glass-panel-strong border-border/50 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add to Vault</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Title</label><p className="font-medium">{movie.title}</p></div>
              <div><label className="text-xs text-muted-foreground">Runtime</label><p className="font-medium">{movie.runtime} min</p></div>
              <div><label className="text-xs text-muted-foreground">Genre</label><p className="font-medium">{movie.genres.map((g) => g.name).join(", ")}</p></div>
              <div><label className="text-xs text-muted-foreground">Director</label><p className="font-medium">{director?.name || "—"}</p></div>
              <div><label className="text-xs text-muted-foreground">IMDb</label><p className="font-medium">{omdb?.Ratings?.find((r) => r.Source === "Internet Movie Database")?.Value || "—"}</p></div>
              <div><label className="text-xs text-muted-foreground">RT</label><p className="font-medium">{omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value || "—"}</p></div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Watch Date</label>
              <Input type="date" value={watchDate} onChange={(e) => setWatchDate(e.target.value)} className="bg-secondary/50 border-border/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Your Rating (/10)</label>
              <Input type="number" min={0} max={10} step={0.5} placeholder="8.5" value={userRating} onChange={(e) => setUserRating(e.target.value)} className="bg-secondary/50 border-border/50" />
            </div>
            <Button onClick={handleAddToCollection} className="w-full">
              <Plus size={16} className="mr-2" /> Confirm & Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Person Filmography Modal */}
      {personModal && (
        <PersonModal personId={personModal.id} name={personModal.name} onClose={() => setPersonModal(null)} onSelectMovie={onSelectMovie} />
      )}

    </div>
  );
};

// ── Person Modal ────────────────────────────────────────────────────────────────
const PersonModal = ({ personId, name, onClose, onSelectMovie }: { personId: number; name: string; onClose: () => void; onSelectMovie: (id: number) => void }) => {
  const { data: person } = useQuery({
    queryKey: ["person", personId],
    queryFn: async () => {
      const key = localStorage.getItem("movie_tracker_tmdb_api_key") || localStorage.getItem("tmdb_api_key");
      const [details, credits] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/person/${personId}?api_key=${key}`).then(r => r.json()),
        fetch(`https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${key}`).then(r => r.json()),
      ]);
      return { details, credits };
    },
  });

  const topMovies = person?.credits?.cast
    ?.filter((c: { media_type: string; poster_path: string; vote_count: number }) => c.media_type === "movie" && c.poster_path)
    ?.sort((a: { vote_count: number }, b: { vote_count: number }) => b.vote_count - a.vote_count)
    ?.slice(0, 12) || [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="glass-panel-strong border-border/50 max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {person?.details?.profile_path && (
              <img src={img(person.details.profile_path, "w185")} alt={name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30" />
            )}
            <div>
              <div>{name}</div>
              {person?.details?.known_for_department && (
                <div className="text-xs text-muted-foreground font-normal">{person.details.known_for_department}</div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {person?.details?.birthday && (
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>🎂 {new Date(person.details.birthday).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              {person.details.place_of_birth && <span>📍 {person.details.place_of_birth}</span>}
            </div>
          )}
          {person?.details?.biography && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{person.details.biography}</p>
          )}
          {topMovies.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Known For</h4>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {topMovies.map((m: { id: number; poster_path: string; title: string }) => (
                  <button key={m.id} onClick={() => { onClose(); onSelectMovie(m.id); }}
                    className="flex-shrink-0 w-[80px] group">
                    <img src={img(m.poster_path, "w185")} alt={m.title}
                      className="w-full h-[120px] object-cover rounded-lg group-hover:ring-2 ring-primary transition-all" />
                    <p className="text-[9px] text-muted-foreground mt-1 truncate">{m.title}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {person?.details?.imdb_id && (
            <a href={`https://www.imdb.com/name/${person.details.imdb_id}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink size={10} /> View on IMDb
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MovieDetailView;
