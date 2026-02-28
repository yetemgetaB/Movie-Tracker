import { useQueries } from "@tanstack/react-query";
import { omdbApi, tmdbSeriesApi, hasTmdbKey, hasOmdbKey } from "@/lib/tmdb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  seriesId: number;
  numSeasons: number;
  imdbId?: string | null;
  seriesTitle?: string;
}

const getRatingColor = (rating: number) => {
  if (rating >= 9.5) return "bg-cyan-400 text-cyan-950";
  if (rating >= 9.0) return "bg-cyan-500 text-cyan-950";
  if (rating >= 8.5) return "bg-emerald-400 text-emerald-950";
  if (rating >= 8.0) return "bg-green-400 text-green-950";
  if (rating >= 7.5) return "bg-yellow-300 text-yellow-950";
  if (rating >= 7.0) return "bg-yellow-400 text-yellow-950";
  if (rating >= 6.0) return "bg-orange-400 text-orange-950";
  if (rating >= 5.0) return "bg-red-400 text-red-950";
  return "bg-red-600 text-white";
};

const getRatingLabel = (rating: number) => {
  if (rating >= 9.5) return "Absolute Cinema";
  if (rating >= 9.0) return "Awesome";
  if (rating >= 8.5) return "Great";
  if (rating >= 8.0) return "Good";
  if (rating >= 7.5) return "Decent";
  if (rating >= 7.0) return "Regular";
  if (rating >= 6.0) return "Meh";
  if (rating >= 5.0) return "Bad";
  return "Garbage";
};

const LEGEND = [
  { label: "Absolute Cinema", color: "bg-cyan-400" },
  { label: "Awesome", color: "bg-emerald-400" },
  { label: "Great", color: "bg-green-400" },
  { label: "Good", color: "bg-yellow-300" },
  { label: "Regular", color: "bg-yellow-400" },
  { label: "Meh", color: "bg-orange-400" },
  { label: "Bad", color: "bg-red-400" },
  { label: "Garbage", color: "bg-red-600" },
];

const EpisodeRatingGrid = ({ seriesId, numSeasons, imdbId, seriesTitle }: Props) => {
  const useOmdb = hasOmdbKey() && (imdbId || seriesTitle);

  // OMDB season queries (IMDb ratings)
  const omdbSeasonQueries = useQueries({
    queries: useOmdb ? Array.from({ length: Math.min(numSeasons, 10) }, (_, i) => ({
      queryKey: ["omdb-season", seriesId, i + 1, imdbId],
      queryFn: () => omdbApi.getSeasonRatings(seriesTitle || "", i + 1, imdbId || undefined),
      staleTime: 1000 * 60 * 60,
    })) : [],
  });

  // Fallback: TMDB season queries
  const tmdbSeasonQueries = useQueries({
    queries: !useOmdb && hasTmdbKey() ? Array.from({ length: Math.min(numSeasons, 10) }, (_, i) => ({
      queryKey: ["season-detail", seriesId, i + 1],
      queryFn: () => tmdbSeriesApi.seasonDetails(seriesId, i + 1),
      staleTime: 1000 * 60 * 60,
    })) : [],
  });

  const isLoading = useOmdb
    ? omdbSeasonQueries.some(q => q.isLoading)
    : tmdbSeasonQueries.some(q => q.isLoading);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 size={16} /> Loading episode ratings...
        </div>
        <div className="h-40 animate-pulse bg-secondary rounded-lg" />
      </div>
    );
  }

  if (useOmdb) {
    // Render OMDB/IMDb ratings
    const seasons = omdbSeasonQueries
      .map((q, i) => ({ season: i + 1, data: q.data }))
      .filter(s => s.data?.Response === "True" && s.data?.Episodes?.length > 0);

    if (seasons.length === 0) {
      return (
        <div className="text-muted-foreground text-sm flex items-center gap-2">
          <BarChart3 size={16} /> No IMDb episode ratings available.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <span className="font-medium">Episode Ratings</span>
          <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-[10px]">IMDb</Badge>
        </div>

        {seasons.map(({ season, data }) => (
          <div key={season}>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Season {season}</p>
            <div className="flex flex-wrap gap-1">
              {data!.Episodes.map((ep) => {
                const rating = parseFloat(ep.imdbRating);
                const isValid = !isNaN(rating) && rating > 0;
                return (
                  <TooltipProvider key={ep.Episode}>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className={`w-8 h-8 rounded text-[10px] font-bold flex items-center justify-center transition-transform hover:scale-110 ${
                          isValid ? getRatingColor(rating) : "bg-secondary text-muted-foreground"
                        }`}>
                          {isValid ? rating.toFixed(1) : "N/A"}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-semibold">S{season}E{ep.Episode}: {ep.Title}</p>
                        {isValid && (
                          <>
                            <p>IMDb: {ep.imdbRating}/10</p>
                            <p>{getRatingLabel(rating)}</p>
                          </>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
          {LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // TMDB fallback
  const seasons = tmdbSeasonQueries
    .map((q, i) => ({ season: i + 1, data: q.data }))
    .filter(s => s.data?.episodes?.length > 0);

  if (seasons.length === 0) {
    return (
      <div className="text-muted-foreground text-sm flex items-center gap-2">
        <BarChart3 size={16} /> No episode data available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={16} className="text-primary" />
        <span className="font-medium">Episode Ratings</span>
        <Badge variant="outline" className="text-xs">TMDB</Badge>
      </div>

      {seasons.map(({ season, data }) => (
        <div key={season}>
          <p className="text-xs text-muted-foreground mb-1.5 font-medium">Season {season}</p>
          <div className="flex flex-wrap gap-1">
            {data!.episodes.map((ep) => {
              const rating = ep.vote_average;
              const isValid = rating > 0;
              return (
                <TooltipProvider key={ep.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className={`w-8 h-8 rounded text-[10px] font-bold flex items-center justify-center transition-transform hover:scale-110 ${
                        isValid ? getRatingColor(rating) : "bg-secondary text-muted-foreground"
                      }`}>
                        {isValid ? rating.toFixed(1) : "—"}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">S{ep.season_number}E{ep.episode_number}: {ep.name}</p>
                      {isValid && <p>{getRatingLabel(rating)}</p>}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
        {LEGEND.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EpisodeRatingGrid;
