import { useQueries } from "@tanstack/react-query";
import { tmdbSeriesApi } from "@/lib/tmdb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3 } from "lucide-react";

interface Props {
  seriesId: number;
  numSeasons: number;
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

const EpisodeRatingGrid = ({ seriesId, numSeasons }: Props) => {
  const seasonNumbers = Array.from({ length: numSeasons }, (_, i) => i + 1);

  const seasonQueries = useQueries({
    queries: seasonNumbers.map((sn) => ({
      queryKey: ["season-detail", seriesId, sn],
      queryFn: () => tmdbSeriesApi.seasonDetails(seriesId, sn),
      staleTime: 1000 * 60 * 30,
    })),
  });

  const isLoading = seasonQueries.some((q) => q.isLoading);
  const seasons = seasonQueries.map((q) => q.data).filter(Boolean);

  if (isLoading) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={14} className="text-primary" />
          <span className="text-sm font-semibold font-display">Episode Ratings</span>
        </div>
        <div className="h-[200px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">Loading episode data...</div>
        </div>
      </div>
    );
  }

  if (seasons.length === 0) return null;

  const maxEpisodes = Math.max(...seasons.map((s) => s!.episodes.length));

  // Compute season averages
  const seasonAverages = seasons.map((s) => {
    const rated = s!.episodes.filter((e) => e.vote_average > 0);
    return rated.length > 0
      ? rated.reduce((sum, e) => sum + e.vote_average, 0) / rated.length
      : 0;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display flex items-center gap-2">
          <BarChart3 size={14} className="text-primary" /> Episode Ratings
        </h3>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[10px]">
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
            <span className="text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="glass-panel overflow-x-auto">
        <TooltipProvider delayDuration={100}>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card/90 backdrop-blur px-2 py-1.5 text-[10px] text-muted-foreground font-medium" />
                {seasons.map((s, i) => (
                  <th key={i} className="px-1 py-1.5 text-[10px] text-muted-foreground font-medium min-w-[40px] text-center">
                    S{s!.season_number}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxEpisodes }, (_, epIdx) => (
                <tr key={epIdx}>
                  <td className="sticky left-0 z-10 bg-card/90 backdrop-blur px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
                    E{epIdx + 1}
                  </td>
                  {seasons.map((s, sIdx) => {
                    const ep = s!.episodes[epIdx];
                    if (!ep) return <td key={sIdx} className="px-0.5 py-0.5" />;
                    const rating = ep.vote_average;
                    if (rating === 0) {
                      return (
                        <td key={sIdx} className="px-0.5 py-0.5">
                          <div className="w-[38px] h-[26px] rounded-sm bg-secondary/30 flex items-center justify-center text-[9px] text-muted-foreground">
                            —
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={sIdx} className="px-0.5 py-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-[38px] h-[26px] rounded-sm flex items-center justify-center text-[10px] font-bold cursor-default transition-transform hover:scale-110 hover:z-10 ${getRatingColor(rating)}`}
                            >
                              {rating.toFixed(1)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px]">
                            <p className="font-semibold text-xs">{ep.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              S{ep.season_number} E{ep.episode_number} · {getRatingLabel(rating)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{ep.air_date}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Averages Row */}
              <tr className="border-t border-border/30">
                <td className="sticky left-0 z-10 bg-card/90 backdrop-blur px-2 py-1.5 text-[10px] text-muted-foreground font-bold">
                  AVG.
                </td>
                {seasonAverages.map((avg, i) => (
                  <td key={i} className="px-0.5 py-1">
                    {avg > 0 ? (
                      <div className={`w-[38px] h-[26px] rounded-sm flex items-center justify-center text-[10px] font-bold border-2 border-dashed border-current/30 ${getRatingColor(avg)}`}>
                        {avg.toFixed(1)}
                      </div>
                    ) : (
                      <div className="w-[38px] h-[26px]" />
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default EpisodeRatingGrid;
