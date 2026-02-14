// Rating badges with brand icons for IMDb, Rotten Tomatoes, Metacritic, TMDB

interface RatingBadgeProps {
  source: string;
  value: string;
  imdbId?: string | null;
}

const sourceConfig: Record<string, { label: string; icon: string; color: string; urlFn?: (imdbId: string) => string }> = {
  "Internet Movie Database": {
    label: "IMDb",
    icon: "https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg",
    color: "text-yellow-400",
    urlFn: (id) => `https://www.imdb.com/title/${id}`,
  },
  "Rotten Tomatoes": {
    label: "RT",
    icon: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Rotten_Tomatoes.svg",
    color: "text-red-400",
  },
  Metacritic: {
    label: "Metacritic",
    icon: "https://upload.wikimedia.org/wikipedia/commons/2/20/Metacritic.svg",
    color: "text-yellow-300",
  },
};

const RatingBadge = ({ source, value, imdbId }: RatingBadgeProps) => {
  const cfg = sourceConfig[source];
  if (!cfg) {
    return (
      <div className="text-center">
        <p className="text-lg font-bold glow-text">{value}</p>
        <p className="text-[10px] text-muted-foreground">{source}</p>
      </div>
    );
  }

  const url = source === "Rotten Tomatoes"
    ? "https://www.rottentomatoes.com"
    : source === "Metacritic"
    ? "https://www.metacritic.com"
    : cfg.urlFn && imdbId
    ? cfg.urlFn(imdbId)
    : undefined;

  const inner = (
    <div className="text-center flex flex-col items-center gap-1">
      <img src={cfg.icon} alt={cfg.label} className="h-4 w-auto" />
      <p className="text-lg font-bold glow-text">{value}</p>
    </div>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform cursor-pointer">
        {inner}
      </a>
    );
  }

  return inner;
};

export default RatingBadge;
