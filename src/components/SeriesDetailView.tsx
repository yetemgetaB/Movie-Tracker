import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Star, Clock, Copy, Download, ArrowLeft, Plus, ExternalLink, Play, Tv, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tmdbSeriesApi, omdbApi, img, imgOriginal } from "@/lib/tmdb";
import { addToCollection, type CollectionSeries } from "@/lib/collection";
import RatingBadge from "@/components/RatingBadge";
import EpisodeRatingGrid from "@/components/EpisodeRatingGrid";
import { toast } from "@/hooks/use-toast";

interface Props {
  seriesId: number;
  onBack: () => void;
  onSelectSeries: (id: number) => void;
}

const SeriesDetailView = ({ seriesId, onBack, onSelectSeries }: Props) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [finishDate, setFinishDate] = useState("");
  const [userRating, setUserRating] = useState("");
  const [selectedTrailerSeason, setSelectedTrailerSeason] = useState<string>("main");

  const { data: series } = useQuery({
    queryKey: ["series-detail", seriesId],
    queryFn: () => tmdbSeriesApi.details(seriesId),
  });

  const { data: credits } = useQuery({
    queryKey: ["series-credits", seriesId],
    queryFn: () => tmdbSeriesApi.credits(seriesId),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["series-videos", seriesId],
    queryFn: () => tmdbSeriesApi.videos(seriesId),
  });

  const { data: similar = [] } = useQuery({
    queryKey: ["series-similar", seriesId],
    queryFn: () => tmdbSeriesApi.similar(seriesId),
  });

  const seasonNum = selectedTrailerSeason !== "main" ? Number(selectedTrailerSeason) : null;

  const { data: seasonVideos = [] } = useQuery({
    queryKey: ["season-videos", seriesId, seasonNum],
    queryFn: () => tmdbSeriesApi.seasonVideos(seriesId, seasonNum!),
    enabled: seasonNum !== null,
  });

  const imdbId = series?.external_ids?.imdb_id || null;

  const { data: omdb } = useQuery({
    queryKey: ["omdb-series", imdbId],
    queryFn: () => (imdbId ? omdbApi.getByImdbId(imdbId) : Promise.resolve(null)),
    enabled: !!imdbId,
  });

  // Determine which trailer to show
  const activeVideos = selectedTrailerSeason === "main" ? videos : seasonVideos;
  const trailer = activeVideos.find((v) => v.type === "Trailer" && v.site === "YouTube")
    || activeVideos.find((v) => v.site === "YouTube");

  const topCast = credits?.cast.slice(0, 6);
  const creators = series?.created_by || [];

  const copyPoster = async () => {
    if (!series?.poster_path) return;
    try {
      await navigator.clipboard.writeText(imgOriginal(series.poster_path));
      toast({ title: "Poster URL copied!" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const downloadPoster = () => {
    if (!series?.poster_path) return;
    const a = document.createElement("a");
    a.href = imgOriginal(series.poster_path);
    a.target = "_blank";
    a.download = `${series.name}-poster.jpg`;
    a.click();
  };

  const handleAddToCollection = () => {
    if (!series) return;
    const item: CollectionSeries = {
      id: series.id,
      type: "series",
      title: series.name,
      poster: img(series.poster_path, "w342"),
      genre: series.genres.map((g) => g.name).join(", "),
      year: series.first_air_date?.slice(0, 4) || "",
      seasons: series.number_of_seasons,
      episodes: series.number_of_episodes,
      director: creators.map((c) => c.name).join(", ") || "—",
      stars: topCast?.slice(0, 3).map((c) => c.name).join(", ") || "—",
      rated: omdb?.Rated || "—",
      imdb: omdb?.Ratings?.find((r) => r.Source === "Internet Movie Database")?.Value || "—",
      rt: omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value || "—",
      userRating: userRating || "—",
      startDate: startDate || "—",
      finishDate: finishDate || "—",
      status: series.status,
      nextSeason: series.next_episode_to_air
        ? `S${series.next_episode_to_air.season_number} - ${series.next_episode_to_air.air_date}`
        : "",
      addedAt: new Date().toISOString(),
    };
    addToCollection(item);
    toast({ title: `${series.name} added to Vault!` });
    setShowAddDialog(false);
  };

  if (!series) {
    return (
      <div className="px-6 pt-6 space-y-4">
        <div className="h-[300px] rounded-xl bg-secondary/30 animate-pulse" />
        <div className="h-6 w-48 bg-secondary/30 animate-pulse rounded" />
      </div>
    );
  }

  const isOngoing = series.status !== "Ended" && series.status !== "Canceled";
  const realSeasons = series.seasons.filter((s) => s.season_number > 0);

  return (
    <div className="pb-8">
      {/* Backdrop */}
      <div className="relative h-[320px] overflow-hidden">
        <img src={imgOriginal(series.backdrop_path)} alt={series.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <button onClick={onBack} className="absolute top-4 left-4 z-20 p-2 rounded-full glass-panel hover:bg-secondary/60 transition-colors">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="px-6 -mt-24 relative z-10 space-y-6">
        {/* Poster + Core Info */}
        <div className="flex gap-5">
          <div className="relative group flex-shrink-0">
            <img src={img(series.poster_path, "w342")} alt={series.name} className="w-[140px] h-[210px] object-cover rounded-xl shadow-2xl" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
              <button onClick={copyPoster} className="p-2 rounded-full bg-white/10 hover:bg-white/20"><Copy size={16} /></button>
              <button onClick={downloadPoster} className="p-2 rounded-full bg-white/10 hover:bg-white/20"><Download size={16} /></button>
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-24 space-y-2">
            <h1 className="text-2xl font-bold font-display leading-tight">{series.name}</h1>
            {series.tagline && <p className="text-xs text-muted-foreground italic">"{series.tagline}"</p>}
            <div className="flex flex-wrap gap-1.5">
              {omdb?.Rated && omdb.Rated !== "N/A" && (
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">{omdb.Rated}</Badge>
              )}
              <Badge variant="outline" className="text-xs border-border/50">
                {series.number_of_seasons} Season{series.number_of_seasons !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline" className="text-xs border-border/50">
                {series.number_of_episodes} Episodes
              </Badge>
              <Badge variant="outline" className={`text-xs ${isOngoing ? "border-green-500/50 text-green-400" : "border-border/50"}`}>
                {series.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Ratings */}
        <div className="glass-panel p-4">
          <div className="flex gap-6 flex-wrap items-end">
            <div className="text-center flex flex-col items-center gap-1">
              <p className="text-[10px] text-muted-foreground">TMDB</p>
              <p className="text-lg font-bold glow-text">{series.vote_average.toFixed(1)}</p>
            </div>
            {omdb?.Ratings?.map((r) => (
              <RatingBadge key={r.Source} source={r.Source} value={r.Value} imdbId={imdbId} />
            ))}
          </div>
        </div>

        {/* Seasons Grid with hover */}
        {realSeasons.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold font-display flex items-center gap-2">
              <Tv size={14} className="text-primary" /> Seasons
            </h3>
            <TooltipProvider>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {realSeasons.map((season) => (
                  <Tooltip key={season.id}>
                    <TooltipTrigger asChild>
                      <div className="flex-shrink-0 w-[90px] cursor-pointer group">
                        <img
                          src={img(season.poster_path, "w185")}
                          alt={season.name}
                          className="w-full h-[135px] object-cover rounded-lg group-hover:ring-2 ring-primary transition-all"
                          loading="lazy"
                        />
                        <p className="text-[10px] font-medium mt-1 truncate text-center">{season.name}</p>
                        <p className="text-[9px] text-muted-foreground text-center">{season.episode_count} eps</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="font-medium text-xs">{season.name}</p>
                      <p className="text-[10px] text-muted-foreground">{season.episode_count} episodes · {season.air_date?.slice(0, 4) || "TBA"}</p>
                      {season.vote_average > 0 && (
                        <p className="text-[10px] text-primary flex items-center gap-1 mt-0.5">
                          <Star size={9} fill="currentColor" /> {season.vote_average.toFixed(1)}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>
        )}

        {/* Episode Rating Grid */}
        {series.number_of_seasons > 0 && (
          <EpisodeRatingGrid seriesId={seriesId} numSeasons={series.number_of_seasons} />
        )}

        {/* Trailer with Season Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold font-display flex items-center gap-2">
              <Play size={14} className="text-primary" /> Trailer
            </h3>
            <Select value={selectedTrailerSeason} onValueChange={setSelectedTrailerSeason}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-secondary/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main Series</SelectItem>
                {realSeasons.map((s) => (
                  <SelectItem key={s.season_number} value={String(s.season_number)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {trailer ? (
            <div className="rounded-xl overflow-hidden aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={trailer.name}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="glass-panel p-8 text-center">
              <p className="text-sm text-muted-foreground">No trailer available for this selection</p>
            </div>
          )}
        </div>

        {/* Synopsis */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold font-display">Synopsis</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{series.overview}</p>
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1.5">
          {series.genres.map((g) => (
            <Badge key={g.id} className="bg-primary/10 text-primary border-0 text-xs">{g.name}</Badge>
          ))}
        </div>

        {/* Credits */}
        <div className="grid grid-cols-2 gap-4 glass-panel p-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Created By</p>
            <p className="text-sm font-medium">{creators.map((c) => c.name).join(", ") || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Stars</p>
            <p className="text-sm font-medium">{topCast?.slice(0, 3).map((c) => c.name).join(", ") || "—"}</p>
          </div>
        </div>

        {/* Next Episode */}
        {series.next_episode_to_air && (
          <div className="glass-panel p-3 border border-green-500/20">
            <p className="text-xs text-green-400 font-medium">📺 Next Episode</p>
            <p className="text-sm text-muted-foreground mt-1">
              Season {series.next_episode_to_air.season_number}, Episode {series.next_episode_to_air.episode_number} — {series.next_episode_to_air.air_date}
            </p>
          </div>
        )}

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
          <div className="glass-panel p-3">
            <p className="text-xs text-muted-foreground">🏆 {omdb.Awards}</p>
          </div>
        )}

        {/* IMDb Link */}
        {imdbId && (
          <a href={`https://www.imdb.com/title/${imdbId}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink size={12} /> View on IMDb
          </a>
        )}

        {/* Add to Collection */}
        <Button onClick={() => setShowAddDialog(true)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-border">
          <Plus size={16} className="mr-2" /> Add to Collection
        </Button>

        {/* Similar Series */}
        {similar.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold font-display">Similar Series</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {similar.slice(0, 10).map((s) => (
                <div key={s.id} className="flex-shrink-0 w-[100px] cursor-pointer group" onClick={() => onSelectSeries(s.id)}>
                  <img src={img(s.poster_path, "w185")} alt={s.name} className="w-full h-[150px] object-cover rounded-lg group-hover:ring-2 ring-primary transition-all" loading="lazy" />
                  <p className="text-[10px] font-medium mt-1 truncate">{s.name}</p>
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
            <DialogTitle className="font-display">Add Series to Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Title</label><p className="font-medium">{series.name}</p></div>
              <div><label className="text-xs text-muted-foreground">Seasons</label><p className="font-medium">{series.number_of_seasons}</p></div>
              <div><label className="text-xs text-muted-foreground">Episodes</label><p className="font-medium">{series.number_of_episodes}</p></div>
              <div><label className="text-xs text-muted-foreground">Genre</label><p className="font-medium">{series.genres.map((g) => g.name).join(", ")}</p></div>
              <div><label className="text-xs text-muted-foreground">Status</label><p className="font-medium">{series.status}</p></div>
              <div><label className="text-xs text-muted-foreground">Created By</label><p className="font-medium">{creators.map((c) => c.name).join(", ") || "—"}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Start Watching</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-secondary/50 border-border/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Finish Watching</label>
                <Input type="date" value={finishDate} onChange={(e) => setFinishDate(e.target.value)} className="bg-secondary/50 border-border/50" />
              </div>
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

export default SeriesDetailView;
