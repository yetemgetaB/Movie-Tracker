import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Film, Tv, Search, Home, BarChart3, Database, Compass, Calendar, Settings, BookmarkCheck, Star } from "lucide-react";
import { getCollection } from "@/lib/collection";
import { tmdbApi, tmdbSeriesApi, img, hasTmdbKey } from "@/lib/tmdb";
import { useQuery } from "@tanstack/react-query";

const PAGES = [
  { name: "Home", path: "/", icon: Home },
  { name: "Movies", path: "/movies", icon: Film },
  { name: "Series", path: "/series", icon: Tv },
  { name: "Browse", path: "/browse", icon: Compass },
  { name: "Calendar", path: "/calendar", icon: Calendar },
  { name: "Vault", path: "/library", icon: Database },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
  { name: "Watchlist", path: "/watchlist", icon: BookmarkCheck },
  { name: "Settings", path: "/settings", icon: Settings },
];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const collection = getCollection();

  const filteredCollection = search.length >= 2
    ? collection.filter(c => c.title.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : [];

  const hasKey = hasTmdbKey();
  const { data: movieResults } = useQuery({
    queryKey: ["cmd-movies", search],
    queryFn: () => tmdbApi.search(search),
    enabled: search.length >= 3 && hasKey,
    staleTime: 1000 * 30,
  });

  const { data: seriesResults } = useQuery({
    queryKey: ["cmd-series", search],
    queryFn: () => tmdbSeriesApi.search(search),
    enabled: search.length >= 3 && hasKey,
    staleTime: 1000 * 30,
  });

  const tmdbMovies = (movieResults?.results || []).slice(0, 5);
  const tmdbSeries = (seriesResults?.results || []).slice(0, 5);

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
    setSearch("");
  }, [navigate]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search movies, series, pages..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Pages */}
        <CommandGroup heading="Pages">
          {PAGES.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || !search).map(page => (
            <CommandItem key={page.path} onSelect={() => handleSelect(page.path)} className="gap-2 cursor-pointer">
              <page.icon size={14} className="text-muted-foreground" />
              {page.name}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Collection */}
        {filteredCollection.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Your Collection">
              {filteredCollection.map(item => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item.type === "movie" ? `/movies?id=${item.id}` : `/series?id=${item.id}`)}
                  className="gap-2 cursor-pointer"
                >
                  {item.type === "movie" ? <Film size={14} className="text-primary" /> : <Tv size={14} className="text-purple-400" />}
                  <span>{item.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{item.year}</span>
                  {item.userRating && item.userRating !== "—" && (
                    <span className="text-xs text-primary flex items-center gap-0.5"><Star size={10} fill="currentColor" />{item.userRating}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* TMDB Movies */}
        {tmdbMovies.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Movies (TMDB)">
              {tmdbMovies.map(m => (
                <CommandItem key={m.id} onSelect={() => handleSelect(`/movies?id=${m.id}`)} className="gap-2 cursor-pointer">
                  <Film size={14} className="text-muted-foreground" />
                  <span>{m.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{m.release_date?.slice(0, 4)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* TMDB Series */}
        {tmdbSeries.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Series (TMDB)">
              {tmdbSeries.map(s => (
                <CommandItem key={s.id} onSelect={() => handleSelect(`/series?id=${s.id}`)} className="gap-2 cursor-pointer">
                  <Tv size={14} className="text-muted-foreground" />
                  <span>{s.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{s.first_air_date?.slice(0, 4)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
