import { useState, useEffect, useMemo } from "react";
import {
  FolderPlus,
  Play,
  RefreshCw,
  Folder,
  Trash2,
  Tv,
  Film,
  Search,
  Sparkles,
  ChevronDown,
  ChevronRight,
  HardDrive,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  getSavedFolders,
  saveFolders,
  pickFolderNative,
  scanFolderNative,
  parseFilename,
  matchMediaWithTmdb,
  groupSeriesEpisodes,
  launchMediaNative,
  type ParsedMediaItem,
  type LocalSeriesGroup,
} from "@/lib/mediaScanner";
import { addToCollection, isInCollection } from "@/lib/collection";

const LOCAL_ITEMS_CACHE_KEY = "movie_tracker_cached_local_media";

export default function LocalMediaView() {
  const [folders, setFolders] = useState<string[]>([]);
  const [items, setItems] = useState<ParsedMediaItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<"all" | "series" | "movies">("all");
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});
  const [preferredPlayer, setPreferredPlayer] = useState<string>(() => {
    return localStorage.getItem("movie_tracker_preferred_player_path") || "";
  });

  // Load saved folders and cached media items
  useEffect(() => {
    const saved = getSavedFolders();
    setFolders(saved);

    try {
      const cached = localStorage.getItem(LOCAL_ITEMS_CACHE_KEY);
      if (cached) {
        setItems(JSON.parse(cached));
      }
    } catch {}
  }, []);

  const handleAddFolder = async () => {
    const selected = await pickFolderNative();
    if (!selected) return;

    if (folders.includes(selected)) {
      toast({ title: "Folder already added", description: selected });
      return;
    }

    const updated = [...folders, selected];
    setFolders(updated);
    saveFolders(updated);
    toast({ title: "Folder added", description: selected });

    // Automatically trigger a scan
    scanAllFolders(updated);
  };

  const handleRemoveFolder = (folderToRemove: string) => {
    const updated = folders.filter((f) => f !== folderToRemove);
    setFolders(updated);
    saveFolders(updated);
    toast({ title: "Folder removed" });
  };

  const scanAllFolders = async (foldersToScan = folders) => {
    if (foldersToScan.length === 0) {
      toast({ title: "No folders configured", description: "Add a media folder to start scanning." });
      return;
    }

    setIsScanning(true);
    toast({ title: "Scanning folders...", description: `Scanning ${foldersToScan.length} directories.` });

    try {
      const allParsed: ParsedMediaItem[] = [];

      for (const folder of foldersToScan) {
        const rawFiles = await scanFolderNative(folder);
        for (const file of rawFiles) {
          const parsed = parseFilename(file.path, file.filename, file.size_bytes);
          allParsed.push(parsed);
        }
      }

      // Match items with TMDB in batches
      const matched: ParsedMediaItem[] = [];
      for (const item of allParsed) {
        const withTmdb = await matchMediaWithTmdb(item);
        matched.push(withTmdb);
      }

      setItems(matched);
      localStorage.setItem(LOCAL_ITEMS_CACHE_KEY, JSON.stringify(matched));
      toast({
        title: "Scan Complete!",
        description: `Discovered ${matched.length} media files across your folders.`,
      });
    } catch (err) {
      console.error("Scan error:", err);
      toast({
        title: "Scan failed",
        description: "An error occurred while scanning directories.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handlePlayMedia = async (item: ParsedMediaItem) => {
    try {
      const playerUsed = await launchMediaNative(item.filePath, preferredPlayer);
      toast({
        title: `Playing in ${playerUsed.includes("PotPlayer") ? "PotPlayer" : "Media Player"}`,
        description: item.rawFilename,
      });

      // Auto-track playback start in Vault Collection
      const nowStr = new Date().toISOString().slice(0, 10);
      if (item.type === "movie") {
        if (!isInCollection(item.tmdbMatch?.id || 999999, "movie")) {
          addToCollection({
            id: item.tmdbMatch?.id || Date.now(),
            type: "movie",
            title: item.tmdbMatch?.title || item.title,
            poster: item.tmdbMatch?.poster || "",
            genre: "Local Media",
            year: String(item.year || new Date().getFullYear()),
            userRating: "",
            startDate: nowStr,
            finishDate: "",
            addedAt: new Date().toISOString(),
            notes: `Local File: ${item.filePath}`,
            director: "",
            stars: "",
            rated: "",
            imdb: "",
            rt: "",
          });
        }
      }
    } catch (err) {
      console.error("Launch error:", err);
      toast({
        title: "Launch failed",
        description: "Could not open media file.",
        variant: "destructive",
      });
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rawFilename.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        mediaTypeFilter === "all" ||
        (mediaTypeFilter === "series" && item.type === "series") ||
        (mediaTypeFilter === "movies" && item.type === "movie");

      return matchesSearch && matchesType;
    });
  }, [items, searchQuery, mediaTypeFilter]);

  const seriesGroups = useMemo(() => {
    const seriesItems = filteredItems.filter((i) => i.type === "series");
    return groupSeriesEpisodes(seriesItems);
  }, [filteredItems]);

  const movieItems = useMemo(() => {
    return filteredItems.filter((i) => i.type === "movie");
  }, [filteredItems]);

  const toggleSeries = (title: string) => {
    setExpandedSeries((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="space-y-6">
      {/* Folder management bar */}
      <div className="glass-panel p-4 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HardDrive size={18} className="text-primary" />
            <span className="text-sm font-semibold">Local Media Folders</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {folders.length} configured
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddFolder}
              className="h-8 gap-1.5 text-xs rounded-lg"
            >
              <FolderPlus size={14} className="text-primary" />
              Add Folder
            </Button>
            <Button
              size="sm"
              onClick={() => scanAllFolders()}
              disabled={isScanning || folders.length === 0}
              className="h-8 gap-1.5 text-xs rounded-lg"
            >
              <RefreshCw size={13} className={isScanning ? "animate-spin" : ""} />
              {isScanning ? "Scanning..." : "Scan Now"}
            </Button>
          </div>
        </div>

        {/* Folder pills */}
        {folders.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {folders.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-secondary/40 border border-border/40 text-xs font-mono text-muted-foreground"
              >
                <Folder size={12} className="text-primary" />
                <span className="truncate max-w-xs">{f}</span>
                <button
                  onClick={() => handleRemoveFolder(f)}
                  className="hover:text-destructive transition-colors ml-1"
                  title="Remove folder"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No folders added yet. Click "Add Folder" to select your local movie/TV series directory.
          </p>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search local titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs bg-secondary/50 border-border/50 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-secondary/40 p-1 rounded-lg border border-border/40">
            <button
              onClick={() => setMediaTypeFilter("all")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mediaTypeFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({filteredItems.length})
            </button>
            <button
              onClick={() => setMediaTypeFilter("series")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                mediaTypeFilter === "series" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Tv size={12} /> Series ({seriesGroups.length})
            </button>
            <button
              onClick={() => setMediaTypeFilter("movies")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                mediaTypeFilter === "movies" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Film size={12} /> Movies ({movieItems.length})
            </button>
          </div>
        </div>
      )}

      {/* Series Section */}
      {seriesGroups.length > 0 && (mediaTypeFilter === "all" || mediaTypeFilter === "series") && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Tv size={14} className="text-primary" /> TV Series ({seriesGroups.length})
          </h3>
          <div className="space-y-3">
            {seriesGroups.map((group) => {
              const isOpen = expandedSeries[group.seriesTitle];
              return (
                <div
                  key={group.seriesTitle}
                  className="glass-panel rounded-xl overflow-hidden border border-border/50 transition-all"
                >
                  <div
                    onClick={() => toggleSeries(group.seriesTitle)}
                    className="p-3 sm:p-4 flex items-center gap-3.5 cursor-pointer hover:bg-secondary/30 transition-colors"
                  >
                    {group.poster ? (
                      <img
                        src={group.poster}
                        alt={group.seriesTitle}
                        className="w-12 h-16 object-cover rounded-md shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-16 rounded-md bg-secondary/80 flex items-center justify-center flex-shrink-0">
                        <Tv size={20} className="text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm truncate">{group.seriesTitle}</h4>
                        {group.rating && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            ★ {group.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {group.seasons.length} {group.seasons.length === 1 ? "Season" : "Seasons"} · {group.totalEpisodes} Episodes found
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const firstEp = group.seasons[0]?.episodes[0];
                          if (firstEp) handlePlayMedia(firstEp);
                        }}
                        className="h-7 text-xs gap-1 rounded-lg"
                      >
                        <Play size={11} fill="currentColor" /> Play Next
                      </Button>
                      <button className="text-muted-foreground p-1">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Season/Episode Tree */}
                  {isOpen && (
                    <div className="border-t border-border/40 bg-secondary/15 p-3 space-y-3">
                      {group.seasons.map((season) => (
                        <div key={season.seasonNumber} className="space-y-1.5">
                          <span className="text-xs font-semibold text-foreground/80 px-2">
                            Season {season.seasonNumber}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {season.episodes.map((ep) => (
                              <div
                                key={ep.filePath}
                                className="flex items-center justify-between p-2 rounded-lg bg-card/60 hover:bg-card border border-border/30 transition-all text-xs"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-primary">
                                      E{String(ep.episode).padStart(2, "0")}
                                    </span>
                                    <span className="truncate text-foreground/90 font-medium">
                                      {ep.rawFilename}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                    {ep.resolution && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">{ep.resolution}</Badge>}
                                    <span>{ep.format.toUpperCase()}</span>
                                    <span>{ep.sizeFormatted}</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handlePlayMedia(ep)}
                                  className="h-7 w-7 p-0 rounded-full hover:bg-primary/20 hover:text-primary transition-colors flex-shrink-0"
                                  title="Play in PotPlayer"
                                >
                                  <Play size={12} fill="currentColor" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Movies Section */}
      {movieItems.length > 0 && (mediaTypeFilter === "all" || mediaTypeFilter === "movies") && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Film size={14} className="text-primary" /> Movies ({movieItems.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {movieItems.map((movie) => (
              <div
                key={movie.filePath}
                className="group relative rounded-xl overflow-hidden bg-card/70 border border-border/50 shadow-sm hover:border-primary/50 transition-all cursor-pointer flex flex-col"
                onClick={() => handlePlayMedia(movie)}
              >
                <div className="relative aspect-[2/3] w-full bg-secondary/40 overflow-hidden">
                  {movie.tmdbMatch?.poster ? (
                    <img
                      src={movie.tmdbMatch.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film size={28} className="text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Play overlay button */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>

                  {/* Resolution badge */}
                  {movie.resolution && (
                    <div className="absolute top-2 left-2">
                      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-black/70 backdrop-blur-sm border-white/10 text-white">
                        {movie.resolution}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                      {movie.tmdbMatch?.title || movie.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {movie.year || movie.tmdbMatch?.year || "Local"} · {movie.sizeFormatted}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && !isScanning && (
        <div className="glass-panel p-12 text-center rounded-2xl border border-border/50">
          <HardDrive size={36} className="text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No local media scanned</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Connect your local drive or folders to browse your movies and TV series with automatic metadata and one-click PotPlayer playback.
          </p>
          <Button onClick={handleAddFolder} size="sm" className="gap-2 rounded-lg">
            <FolderPlus size={14} /> Add Folder to Scan
          </Button>
        </div>
      )}
    </div>
  );
}
