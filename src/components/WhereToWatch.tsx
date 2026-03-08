// Where to Watch component — shows streaming providers
import { useQuery } from "@tanstack/react-query";
import { img, hasTmdbKey, type WatchProvider } from "@/lib/tmdb";

interface Props {
  tmdbId: number;
  type: "movie" | "series";
  fetchFn: (id: number) => Promise<any>;
}

const ProviderRow = ({ label, providers }: { label: string; providers?: WatchProvider[] }) => {
  if (!providers || providers.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {providers.map((p) => (
          <div key={p.provider_id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors" title={p.provider_name}>
            <img
              src={img(p.logo_path, "w92")}
              alt={p.provider_name}
              className="w-6 h-6 rounded"
              loading="lazy"
            />
            <span className="text-[11px] text-foreground">{p.provider_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WhereToWatch = ({ tmdbId, type, fetchFn }: Props) => {
  const { data: providers } = useQuery({
    queryKey: [`${type}-watch-providers`, tmdbId],
    queryFn: () => fetchFn(tmdbId),
    enabled: hasTmdbKey(),
    staleTime: 1000 * 60 * 30,
  });

  if (!providers) return null;

  const hasAny =
    (providers.flatrate?.length || 0) +
    (providers.rent?.length || 0) +
    (providers.buy?.length || 0) > 0;

  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        📺 Where to Watch
      </h3>
      <div className="glass-panel p-4 space-y-3">
        <ProviderRow label="Stream" providers={providers.flatrate} />
        <ProviderRow label="Rent" providers={providers.rent} />
        <ProviderRow label="Buy" providers={providers.buy} />
        {providers.link && (
          <a
            href={providers.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline"
          >
            View all options on TMDB →
          </a>
        )}
      </div>
    </div>
  );
};

export default WhereToWatch;
