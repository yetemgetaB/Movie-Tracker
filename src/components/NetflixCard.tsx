// Netflix-style hover card with trailer preview
import { useState, useRef, useEffect } from "react";
import { Play, Plus, ThumbsUp, ChevronDown, Info } from "lucide-react";
import { img } from "@/lib/tmdb";
import { getProgress } from "@/lib/watchProgress";

interface NetflixCardProps {
  id: number;
  title: string;
  poster: string | null;
  backdrop: string | null;
  year: string;
  rating: number;
  overview?: string;
  genres?: string[];
  trailerKey?: string;
  type?: "movie" | "series";
  onPlay?: () => void;
  onMoreInfo?: () => void;
  onAddToList?: () => void;
}

const NetflixCard = ({
  id,
  title,
  poster,
  backdrop,
  year,
  rating,
  overview,
  genres = [],
  trailerKey,
  type = "movie",
  onPlay,
  onMoreInfo,
  onAddToList,
}: NetflixCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [expandedPos, setExpandedPos] = useState({ top: 0, left: 0, width: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>();
  const progress = getProgress(id);

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const scrollY = window.scrollY;
        setExpandedPos({
          top: rect.top + scrollY - 30,
          left: rect.left - 40,
          width: rect.width + 80,
        });
      }
      setShowExpanded(true);
      setIsHovered(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setIsHovered(false);
    setShowExpanded(false);
  };

  const matchScore = Math.round(40 + rating * 6);

  return (
    <>
      <div
        ref={cardRef}
        className="relative group cursor-pointer flex-shrink-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onMoreInfo}
        style={{ width: "160px" }}
      >
        <div className="relative overflow-hidden rounded-md aspect-[2/3] bg-secondary">
          <img
            src={img(poster)}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {progress && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary/60">
              <div
                className="h-full bg-primary"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="mt-1 text-xs font-medium truncate text-foreground/80">{title}</p>
      </div>

      {/* Expanded hover card — rendered in portal-like fixed positioning */}
      {showExpanded && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: expandedPos.top,
            left: Math.max(8, expandedPos.left),
            width: Math.min(expandedPos.width, 320),
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="rounded-xl overflow-hidden shadow-2xl border border-border/50 pointer-events-auto"
            style={{
              animation: "cardExpand 0.2s ease-out",
              background: "hsl(var(--card))",
            }}
          >
            {/* Backdrop / Trailer area */}
            <div className="relative aspect-video bg-secondary overflow-hidden">
              {trailerKey ? (
                <iframe
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1`}
                  className="w-full h-full"
                  allow="autoplay"
                  title={`${title} trailer`}
                />
              ) : (
                <img
                  src={img(backdrop || poster, "w780")}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent" />
            </div>

            {/* Card content */}
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={onPlay}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background hover:bg-foreground/80 transition-colors"
                >
                  <Play size={14} fill="currentColor" />
                </button>
                <button
                  onClick={onAddToList}
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-border hover:border-foreground/60 transition-colors"
                >
                  <Plus size={14} />
                </button>
                <button className="flex items-center justify-center w-8 h-8 rounded-full border border-border hover:border-foreground/60 transition-colors">
                  <ThumbsUp size={14} />
                </button>
                <button
                  onClick={onMoreInfo}
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-border hover:border-foreground/60 transition-colors ml-auto"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-400 font-bold">{matchScore}% Match</span>
                <span className="border border-muted-foreground/40 px-1 rounded text-muted-foreground text-[10px]">
                  {type === "series" ? "Series" : "Movie"}
                </span>
                <span className="text-muted-foreground">{year}</span>
              </div>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {genres.slice(0, 3).map(g => (
                    <span key={g} className="text-[10px] text-muted-foreground">
                      {g}{genres.indexOf(g) < Math.min(genres.length, 3) - 1 ? " •" : ""}
                    </span>
                  ))}
                </div>
              )}

              {overview && (
                <p className="text-xs text-muted-foreground line-clamp-2">{overview}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NetflixCard;
