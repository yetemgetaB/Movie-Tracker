import { useState, useEffect, useMemo } from "react";
import { Database, Search, Film, Tv, ArrowUp, ArrowDown, ArrowUpDown, Trash2, Filter, Edit2, X, Check, Eye, Star, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCollection, removeFromCollection, updateCollectionItem, type CollectionItem, type CollectionMovie, type CollectionSeries } from "@/lib/collection";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type SortDir = "asc" | "desc" | null;
type MovieSortKey = "title" | "year" | "seasons" | "userRating" | "imdb" | "rt" | "director" | "rated" | "startDate" | "genre";
type SeriesSortKey = "title" | "seasons" | "episodes" | "genre" | "startDate" | "finishDate" | "userRating" | "imdb" | "status";

function sortBy<T>(items: T[], key: string, dir: SortDir): T[] {
  if (!dir) return items;
  return [...items].sort((a, b) => {
    const av = String((a as any)[key] || "");
    const bv = String((b as any)[key] || "");
    const numA = parseFloat(av);
    const numB = parseFloat(bv);
    if (!isNaN(numA) && !isNaN(numB)) return dir === "asc" ? numA - numB : numB - numA;
    return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
  if (!active || !dir) return <ArrowUpDown size={12} className="text-muted-foreground/50" />;
  return dir === "asc" ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />;
};

// Edit dialog for collection items
const EditDialog = ({ item, open, onClose, onSave }: {
  item: CollectionItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<CollectionItem>) => void;
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      const data: Record<string, string> = {};
      Object.entries(item).forEach(([k, v]) => {
        if (typeof v === "string" || typeof v === "number") data[k] = String(v);
      });
      setFormData(data);
    }
  }, [item]);

  if (!item) return null;

  const editableFields = item.type === "movie"
    ? [
        { key: "userRating", label: "My Rating", type: "number" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "finishDate", label: "Finish Date", type: "date" },
        { key: "genre", label: "Genre", type: "text" },
        { key: "rated", label: "Rated", type: "text" },
      ]
    : [
        { key: "userRating", label: "My Rating", type: "number" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "finishDate", label: "Finish Date", type: "date" },
        { key: "status", label: "Status", type: "text" },
        { key: "genre", label: "Genre", type: "text" },
      ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Edit2 size={16} className="text-primary" /> Edit: {item.title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex gap-4">
          <img src={item.poster} alt="" className="w-20 h-28 object-cover rounded-lg shrink-0" />
          <div className="space-y-3 flex-1">
            {editableFields.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground block mb-1">{f.label}</label>
                <Input
                  type={f.type}
                  value={formData[f.key] || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="h-8 text-sm bg-secondary/50 border-border/50"
                  step={f.type === "number" ? "0.1" : undefined}
                  min={f.type === "number" ? "0" : undefined}
                  max={f.type === "number" ? "10" : undefined}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => {
              const updates: Record<string, string> = {};
              editableFields.forEach((f) => { updates[f.key] = formData[f.key] || ""; });
              onSave(updates);
              onClose();
            }}
            className="bg-primary text-primary-foreground"
          >
            <Check size={14} className="mr-1" /> Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Stats banner
const VaultStats = ({ movies, series }: { movies: CollectionMovie[]; series: CollectionSeries[] }) => {
  const totalWatchTime = movies.reduce((s, m) => s + (parseInt((m as any).runtime) || 0), 0);
  const avgRating = (() => {
    const all = [...movies, ...series].filter((c) => c.userRating && c.userRating !== "—");
    if (!all.length) return "—";
    return (all.reduce((s, c) => s + (parseFloat(c.userRating) || 0), 0) / all.length).toFixed(1);
  })();
  const topGenre = (() => {
    const map = new Map<string, number>();
    [...movies, ...series].forEach((c) => c.genre.split(",").forEach((g) => {
      const t = g.trim();
      if (t) map.set(t, (map.get(t) || 0) + 1);
    }));
    let best = "—";
    let max = 0;
    map.forEach((v, k) => { if (v > max) { max = v; best = k; } });
    return best;
  })();

  return (
    <div className="grid grid-cols-4 gap-2 fade-up" style={{ animationDelay: "0.05s" }}>
      {[
        { icon: Film, label: "Movies", value: movies.length },
        { icon: Tv, label: "Series", value: series.length },
        { icon: Clock, label: "Watch Time", value: totalWatchTime > 0 ? `${Math.floor(totalWatchTime / 60)}h` : "—" },
        { icon: Star, label: "Avg Rating", value: avgRating },
      ].map((s) => (
        <div key={s.label} className="glass-panel-strong p-3 text-center">
          <s.icon size={14} className="mx-auto text-primary mb-1" />
          <p className="text-sm font-bold font-display">{s.value}</p>
          <p className="text-[10px] text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
};

const VaultPage = () => {
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState("");
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [movieSort, setMovieSort] = useState<{ key: MovieSortKey; dir: SortDir }>({ key: "title", dir: null });
  const [seriesSort, setSeriesSort] = useState<{ key: SeriesSortKey; dir: SortDir }>({ key: "title", dir: null });
  const [genreFilter, setGenreFilter] = useState("all");
  const [editItem, setEditItem] = useState<CollectionItem | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const loadCollection = () => setCollection(getCollection());

  useEffect(() => {
    // Load from localStorage only
    loadCollection();
    window.addEventListener("focus", loadCollection);
    return () => window.removeEventListener("focus", loadCollection);
  }, []);

  const movies = collection.filter((c): c is CollectionMovie => c.type === "movie");
  const series = collection.filter((c): c is CollectionSeries => c.type === "series");

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    collection.forEach((c) => c.genre.split(",").forEach((g) => { const t = g.trim(); if (t) set.add(t); }));
    return Array.from(set).sort();
  }, [collection]);

  const filterBySearch = <T extends { title: string; genre: string }>(items: T[]) =>
    items.filter((m) =>
      m.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.genre.toLowerCase().includes(searchFilter.toLowerCase())
    );

  const filterByGenre = <T extends { genre: string }>(items: T[]) =>
    genreFilter === "all" ? items : items.filter((m) => m.genre.toLowerCase().includes(genreFilter.toLowerCase()));

  const filteredMovies = useMemo(() => {
    const filtered = filterByGenre(filterBySearch(movies));
    return sortBy(filtered, movieSort.key, movieSort.dir);
  }, [movies, searchFilter, genreFilter, movieSort]);

  const filteredSeries = useMemo(() => {
    const filtered = filterByGenre(filterBySearch(series));
    return sortBy(filtered, seriesSort.key, seriesSort.dir);
  }, [series, searchFilter, genreFilter, seriesSort]);

  const toggleMovieSort = (key: MovieSortKey) => {
    setMovieSort((prev) => ({
      key,
      dir: prev.key === key ? (prev.dir === "asc" ? "desc" : prev.dir === "desc" ? null : "asc") : "asc",
    }));
  };

  const toggleSeriesSort = (key: SeriesSortKey) => {
    setSeriesSort((prev) => ({
      key,
      dir: prev.key === key ? (prev.dir === "asc" ? "desc" : prev.dir === "desc" ? null : "asc") : "asc",
    }));
  };

  const handleRemove = (id: number, _type: "movie" | "series", title: string) => {
    removeFromCollection(id);
    loadCollection();
    toast({ title: `${title} removed from Vault` });
  };

  const handleSaveEdit = (updates: Partial<CollectionItem>) => {
    if (!editItem) return;
    updateCollectionItem(editItem.id, updates);
    loadCollection();
    toast({ title: `${editItem.title} updated!` });
  };

  const handleRowClick = (item: CollectionItem) => {
    navigate(item.type === "movie" ? `/movies?id=${item.id}` : `/series?id=${item.id}`);
  };

  const MovieSortHeader = ({ label, sortKey }: { label: string; sortKey: MovieSortKey }) => (
    <TableHead
      className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => toggleMovieSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label} <SortIcon active={movieSort.key === sortKey} dir={movieSort.key === sortKey ? movieSort.dir : null} />
      </span>
    </TableHead>
  );

  const SeriesSortHeader = ({ label, sortKey }: { label: string; sortKey: SeriesSortKey }) => (
    <TableHead
      className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => toggleSeriesSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label} <SortIcon active={seriesSort.key === sortKey} dir={seriesSort.key === sortKey ? seriesSort.dir : null} />
      </span>
    </TableHead>
  );

  // Grid card view
  const GridCard = ({ item }: { item: CollectionItem }) => (
    <div
      className="glass-panel card-hover p-3 cursor-pointer group"
      onClick={() => handleRowClick(item)}
    >
      <div className="relative">
        <img src={item.poster} alt={item.title} className="w-full aspect-[2/3] object-cover rounded-lg" />
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditItem(item); }}
            className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRemove(item.id, item.type, item.title); }}
            className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
        {item.userRating && item.userRating !== "—" && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-xs font-bold">
            ★ {item.userRating}
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.year} · {item.genre.split(",")[0]}</p>
      </div>
    </div>
  );

  return (
    <div className="px-6 pt-6 space-y-4">
      <div className="fade-up">
        <h1 className="text-2xl font-bold font-display">
          <Database size={24} className="inline mr-2 text-primary" />
          Vault
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your complete collection · {movies.length} movies · {series.length} series
        </p>
      </div>

      <VaultStats movies={movies} series={series} />

      {/* Search + Filter + View Toggle */}
      <div className="flex gap-2 fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Filter collection..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="pl-9 bg-secondary/50 border-border/50" />
        </div>
        {allGenres.length > 0 && (
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-[130px] bg-secondary/50 border-border/50">
              <Filter size={14} className="mr-1" />
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {allGenres.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex rounded-lg overflow-hidden border border-border/50">
          <button
            onClick={() => setViewMode("table")}
            className={`px-2.5 py-1.5 text-xs transition-colors ${viewMode === "table" ? "bg-primary/20 text-primary" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}
          >
            ☰
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`px-2.5 py-1.5 text-xs transition-colors ${viewMode === "grid" ? "bg-primary/20 text-primary" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}
          >
            ▦
          </button>
        </div>
      </div>

      <Tabs defaultValue="movies" className="fade-up" style={{ animationDelay: "0.15s" }}>
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="movies" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Film size={14} className="mr-1.5" /> Movies ({filteredMovies.length})
          </TabsTrigger>
          <TabsTrigger value="series" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Tv size={14} className="mr-1.5" /> Series ({filteredSeries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movies" className="mt-4">
          {filteredMovies.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-3 gap-3">
                {filteredMovies.map((m) => <GridCard key={m.id} item={m} />)}
              </div>
            ) : (
              <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Poster</TableHead>
                        <MovieSortHeader label="Title" sortKey="title" />
                        <MovieSortHeader label="Genre" sortKey="genre" />
                        <MovieSortHeader label="Year" sortKey="year" />
                        <MovieSortHeader label="Seasons" sortKey="seasons" />
                        <MovieSortHeader label="My Rating" sortKey="userRating" />
                        <MovieSortHeader label="IMDb" sortKey="imdb" />
                        <MovieSortHeader label="RT" sortKey="rt" />
                        <MovieSortHeader label="Start Date" sortKey="startDate" />
                        <TableHead className="text-muted-foreground w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovies.map((m) => (
                        <TableRow
                          key={m.id}
                          className="border-border/30 hover:bg-secondary/30 cursor-pointer"
                          onClick={() => handleRowClick(m)}
                        >
                          <TableCell><img src={m.poster} alt="" className="w-10 h-14 object-cover rounded" /></TableCell>
                          <TableCell className="font-medium">{m.title}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{m.genre.split(",")[0]}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{m.year}</TableCell>
                          <TableCell className="text-muted-foreground">{m.seasons}</TableCell>
                          <TableCell className="glow-text font-medium">{m.userRating}/10</TableCell>
                          <TableCell className="text-muted-foreground">{m.imdb}</TableCell>
                          <TableCell className="text-muted-foreground">{m.rt}</TableCell>
                          <TableCell className="text-muted-foreground">{m.startDate}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); setEditItem(m); }} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleRemove(m.id, "movie", m.title); }} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          ) : (
            <div className="glass-panel p-12 text-center">
              <Film size={48} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No movies in your collection yet</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Search for movies and add them to your Vault</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="series" className="mt-4">
          {filteredSeries.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-3 gap-3">
                {filteredSeries.map((s) => <GridCard key={s.id} item={s} />)}
              </div>
            ) : (
              <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Poster</TableHead>
                        <SeriesSortHeader label="Title" sortKey="title" />
                        <SeriesSortHeader label="Seasons" sortKey="seasons" />
                        <SeriesSortHeader label="Episodes" sortKey="episodes" />
                        <SeriesSortHeader label="Genre" sortKey="genre" />
                        <SeriesSortHeader label="Start" sortKey="startDate" />
                        <SeriesSortHeader label="Finish" sortKey="finishDate" />
                        <SeriesSortHeader label="My Rating" sortKey="userRating" />
                        <SeriesSortHeader label="IMDb" sortKey="imdb" />
                        <SeriesSortHeader label="Status" sortKey="status" />
                        <TableHead className="text-muted-foreground w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSeries.map((s) => (
                        <TableRow
                          key={s.id}
                          className="border-border/30 hover:bg-secondary/30 cursor-pointer"
                          onClick={() => handleRowClick(s)}
                        >
                          <TableCell><img src={s.poster} alt="" className="w-10 h-14 object-cover rounded" /></TableCell>
                          <TableCell className="font-medium">{s.title}</TableCell>
                          <TableCell>{s.seasons}</TableCell>
                          <TableCell>{s.episodes}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{s.genre.split(",")[0]}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{s.startDate}</TableCell>
                          <TableCell className="text-muted-foreground">{s.finishDate}</TableCell>
                          <TableCell className="glow-text font-medium">{s.userRating}/10</TableCell>
                          <TableCell className="text-muted-foreground">{s.imdb}</TableCell>
                          <TableCell>
                            <Badge variant={s.status === "Ended" ? "secondary" : "outline"} className={`text-xs ${s.status !== "Ended" ? "border-green-500/50 text-green-400" : ""}`}>
                              {s.status === "Ended" ? "Finished" : "Ongoing"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); setEditItem(s); }} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleRemove(s.id, "series", s.title); }} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          ) : (
            <div className="glass-panel p-12 text-center">
              <Tv size={48} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No series in your collection yet</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Search for series and add them to your Vault</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EditDialog item={editItem} open={!!editItem} onClose={() => setEditItem(null)} onSave={handleSaveEdit} />
    </div>
  );
};

export default VaultPage;
