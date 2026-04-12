import { useState, useEffect, useMemo } from "react";
import { Database, Search, Film, Tv, ArrowUp, ArrowDown, ArrowUpDown, Trash2, Filter, Edit2, X, Check, Eye, Star, Calendar, Clock, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getCollection, removeFromCollection, updateCollectionItem, type CollectionItem, type CollectionMovie, type CollectionSeries } from "@/lib/collection";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { formatDisplayDate, getStatusInfo } from "@/lib/dateUtils";

// ── Rating display ───────────────────────────────────────────────
function formatRating(val: string | undefined | null): { text: string; hasValue: boolean } {
  if (!val || val === "—" || val.trim() === "" || val === "0") return { text: "—", hasValue: false };
  const n = parseFloat(val);
  if (isNaN(n)) return { text: "—", hasValue: false };
  return { text: n % 1 === 0 ? `${n}` : n.toFixed(1), hasValue: true };
}

// ── Poster fallback ──────────────────────────────────────────────
const PosterImage = ({ src, title, className = "" }: { src: string; title: string; className?: string }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-secondary/80 rounded ${className}`}>
        <span className="text-lg font-bold text-muted-foreground/50">{title.charAt(0).toUpperCase()}</span>
      </div>
    );
  }
  return <img src={src} alt={title} className={`object-cover rounded ${className}`} onError={() => setFailed(true)} />;
};

// ── Sorting ──────────────────────────────────────────────────────
type SortDir = "asc" | "desc" | null;
type MovieSortKey = "title" | "year" | "userRating" | "imdb" | "rt" | "director" | "rated" | "startDate" | "finishDate" | "genre";
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
  if (!active || !dir) return <ArrowUpDown size={12} className="text-muted-foreground/40" />;
  return dir === "asc" ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />;
};

// ── Edit dialog ──────────────────────────────────────────────────
const EditDialog = ({ item, open, onClose, onSave }: {
  item: CollectionItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<CollectionItem>) => void;
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      const data: Record<string, string> = {};
      Object.entries(item).forEach(([k, v]) => {
        if (typeof v === "string" || typeof v === "number") data[k] = String(v);
      });
      setFormData(data);
      setNotes(item.notes || "");
    }
  }, [item]);

  if (!item) return null;

  const editableFields = item.type === "movie"
    ? [
        { key: "userRating", label: "My Rating (0–10)", type: "number" },
        { key: "startDate", label: "Start Date", type: "text", placeholder: "Mar 13, 2026" },
        { key: "finishDate", label: "Finish Date", type: "text", placeholder: "Mar 20, 2026" },
        { key: "genre", label: "Genre", type: "text" },
        { key: "rated", label: "Rated", type: "text" },
      ]
    : [
        { key: "userRating", label: "My Rating (0–10)", type: "number" },
        { key: "startDate", label: "Start Date", type: "text", placeholder: "Mar 13, 2026" },
        { key: "finishDate", label: "Finish Date", type: "text", placeholder: "Mar 20, 2026" },
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
          <PosterImage src={item.poster} title={item.title} className="w-20 h-28 shrink-0" />
          <div className="space-y-3 flex-1">
            {editableFields.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground block mb-1">{f.label}</label>
                <Input
                  type={f.type === "number" ? "number" : "text"}
                  value={formData[f.key] || ""}
                  placeholder={(f as any).placeholder || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="h-8 text-sm bg-secondary/50 border-border/50"
                  step={f.type === "number" ? "0.1" : undefined}
                  min={f.type === "number" ? "0" : undefined}
                  max={f.type === "number" ? "10" : undefined}
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Personal notes about this title..."
                className="text-sm bg-secondary/50 border-border/50 min-h-[60px] resize-none"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => {
              const updates: Record<string, string> = {};
              editableFields.forEach((f) => { updates[f.key] = formData[f.key] || ""; });
              (updates as any).notes = notes;
              onSave(updates);
              onClose();
            }}
            className="bg-primary text-primary-foreground"
          >
            <Check size={14} className="mr-1" /> Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Stats banner ─────────────────────────────────────────────────
const VaultStats = ({ movies, series }: { movies: CollectionMovie[]; series: CollectionSeries[] }) => {
  const totalWatchTime = movies.reduce((s, m) => s + (parseInt((m as any).runtime) || 0), 0);
  const avgRating = (() => {
    const all = [...movies, ...series].filter((c) => c.userRating && c.userRating !== "—" && c.userRating.trim() !== "");
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

  const stats = [
    { icon: Film, label: "Movies", value: movies.length, color: "text-blue-400" },
    { icon: Tv, label: "Series", value: series.length, color: "text-purple-400" },
    { icon: Clock, label: "Watch Time", value: totalWatchTime > 0 ? `${Math.floor(totalWatchTime / 60)}h ${totalWatchTime % 60}m` : "—", color: "text-emerald-400" },
    { icon: Star, label: "Avg Rating", value: avgRating, color: "text-amber-400" },
    { icon: TrendingUp, label: "Top Genre", value: topGenre, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-5 gap-2 fade-up" style={{ animationDelay: "0.05s" }}>
      {stats.map((s) => (
        <div key={s.label} className="glass-panel-strong p-3 text-center group hover:border-primary/30 transition-colors">
          <s.icon size={14} className={`mx-auto mb-1.5 ${s.color}`} />
          <p className="text-sm font-bold font-display truncate">{s.value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
        </div>
      ))}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────
const VaultPage = () => {
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState("");
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [movieSort, setMovieSort] = useState<{ key: MovieSortKey; dir: SortDir }>({ key: "title", dir: null });
  const [seriesSort, setSeriesSort] = useState<{ key: SeriesSortKey; dir: SortDir }>({ key: "title", dir: null });
  const [genreFilter, setGenreFilter] = useState("all");
  const [editItem, setEditItem] = useState<CollectionItem | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; type: "movie" | "series"; title: string } | null>(null);

  const loadCollection = () => setCollection(getCollection());

  useEffect(() => {
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

  const handleRemove = (id: number, type: "movie" | "series", title: string) => {
    setDeleteConfirm({ id, type, title });
  };

  const confirmRemove = () => {
    if (!deleteConfirm) return;
    removeFromCollection(deleteConfirm.id, deleteConfirm.type as "movie" | "series");
    loadCollection();
    toast({ title: `${deleteConfirm.title} removed from Vault` });
    setDeleteConfirm(null);
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
      className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none text-xs uppercase tracking-wider"
      onClick={() => toggleMovieSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label} <SortIcon active={movieSort.key === sortKey} dir={movieSort.key === sortKey ? movieSort.dir : null} />
      </span>
    </TableHead>
  );

  const SeriesSortHeader = ({ label, sortKey }: { label: string; sortKey: SeriesSortKey }) => (
    <TableHead
      className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none text-xs uppercase tracking-wider"
      onClick={() => toggleSeriesSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label} <SortIcon active={seriesSort.key === sortKey} dir={seriesSort.key === sortKey ? seriesSort.dir : null} />
      </span>
    </TableHead>
  );

  // ── Rating cell ────────────────────────────────────────────────
  const RatingCell = ({ value }: { value: string }) => {
    const r = formatRating(value);
    if (!r.hasValue) return <span className="text-muted-foreground/40">—</span>;
    return <span className="text-primary font-semibold">★ {r.text}</span>;
  };

  const ScoreCell = ({ value }: { value: string }) => {
    if (!value || value === "—" || value.trim() === "") return <span className="text-muted-foreground/40">—</span>;
    return <span className="text-muted-foreground">{value}</span>;
  };

  // ── Grid card ──────────────────────────────────────────────────
  const GridCard = ({ item }: { item: CollectionItem }) => {
    const status = getStatusInfo(item.type === "series" ? (item as CollectionSeries).status : "");
    const rating = formatRating(item.userRating);

    return (
      <div
        className="glass-panel overflow-hidden cursor-pointer group hover:border-primary/30 transition-all duration-200"
        onClick={() => handleRowClick(item)}
      >
        <div className="relative aspect-[2/3]">
          <PosterImage src={item.poster} title={item.title} className="w-full h-full" />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80" />
          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          {/* Rating badge */}
          {rating.hasValue && (
            <div className="absolute bottom-12 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-xs font-bold shadow-lg">
              ★ {rating.text}
            </div>
          )}
          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-sm font-semibold truncate text-foreground">{item.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground">{item.year}</span>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-xs text-muted-foreground">{item.genre.split(",")[0]?.trim()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Empty state ────────────────────────────────────────────────
  const EmptyState = ({ type }: { type: "movie" | "series" }) => (
    <div className="glass-panel p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto mb-4">
        {type === "movie" ? <Film size={28} className="text-muted-foreground/40" /> : <Tv size={28} className="text-muted-foreground/40" />}
      </div>
      <p className="text-foreground font-medium mb-1">No {type === "movie" ? "movies" : "series"} yet</p>
      <p className="text-muted-foreground text-sm mb-4">Start building your collection by browsing titles</p>
      <Button size="sm" variant="outline" onClick={() => navigate("/browse")} className="border-primary/30 text-primary hover:bg-primary/10">
        <Search size={14} className="mr-1.5" /> Browse {type === "movie" ? "Movies" : "Series"}
      </Button>
    </div>
  );

  return (
    <div className="px-6 pt-6 pb-24 space-y-4">
      <div className="fade-up">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Database size={22} className="text-primary" />
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
          <Input placeholder="Search by title or genre..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="pl-9 bg-secondary/50 border-border/50" />
        </div>
        {allGenres.length > 0 && (
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-[140px] bg-secondary/50 border-border/50">
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

        {/* ── Movies Tab ─────────────────────────────────────────── */}
        <TabsContent value="movies" className="mt-4">
          {filteredMovies.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredMovies.map((m) => <GridCard key={m.id} item={m} />)}
              </div>
            ) : (
              <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs uppercase tracking-wider w-14"></TableHead>
                        <MovieSortHeader label="Title" sortKey="title" />
                        <MovieSortHeader label="Genre" sortKey="genre" />
                        <MovieSortHeader label="Year" sortKey="year" />
                        <MovieSortHeader label="Rating" sortKey="userRating" />
                        <MovieSortHeader label="IMDb" sortKey="imdb" />
                        <MovieSortHeader label="RT" sortKey="rt" />
                        <MovieSortHeader label="Started" sortKey="startDate" />
                        <MovieSortHeader label="Finished" sortKey="finishDate" />
                        <TableHead className="text-muted-foreground w-20 text-xs uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovies.map((m, i) => (
                        <TableRow
                          key={m.id}
                          className={`border-border/20 hover:bg-primary/5 cursor-pointer transition-colors ${i % 2 === 1 ? "bg-secondary/10" : ""}`}
                          onClick={() => handleRowClick(m)}
                        >
                          <TableCell className="py-2"><PosterImage src={m.poster} title={m.title} className="w-10 h-14" /></TableCell>
                          <TableCell className="font-medium">{m.title}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs font-normal">{m.genre.split(",")[0]?.trim()}</Badge></TableCell>
                          <TableCell className="text-muted-foreground text-sm">{m.year}</TableCell>
                          <TableCell><RatingCell value={m.userRating} /></TableCell>
                          <TableCell><ScoreCell value={m.imdb} /></TableCell>
                          <TableCell><ScoreCell value={m.rt} /></TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDisplayDate(m.startDate)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDisplayDate(m.finishDate)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); setEditItem(m); }} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleRemove(m.id, "movie", m.title); }} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
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
            <EmptyState type="movie" />
          )}
        </TabsContent>

        {/* ── Series Tab ─────────────────────────────────────────── */}
        <TabsContent value="series" className="mt-4">
          {filteredSeries.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredSeries.map((s) => <GridCard key={s.id} item={s} />)}
              </div>
            ) : (
              <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs uppercase tracking-wider w-14"></TableHead>
                        <SeriesSortHeader label="Title" sortKey="title" />
                        <SeriesSortHeader label="Seasons" sortKey="seasons" />
                        <SeriesSortHeader label="Episodes" sortKey="episodes" />
                        <SeriesSortHeader label="Genre" sortKey="genre" />
                        <SeriesSortHeader label="Started" sortKey="startDate" />
                        <SeriesSortHeader label="Finished" sortKey="finishDate" />
                        <SeriesSortHeader label="Rating" sortKey="userRating" />
                        <SeriesSortHeader label="IMDb" sortKey="imdb" />
                        <SeriesSortHeader label="Status" sortKey="status" />
                        <TableHead className="text-muted-foreground w-20 text-xs uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSeries.map((s, i) => {
                        const statusInfo = getStatusInfo(s.status);
                        return (
                          <TableRow
                            key={s.id}
                            className={`border-border/20 hover:bg-primary/5 cursor-pointer transition-colors ${i % 2 === 1 ? "bg-secondary/10" : ""}`}
                            onClick={() => handleRowClick(s)}
                          >
                            <TableCell className="py-2"><PosterImage src={s.poster} title={s.title} className="w-10 h-14" /></TableCell>
                            <TableCell className="font-medium">{s.title}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{s.seasons}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{s.episodes}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs font-normal">{s.genre.split(",")[0]?.trim()}</Badge></TableCell>
                            <TableCell className="text-muted-foreground text-sm">{formatDisplayDate(s.startDate)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{formatDisplayDate(s.finishDate)}</TableCell>
                            <TableCell><RatingCell value={s.userRating} /></TableCell>
                            <TableCell><ScoreCell value={s.imdb} /></TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs border ${statusInfo.className}`}>
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setEditItem(s); }} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleRemove(s.id, "series", s.title); }} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          ) : (
            <EmptyState type="series" />
          )}
        </TabsContent>
      </Tabs>

      <EditDialog item={editItem} open={!!editItem} onClose={() => setEditItem(null)} onSave={handleSaveEdit} />

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-destructive" /> Remove from Vault?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteConfirm?.title}</strong> from your collection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VaultPage;
