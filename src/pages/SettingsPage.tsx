import { useState, useRef, useMemo, useCallback } from "react";
import {
  Settings, Key, Download, Upload, Palette, ChevronDown,
  BarChart3, Film, Tv, TrendingUp, Star, Server, Github, Heart, ExternalLink,
  CheckCircle2, AlertCircle, HelpCircle, Sun, Moon, FileJson, FileSpreadsheet, FileText,
  RefreshCw, Copy, Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { getCollection, type CollectionItem } from "@/lib/collection";

import { useAccentColor, ACCENT_PRESETS, type AccentColor } from "@/hooks/use-accent-color";
import { toast } from "@/hooks/use-toast";

const GENRE_COLORS = [
  "hsl(209, 95%, 35%)", "hsl(260, 70%, 60%)", "hsl(340, 70%, 55%)",
  "hsl(45, 90%, 55%)", "hsl(160, 70%, 45%)", "hsl(20, 85%, 55%)",
  "hsl(280, 60%, 50%)", "hsl(30, 80%, 50%)",
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const [tmdbKey, setTmdbKey] = useState(() => localStorage.getItem("movie_tracker_tmdb_key") || "");
  const [omdbKey, setOmdbKey] = useState(() => localStorage.getItem("movie_tracker_omdb_key") || "");
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem("movie_tracker_api_url") || "http://localhost:8080/api");
  const [showApiGuide, setShowApiGuide] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("movie_tracker_theme") !== "light");
  const [customColor, setCustomColor] = useState("#034178");
  const importRef = useRef<HTMLInputElement>(null);
  const { accent, setAccent } = useAccentColor();
  const [importItems, setImportItems] = useState<Record<string, any>[] | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Real-time stats
  const collection = useMemo(() => getCollection(), []);
  const movies = collection.filter((c) => c.type === "movie");
  const series = collection.filter((c) => c.type === "series");

  const genresBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    collection.forEach((c) => {
      if (c.genre && typeof c.genre === 'string') {
        c.genre.split(",").forEach((g) => {
          const name = g.trim();
          if (name) map.set(name, (map.get(name) || 0) + 1);
        });
      }
    });
    return Array.from(map.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);
  }, [collection]);

  const monthlyAdditions = useMemo(() => {
    const map = new Map<string, { movies: number; series: number }>();
    collection.forEach((c) => {
      if (c.addedAt && typeof c.addedAt === 'string') {
        const month = c.addedAt.slice(0, 7) || "Unknown";
        const entry = map.get(month) || { movies: 0, series: 0 };
        entry[c.type === "movie" ? "movies" : "series"]++;
        map.set(month, entry);
      }
    });
    return Array.from(map.entries())
      .map(([month, data]) => ({ month: month.slice(5) || month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [collection]);

  const hasTmdbKey = Boolean(tmdbKey && tmdbKey.length > 10);
  const hasOmdbKey = Boolean(omdbKey && omdbKey.length > 5);

  const saveApiKeys = () => {
    if (tmdbKey) localStorage.setItem("movie_tracker_tmdb_key", tmdbKey);
    if (omdbKey) localStorage.setItem("movie_tracker_omdb_key", omdbKey);
    toast({ title: "API keys saved! Refresh to apply." });
  };

  const saveApiUrl = () => {
    localStorage.setItem("movie_tracker_api_url", apiUrl);
    toast({ title: "API URL saved!" });
  };

  // Theme toggle
  const toggleTheme = useCallback((dark: boolean) => {
    setIsDarkMode(dark);
    const root = document.documentElement;
    if (dark) {
      localStorage.setItem("movie_tracker_theme", "dark");
      root.style.setProperty("--background", "220 20% 7%");
      root.style.setProperty("--foreground", "210 20% 92%");
      root.style.setProperty("--card", "220 18% 10%");
      root.style.setProperty("--card-foreground", "210 20% 92%");
      root.style.setProperty("--popover", "220 18% 10%");
      root.style.setProperty("--popover-foreground", "210 20% 92%");
      root.style.setProperty("--secondary", "220 15% 15%");
      root.style.setProperty("--secondary-foreground", "210 20% 85%");
      root.style.setProperty("--muted", "220 15% 13%");
      root.style.setProperty("--muted-foreground", "215 12% 50%");
      root.style.setProperty("--border", "220 15% 18%");
      root.style.setProperty("--input", "220 15% 18%");
      root.style.setProperty("--primary-foreground", "210 20% 95%");
    } else {
      localStorage.setItem("movie_tracker_theme", "light");
      root.style.setProperty("--background", "0 0% 98%");
      root.style.setProperty("--foreground", "220 15% 15%");
      root.style.setProperty("--card", "0 0% 100%");
      root.style.setProperty("--card-foreground", "220 15% 15%");
      root.style.setProperty("--popover", "0 0% 100%");
      root.style.setProperty("--popover-foreground", "220 15% 15%");
      root.style.setProperty("--secondary", "220 15% 92%");
      root.style.setProperty("--secondary-foreground", "220 15% 30%");
      root.style.setProperty("--muted", "220 15% 95%");
      root.style.setProperty("--muted-foreground", "215 12% 45%");
      root.style.setProperty("--border", "220 15% 85%");
      root.style.setProperty("--input", "220 15% 85%");
      root.style.setProperty("--primary-foreground", "0 0% 100%");
    }
  }, []);

  // Custom color picker handler
  const handleCustomColor = (hex: string) => {
    setCustomColor(hex);
    // Convert hex to HSL
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    const glowL = Math.min(Math.round(l * 100) + 10, 90);
    const glow = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${glowL}%`;
    const root = document.documentElement;
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--accent", hsl);
    root.style.setProperty("--glow", glow);
    root.style.setProperty("--ring", hsl);
    localStorage.setItem("movie_tracker_custom_color", hex);
  };

  // Multi-format export
  const handleExport = (format: "json" | "csv" | "txt") => {
    const data = getCollection();
    let blob: Blob;
    let ext: string;
    if (format === "json") {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      ext = "json";
    } else if (format === "csv") {
      const keys = data.length > 0 ? Object.keys(data[0]) : [];
      const header = keys.join(",");
      const rows = data.map((item) => keys.map((k) => `"${String((item as any)[k] || "").replace(/"/g, '""')}"`).join(","));
      blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
      ext = "csv";
    } else {
      const lines = data.map((item) => {
        const title = item.title;
        const type = item.type;
        const rating = item.userRating || "—";
        const year = item.year;
        return `${title} (${year}) [${type}] - Rating: ${rating}/10`;
      });
      blob = new Blob([lines.join("\n")], { type: "text/plain" });
      ext = "txt";
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movie-tracker-collection-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${data.length} items as ${ext.toUpperCase()}!` });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        let items: Record<string, any>[];
        if (file.name.endsWith(".json")) {
          const data = JSON.parse(text);
          if (!Array.isArray(data)) throw new Error("Invalid format — expected an array");
          items = data;
        } else if (file.name.endsWith(".csv")) {
          const lines = text.split("\n").filter(Boolean);
          if (lines.length < 2) throw new Error("Empty CSV");
          const headers = lines[0].split(",").map((h) => h.trim());
          items = lines.slice(1).map((line) => {
            const vals = line.match(/(".*?"|[^,]+)/g) || [];
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = (vals[i] || "").replace(/^"|"$/g, ""); });
            return obj;
          });
        } else {
          throw new Error("Unsupported format. Use JSON or CSV.");
        }
        // Open smart validation dialog
        setImportItems(items);
        setShowImportDialog(true);
      } catch (err: any) {
        toast({ title: err.message || "Invalid file format", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const totalWatchTime = useMemo(() => {
    return movies.reduce((sum, m) => {
      const mins = parseInt((m as any).runtime) || 0;
      return sum + mins;
    }, 0);
  }, [movies]);

  const avgRating = useMemo(() => {
    const rated = collection.filter((c) => c.userRating && c.userRating !== "—");
    if (rated.length === 0) return "—";
    const sum = rated.reduce((s, c) => s + (parseFloat(c.userRating) || 0), 0);
    return (sum / rated.length).toFixed(1);
  }, [collection]);

  return (
    <div className="px-6 pt-6 pb-8 space-y-6">
      <div className="fade-up">
        <h1 className="text-2xl font-bold font-display">
          <Settings size={24} className="inline mr-2 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your Movie Tracker</p>
      </div>

      
      <section className="glass-panel p-4 fade-up" style={{ animationDelay: "0.03s" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasTmdbKey && hasOmdbKey ? (
              <CheckCircle2 size={20} className="text-green-400" />
            ) : (
              <AlertCircle size={20} className="text-amber-400" />
            )}
            <div>
              <p className="text-sm font-medium">
                {hasTmdbKey && hasOmdbKey ? "APIs Connected" : "API Setup Required"}
              </p>
              <p className="text-xs text-muted-foreground">
                TMDB: {hasTmdbKey ? "✓" : "✗"} · OMDB: {hasOmdbKey ? "✓" : "✗"}
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setShowApiGuide(!showApiGuide)} className="text-xs">
            <HelpCircle size={14} className="mr-1" /> Setup Guide
            <ChevronDown size={14} className={`ml-1 transition-transform ${showApiGuide ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {showApiGuide && (
          <div className="mt-4 space-y-4 border-t border-border/30 pt-4 animate-fade-in">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">1</span>
                Get TMDB API Key
              </h4>
              <div className="ml-8 space-y-1 text-xs text-muted-foreground">
                <p>1. Go to <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">themoviedb.org/signup</a></p>
                <p>2. Create a free account and verify your email</p>
                <p>3. Go to <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Settings → API</a></p>
                <p>4. Request an API key (choose "Developer" option)</p>
                <p>5. Copy the "API Key (v3 auth)" value</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">2</span>
                Get OMDB API Key
              </h4>
              <div className="ml-8 space-y-1 text-xs text-muted-foreground">
                <p>1. Go to <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">omdbapi.com/apikey</a></p>
                <p>2. Choose the free tier (1,000 daily limit)</p>
                <p>3. Enter your email and submit</p>
                <p>4. Check your email for the API key</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">3</span>
                Paste Keys Below
              </h4>
              <p className="ml-8 text-xs text-muted-foreground">Enter your keys in the API Keys section below and click Save.</p>
            </div>
          </div>
        )}
      </section>

      {/* Backend API URL */}
      <section className="glass-panel p-5 space-y-4 fade-up" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-center gap-2">
          <Server size={18} className="text-primary" />
          <h2 className="font-display font-semibold">Backend API</h2>
        </div>
        <Separator className="bg-border/50" />
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">API Base URL</label>
          <Input placeholder="http://localhost:8080/api" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="bg-secondary/50 border-border/50 focus:border-primary/50" />
          <p className="text-[11px] text-muted-foreground mt-1.5">Point this to your Java backend REST API endpoint</p>
        </div>
        <Button size="sm" onClick={saveApiUrl} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Save & Test Connection
        </Button>
      </section>

      {/* API Keys */}
      <section className="glass-panel p-5 space-y-4 fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center gap-2">
          <Key size={18} className="text-primary" />
          <h2 className="font-display font-semibold">API Keys</h2>
        </div>
        <Separator className="bg-border/50" />
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">TMDB API Key</label>
            <Input type="password" placeholder="Enter your TMDB API key" value={tmdbKey} onChange={(e) => setTmdbKey(e.target.value)} className="bg-secondary/50 border-border/50 focus:border-primary/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">OMDB API Key</label>
            <Input type="password" placeholder="Enter your OMDB API key" value={omdbKey} onChange={(e) => setOmdbKey(e.target.value)} className="bg-secondary/50 border-border/50 focus:border-primary/50" />
          </div>
          <Button size="sm" onClick={saveApiKeys} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Save API Keys
          </Button>
        </div>
      </section>

      {/* Statistics */}
      <section className="glass-panel p-5 space-y-4 fade-up" style={{ animationDelay: "0.13s" }}>
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-primary" />
          <h2 className="font-display font-semibold">Statistics</h2>
        </div>
        <Separator className="bg-border/50" />

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Film, value: movies.length, label: "Movies" },
            { icon: Tv, value: series.length, label: "Series" },
            { icon: TrendingUp, value: totalWatchTime > 0 ? `${Math.floor(totalWatchTime / 60)}h` : "—", label: "Watch Time" },
            { icon: Star, value: avgRating, label: "Avg Rating" },
          ].map((s) => (
            <div key={s.label} className="glass-panel-strong p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10"><s.icon size={18} className="text-primary" /></div>
                <div>
                  <p className="text-xl font-bold font-display">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Activity Chart */}
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5 mb-3">
            <TrendingUp size={14} className="text-primary" /> Monthly Activity
          </p>
          <div className="glass-panel-strong p-4">
            {monthlyAdditions.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyAdditions}>
                  <XAxis dataKey="month" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px", color: "hsl(210, 20%, 92%)" }} />
                  <Bar dataKey="movies" fill="hsl(209, 95%, 35%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="series" fill="hsl(260, 70%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                <p>No data yet — start adding movies & series!</p>
              </div>
            )}
          </div>
        </div>

        {/* Genre Breakdown */}
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5 mb-3">
            <Star size={14} className="text-primary" /> Genre Breakdown
          </p>
          <div className="glass-panel-strong p-4">
            {genresBreakdown.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={genresBreakdown} dataKey="count" nameKey="genre" cx="50%" cy="50%" innerRadius={30} outerRadius={50} strokeWidth={0}>
                      {genresBreakdown.map((_, i) => (
                        <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5">
                  {genresBreakdown.slice(0, 6).map((g, i) => (
                    <div key={g.genre} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GENRE_COLORS[i % GENRE_COLORS.length] }} />
                      <span className="text-muted-foreground">{g.genre}</span>
                      <span className="font-medium ml-auto">{g.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground text-sm">
                <p>Genre stats will appear here</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Data Backup */}
      <section className="glass-panel p-5 space-y-4 fade-up" style={{ animationDelay: "0.14s" }}>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          <h2 className="font-display font-semibold">Data Backup</h2>
        </div>
        <Separator className="bg-border/50" />
        <p className="text-xs text-muted-foreground">
          Keep your collection safe. {collection.length} item{collection.length !== 1 ? "s" : ""} in collection.
        </p>

        {/* Full Backup Download */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-border/50 hover:bg-secondary/50"
            onClick={() => handleExport("json")}
          >
            <Download size={14} className="mr-1.5" /> Full Backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-border/50 hover:bg-secondary/50"
            onClick={async () => {
              const data = getCollection();
              try {
                await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                toast({ title: `Copied ${data.length} items to clipboard` });
              } catch {
                toast({ title: "Clipboard access denied", variant: "destructive" });
              }
            }}
          >
            <Copy size={14} className="mr-1.5" /> Copy to Clipboard
          </Button>
        </div>
      </section>

      {/* Data Management */}
      <section className="glass-panel p-5 space-y-4 fade-up" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center gap-2">
          <Download size={18} className="text-primary" />
          <h2 className="font-display font-semibold">Data Management</h2>
        </div>
        <Separator className="bg-border/50" />
        <p className="text-xs text-muted-foreground">
          Export your collection in multiple formats or import from a backup.
        </p>
        <div>
          <p className="text-xs font-medium mb-2">Export As</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("json")} className="flex-1 border-border/50 hover:bg-secondary/50">
              <FileJson size={14} className="mr-1.5" /> JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")} className="flex-1 border-border/50 hover:bg-secondary/50">
              <FileSpreadsheet size={14} className="mr-1.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("txt")} className="flex-1 border-border/50 hover:bg-secondary/50">
              <FileText size={14} className="mr-1.5" /> TXT
            </Button>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium mb-2">Import</p>
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} className="w-full border-border/50 hover:bg-secondary/50 hover:border-primary/30">
            <Upload size={14} className="mr-2" /> Import Data (JSON or CSV)
          </Button>
          <input ref={importRef} type="file" accept=".json,.csv" onChange={handleImport} className="hidden" />
        </div>
      </section>

      {/* Appearance */}
      <section className="glass-panel p-5 space-y-4 fade-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-primary" />
          <h2 className="font-display font-semibold">Appearance</h2>
        </div>
        <Separator className="bg-border/50" />

        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDarkMode ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-amber-400" />}
            <div>
              <p className="text-sm font-medium">{isDarkMode ? "Dark Mode" : "Light Mode"}</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
            </div>
          </div>
          <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
        </div>

        {/* Accent Color Presets */}
        <div>
          <p className="text-sm font-medium mb-2">Accent Color Presets</p>
          <div className="flex gap-2">
            {(Object.keys(ACCENT_PRESETS) as AccentColor[]).map((name) => (
              <button
                key={name}
                onClick={() => setAccent(name)}
                className={`w-8 h-8 rounded-full transition-all ${
                  accent === name ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" : "opacity-60 hover:opacity-100"
                }`}
                style={{ backgroundColor: `hsl(${ACCENT_PRESETS[name].primary})` }}
                title={name.charAt(0).toUpperCase() + name.slice(1)}
              />
            ))}
          </div>
        </div>

        {/* Custom Color Picker */}
        <div>
          <p className="text-sm font-medium mb-2">Custom Color</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={customColor}
              onChange={(e) => handleCustomColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
            />
            <div>
              <p className="text-xs font-mono text-muted-foreground">{customColor}</p>
              <p className="text-[11px] text-muted-foreground">Pick any color for the accent</p>
            </div>
          </div>
        </div>
      </section>

      {/* Credits */}
      <section className="glass-panel p-5 space-y-4 fade-up" style={{ animationDelay: "0.25s" }}>
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-primary" />
          <h2 className="font-display font-semibold">Credits</h2>
        </div>
        <Separator className="bg-border/50" />
        <div className="text-center space-y-3 py-2">
          <p className="text-sm">Developed by <span className="font-semibold text-primary">Yetemgeta Bekele</span> with <Heart size={12} className="inline text-red-400 fill-red-400" /></p>
          <a
            href="https://github.com/yetemgetaB/Movie-Tracker-Frontend"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors text-sm"
          >
            <Github size={16} /> View on GitHub <ExternalLink size={12} />
          </a>
        </div>
      </section>

      {/* About */}
      <section className="glass-panel p-5 fade-up" style={{ animationDelay: "0.28s" }}>
        <div className="text-center space-y-1">
          <p className="font-display font-semibold glow-text">Movie Tracker</p>
          <p className="text-xs text-muted-foreground">v1.0.0 · Built with ❤️</p>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
