import { useState, useEffect, useCallback } from "react";
import {
  Settings, Key, Palette, Monitor, Database, Accessibility, Keyboard,
  Eye, EyeOff, CheckCircle, XCircle, Trash2, Download, Upload, RotateCcw,
  Star, RefreshCw, Loader2, ChevronDown,
  Info, ExternalLink, Heart, Image as ImageIcon, Zap, Tag, GitBranch, DownloadCloud
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { applyStoredTheme } from "@/components/AppLayout";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useToast } from "@/hooks/use-toast";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const APP_VERSION = "1.2.1";
const GITHUB_REPO = "yetemgetaB/Movie-Tracker";
const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;

const ACCENT_OPTIONS = [
  { name: "blue", label: "Blue", preview: "209 95% 48%" },
  { name: "purple", label: "Purple", preview: "260 70% 50%" },
  { name: "rose", label: "Rose", preview: "340 70% 50%" },
  { name: "amber", label: "Amber", preview: "45 90% 50%" },
  { name: "emerald", label: "Emerald", preview: "160 70% 40%" },
  { name: "red", label: "Red", preview: "0 90% 50%" },
];

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "apis", label: "API Keys", icon: Key },
  { id: "display", label: "Display", icon: Monitor },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "data", label: "Data", icon: Database },
  { id: "about", label: "About", icon: Info },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
];

// ── Toggle component ──────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
    aria-pressed={checked}
  >
    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);

// ── Modern Zoom Slider ────────────────────────────────────────────────────────
const ZoomSlider = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const min = 70; const max = 130; const step = 5;
  const pct = ((value - min) / (max - min)) * 100;
  const ticks = [70, 80, 90, 100, 110, 120, 130];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Smaller</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-primary tabular-nums">{value}<span className="text-sm font-normal text-muted-foreground">%</span></span>
        </div>
        <span className="text-xs text-muted-foreground">Larger</span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute w-full opacity-0 cursor-pointer h-6"
        />
        {/* Custom thumb */}
        <div
          className="absolute w-6 h-6 rounded-full bg-primary border-2 border-background shadow-lg shadow-primary/30 transition-all pointer-events-none flex items-center justify-center"
          style={{ left: `calc(${pct}% - 12px)` }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
        </div>
      </div>
      {/* Tick marks */}
      <div className="relative flex justify-between px-0">
        {ticks.map(t => (
          <div key={t} className="flex flex-col items-center gap-0.5">
            <div className={`w-0.5 h-1.5 rounded-full transition-colors ${value === t ? "bg-primary" : "bg-muted-foreground/30"}`} />
            <span className={`text-[9px] tabular-nums transition-colors ${value === t ? "text-primary font-bold" : "text-muted-foreground/50"}`}>{t}</span>
          </div>
        ))}
      </div>
      <button onClick={() => onChange(100)} className="text-xs text-primary hover:underline flex items-center gap-1">
        <RotateCcw className="w-3 h-3" /> Reset to 100%
      </button>
    </div>
  );
};

// ── API Key Field with live validation ────────────────────────────────────────
const ApiKeyField = ({
  label, storageKey, value, setValue, show, setShow, description, features,
  onValidate
}: {
  label: string; storageKey: string; value: string; setValue: (v: string) => void;
  show: boolean; setShow: (v: boolean) => void; description: string; features: string[];
  onValidate: (key: string) => Promise<boolean>;
}) => {
  const { toast } = useToast();
  const [validating, setValidating] = useState(false);
  const [status, setStatus] = useState<"idle" | "valid" | "invalid">(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? "valid" : "idle";
  });
  const [lastValidated, setLastValidated] = useState<string | null>(() =>
    localStorage.getItem(`${storageKey}_validated_at`)
  );

  const testAndSave = async () => {
    if (!value.trim()) {
      toast({ title: "Please enter a key first", variant: "destructive" });
      return;
    }
    setValidating(true);
    try {
      const valid = await onValidate(value.trim());
      if (valid) {
        setStatus("valid");
        localStorage.setItem(storageKey, value.trim());
        const now = new Date().toLocaleString();
        localStorage.setItem(`${storageKey}_validated_at`, now);
        setLastValidated(now);
        toast({ title: `${label} key validated ✓`, description: "Connected successfully!" });
      } else {
        setStatus("invalid");
        toast({ title: `${label} key is invalid`, variant: "destructive" });
      }
    } catch {
      setStatus("invalid");
      toast({ title: "Validation failed", description: "Check your internet connection", variant: "destructive" });
    }
    setValidating(false);
  };

  const removeKey = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_validated_at`);
    setValue(""); setStatus("idle"); setLastValidated(null);
    toast({ title: `${label} key removed` });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
        </div>
        {status === "valid" ? (
          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-4 h-4" /> Connected</span>
            {lastValidated && <span className="text-[10px] text-muted-foreground">Verified {lastValidated}</span>}
          </div>
        ) : status === "invalid" ? (
          <span className="flex items-center gap-1 text-xs text-destructive"><XCircle className="w-4 h-4" /> Invalid</span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="w-4 h-4" /> Not set</span>
        )}
      </div>

      {/* Features list */}
      <div className="flex flex-wrap gap-1.5">
        {features.map(f => (
          <span key={f} className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground">{f}</span>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={e => { setValue(e.target.value); setStatus("idle"); }}
            placeholder={`Enter your ${label} key...`}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={testAndSave}
          disabled={validating}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
        >
          {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          {validating ? "Testing..." : "Test & Save"}
        </button>
        {status === "valid" && (
          <button onClick={removeKey} className="px-3 py-2 rounded-lg bg-destructive/20 text-destructive text-sm hover:bg-destructive/30 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ── GitHub Release card ───────────────────────────────────────────────────────
interface GithubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  prerelease: boolean;
}

// Parse GitHub markdown body into structured sections
function parseChangelog(body: string) {
  if (!body?.trim()) return [{ type: "bullet" as const, text: "No changelog provided." }];
  const lines = body.split("\n");
  const result: Array<{ type: "heading" | "bullet" | "text"; text: string; level?: number }> = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const h3 = line.match(/^###\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const bullet = line.match(/^[-*+]\s+(.*)/);
    const numbered = line.match(/^\d+\.\s+(.*)/);
    if (h2) result.push({ type: "heading", text: h2[1], level: 2 });
    else if (h3) result.push({ type: "heading", text: h3[1], level: 3 });
    else if (bullet) result.push({ type: "bullet", text: bullet[1].replace(/\*\*(.*?)\*\*/g, "$1") });
    else if (numbered) result.push({ type: "bullet", text: numbered[1].replace(/\*\*(.*?)\*\*/g, "$1") });
    else result.push({ type: "text", text: line.replace(/\*\*(.*?)\*\*/g, "$1") });
  }
  return result;
}

const SECTION_ICONS: Record<string, string> = {
  "features": "✨", "feature": "✨", "new": "🆕", "fix": "🐛", "fixes": "🐛",
  "breaking": "⚠️", "improvements": "🔧", "improvement": "🔧", "changes": "📝",
  "performance": "⚡", "security": "🔒", "deprecat": "⛔",
};

function getSectionIcon(heading: string) {
  const lower = heading.toLowerCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "📌";
}

const ChangelogCard = ({ release, isLatest }: { release: GithubRelease; isLatest: boolean }) => {
  const [open, setOpen] = useState(isLatest); // auto-open latest
  const date = new Date(release.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const parsed = parseChangelog(release.body);
  const releaseName = release.name && release.name !== release.tag_name ? release.name : null;

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${isLatest ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/20"}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isLatest ? "bg-primary/20" : "bg-secondary"}`}>
            <GitBranch size={15} className={isLatest ? "text-primary" : "text-muted-foreground"} />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground flex items-center gap-2 flex-wrap">
              <span className={isLatest ? "text-primary" : ""}>{release.tag_name}</span>
              {releaseName && <span className="text-muted-foreground font-normal">— {releaseName}</span>}
              {isLatest && <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full font-semibold">LATEST</span>}
              {release.prerelease && <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] rounded-full">Pre-release</span>}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{date}</div>
          </div>
        </div>
        <div className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <ChevronDown size={14} className="text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-border/30">
          <div className="pt-3 space-y-1.5">
            {parsed.map((entry, i) => {
              if (entry.type === "heading") return (
                <div key={i} className="flex items-center gap-1.5 pt-2 pb-0.5">
                  <span>{getSectionIcon(entry.text)}</span>
                  <span className={`font-semibold text-foreground ${entry.level === 2 ? "text-sm" : "text-xs uppercase tracking-wide text-muted-foreground"}`}>
                    {entry.text}
                  </span>
                </div>
              );
              if (entry.type === "bullet") return (
                <div key={i} className="flex gap-2 text-xs text-muted-foreground pl-1">
                  <span className="text-primary mt-0.5 flex-shrink-0">▸</span>
                  <span className="leading-relaxed">{entry.text}</span>
                </div>
              );
              return (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed pl-1">{entry.text}</p>
              );
            })}
          </div>
          <a href={release.html_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1 pt-2">
            <ExternalLink size={10} /> View full release on GitHub
          </a>
        </div>
      )}
    </div>
  );
};

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { toast } = useToast();
  const { accent, setAccent } = useAccentColor();
  const [activeSection, setActiveSection] = useState("appearance");

  // Appearance
  const [theme, setTheme] = useState(() => localStorage.getItem("movie_tracker_theme") || "dark");
  const [zoom, setZoom] = useState(() => parseInt(localStorage.getItem("movie_tracker_zoom") || "100"));

  // APIs
  const [tmdbKey, setTmdbKey] = useState(() => localStorage.getItem("movie_tracker_tmdb_api_key") || localStorage.getItem("tmdb_api_key") || "");
  const [omdbKey, setOmdbKey] = useState(() => localStorage.getItem("movie_tracker_omdb_api_key") || localStorage.getItem("omdb_api_key") || "");
  const [tvdbKey, setTvdbKey] = useState(() => localStorage.getItem("movie_tracker_tvdb_api_key") || localStorage.getItem("tvdb_api_key") || "");
  const [showTmdb, setShowTmdb] = useState(false);
  const [showOmdb, setShowOmdb] = useState(false);
  const [showTvdb, setShowTvdb] = useState(false);

  // Accessibility
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("high_contrast") === "true");
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem("reduce_motion") === "true");
  const [largeText, setLargeText] = useState(() => localStorage.getItem("large_text") === "true");

  // Display
  const [imageQuality, setImageQuality] = useState(() => localStorage.getItem("image_quality") || "high");
  const [showAdult, setShowAdult] = useState(() => localStorage.getItem("show_adult") === "true");
  const [defaultPage, setDefaultPage] = useState(() => localStorage.getItem("default_page") || "/");

  // About / GitHub
  const [githubStars, setGithubStars] = useState<number | null>(null);
  const [releases, setReleases] = useState<GithubRelease[]>([]);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<{ tag: string; url: string; body: string } | null>(null);

  // Data stats
  const [storageUsed, setStorageUsed] = useState("—");

  useEffect(() => {
    document.documentElement.style.fontSize = `${zoom}%`;
    localStorage.setItem("movie_tracker_zoom", String(zoom));
  }, [zoom]);

  // Compute storage size
  useEffect(() => {
    if (activeSection === "data") {
      let total = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          total += (localStorage.getItem(key) || "").length + key.length;
        }
      }
      setStorageUsed(`${(total / 1024).toFixed(1)} KB`);
    }
  }, [activeSection]);

  const fetchGithubInfo = useCallback(async () => {
    try {
      const [repoRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${GITHUB_REPO}`),
      ]);
      const repo = await repoRes.json();
      setGithubStars(repo.stargazers_count);
    } catch { /* silent */ }
  }, []);

  const fetchReleases = useCallback(async () => {
    setLoadingReleases(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`);
      const data = await res.json();
      setReleases(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch { /* silent */ }
    setLoadingReleases(false);
  }, []);

  useEffect(() => {
    if (activeSection === "about") {
      fetchGithubInfo();
      fetchReleases();
    }
  }, [activeSection, fetchGithubInfo, fetchReleases]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        // Focus search (would need search implementation)
        return;
      }

      // Navigation shortcuts
      if (e.altKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            window.location.href = '/';
            break;
          case 'm':
            e.preventDefault();
            window.location.href = '/movies';
            break;
          case 's':
            e.preventDefault();
            window.location.href = '/series';
            break;
        }
      }

      // Other shortcuts
      switch (e.key) {
        case 'Escape':
          // Close dialogs or go back
          const closeButton = document.querySelector('[data-testid="close-button"]') as HTMLButtonElement;
          if (closeButton) closeButton.click();
          break;
        case 'f':
        case 'F11':
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const checkForUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateStatus(null);
    setUpdateAvailable(null);
    
    try {
      // Check if running in Tauri environment
      if (window.__TAURI__) {
        // Use Tauri updater
        const { update, shouldUpdate } = await check();
        if (shouldUpdate) {
          setUpdateStatus(`🆕 Update available: ${update.version}`);
          setUpdateAvailable({ 
            tag: `v${update.version}`, 
            url: update.body?.signature || "", 
            body: update.body?.notes || "",
            tauriUpdate: update
          });
        } else {
          setUpdateStatus(`✓ You're on the latest version (v${APP_VERSION})`);
        }
      } else {
        // Web version - check GitHub releases
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        const data = await res.json();
        if (data.tag_name) {
          const latest = data.tag_name.replace(/^v/, "");
          if (latest === APP_VERSION) {
            setUpdateStatus(`✓ You're on the latest version (v${APP_VERSION})`);
          } else {
            setUpdateStatus(`🆕 Update available: ${data.tag_name}`);
            setUpdateAvailable({ tag: data.tag_name, url: data.html_url, body: data.body || "" });
          }
        } else {
          setUpdateStatus("No releases found on GitHub.");
        }
      }
    } catch (error) {
      console.error('Update check failed:', error);
      setUpdateStatus("Could not check for updates — check your connection.");
    }
    setCheckingUpdate(false);
  };

  const installUpdate = async () => {
    if (!updateAvailable?.tauriUpdate) return;
    
    try {
      setUpdateStatus("📦 Installing update...");
      // Import install dynamically
      const { install } = await import("@tauri-apps/plugin-updater");
      await install(updateAvailable.tauriUpdate);
      setUpdateStatus("✅ Update installed! Restarting...");
      await relaunch();
    } catch (error) {
      console.error('Update installation failed:', error);
      setUpdateStatus("❌ Failed to install update.");
      toast({ 
        title: "Update Failed", 
        description: "Could not install the update. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  function saveTheme(t: string) {
    setTheme(t);
    localStorage.setItem("movie_tracker_theme", t);
    applyStoredTheme();
    toast({ title: `${t === "light" ? "Light" : "Dark"} mode applied` });
  }

  // API validators
  const validateTmdb = async (key: string) => {
    const res = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${key}`);
    return res.ok;
  };
  const validateOmdb = async (key: string) => {
    const res = await fetch(`https://www.omdbapi.com/?apikey=${key}&t=test`);
    const data = await res.json();
    return data.Response !== "False" || data.Error !== "Invalid API key!";
  };
  const validateTvdb = async (key: string) => {
    // TVDB v4 token endpoint
    const res = await fetch("https://api4.thetvdb.com/v4/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: key }),
    });
    return res.ok;
  };

  function exportData() {
    const data: Record<string, string> = {};
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        data[key] = localStorage.getItem(key) || "";
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "movie-tracker-backup.json"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data exported!" });
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v as string));
        toast({ title: "Data imported!", description: "Reload the page to apply changes." });
      } catch { toast({ title: "Import failed", variant: "destructive" }); }
    };
    reader.readAsText(file);
  }

  function clearData(key: string, label: string) {
    localStorage.removeItem(key);
    toast({ title: `${label} cleared` });
  }

  function resetApp() {
    if (!confirm("Reset ALL app data? This cannot be undone.")) return;
    localStorage.clear();
    toast({ title: "App reset — reload to start fresh" });
  }

  const getDataStats = () => {
    const getCount = (key: string) => {
      try { return JSON.parse(localStorage.getItem(key) || "[]").length; } catch { return 0; }
    };
    return [
      { label: "Vault items", count: getCount("movie_tracker_collection"), key: "movie_tracker_collection" },
      { label: "Watchlist items", count: getCount("movie_tracker_watchlist"), key: "movie_tracker_watchlist" },
      { label: "Watch progress", count: getCount("movie_tracker_watch_progress"), key: "movie_tracker_watch_progress" },
      { label: "Search history (movies)", count: getCount("movie_tracker_search_history_movies"), key: "movie_tracker_search_history_movies" },
      { label: "Search history (series)", count: getCount("movie_tracker_search_history_series"), key: "movie_tracker_search_history_series" },
    ];
  };

  const renderSection = () => {
    switch (activeSection) {
      case "appearance":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Appearance</h2>

            {/* Theme */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="font-semibold text-foreground">Theme</div>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "dark", label: "Dark Mode", preview: "bg-gray-900" },
                  { id: "light", label: "Light Mode", preview: "bg-gray-100 border border-gray-300" },
                ] as const).map(({ id, label, preview }) => (
                  <button key={id} onClick={() => saveTheme(id)}
                    className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${theme === id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                    <div className={`w-8 h-8 rounded-full ${preview} flex-shrink-0`} />
                    <span className="font-medium text-foreground text-sm">{label}</span>
                    {theme === id && <CheckCircle className="w-4 h-4 text-primary ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="font-semibold text-foreground">Accent Color</div>
              <div className="grid grid-cols-6 gap-3">
                {ACCENT_OPTIONS.map(c => (
                  <button key={c.name} onClick={() => setAccent(c.name as any)} title={c.label}
                    className={`group flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${accent === c.name ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-secondary/50"}`}>
                    <div className={`w-9 h-9 rounded-full transition-transform group-hover:scale-110`}
                      style={{ background: `hsl(${c.preview})`, boxShadow: accent === c.name ? `0 0 12px hsl(${c.preview}/0.6)` : undefined }} />
                    <span className="text-[9px] text-muted-foreground">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div>
                <div className="font-semibold text-foreground">UI Scale / Zoom</div>
                <div className="text-xs text-muted-foreground">Adjust the overall size of the interface</div>
              </div>
              <ZoomSlider value={zoom} onChange={setZoom} />
            </div>

            {/* Default Landing Page */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="font-semibold text-foreground">Default Landing Page</div>
              <select value={defaultPage} onChange={e => { setDefaultPage(e.target.value); localStorage.setItem("default_page", e.target.value); }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="/">Home</option>
                <option value="/movies">Movies</option>
                <option value="/series">Series</option>
                <option value="/vault">Vault</option>
                <option value="/watchlist">Watchlist</option>
                <option value="/analytics">Analytics</option>
              </select>
            </div>
          </div>
        );

      case "apis":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">API Keys</h2>

            {/* Features bar */}
            <div className="rounded-xl bg-secondary/30 border border-border p-3 flex flex-wrap gap-2 text-xs">
              <span className="font-medium text-muted-foreground">Features available:</span>
              {[
                { label: "🎬 Movies & Series", needs: "TMDB", has: !!localStorage.getItem("tmdb_api_key") },
                { label: "⭐ IMDb Ratings", needs: "OMDB", has: !!localStorage.getItem("omdb_api_key") },
                { label: "📺 Episode Details", needs: "TVDB", has: !!localStorage.getItem("tvdb_api_key") },
              ].map(f => (
                <span key={f.label} className={`px-2 py-1 rounded-full ${f.has ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground line-through"}`}>
                  {f.label}
                </span>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">Click "Test & Save" to validate your key before it's stored. The app works with any combination of keys.</p>

            <ApiKeyField
              label="TMDB" storageKey="tmdb_api_key"
              value={tmdbKey} setValue={setTmdbKey}
              show={showTmdb} setShow={setShowTmdb}
              description="Required for all movie & series data, trailers, cast, recommendations"
              features={["Trending", "Search", "Trailers", "Cast", "Recommendations", "Genres"]}
              onValidate={validateTmdb}
            />
            <ApiKeyField
              label="OMDB" storageKey="omdb_api_key"
              value={omdbKey} setValue={setOmdbKey}
              show={showOmdb} setShow={setShowOmdb}
              description="Enables IMDb & Rotten Tomatoes ratings, episode ratings, content rating"
              features={["IMDb Ratings", "RT Scores", "Episode Ratings", "Rated (PG/R/etc)"]}
              onValidate={validateOmdb}
            />
            <ApiKeyField
              label="TVDB" storageKey="tvdb_api_key"
              value={tvdbKey} setValue={setTvdbKey}
              show={showTvdb} setShow={setShowTvdb}
              description="Enhanced series data, episode artwork, and additional cast info"
              features={["Episode Artwork", "Extended Cast", "Network Info"]}
              onValidate={validateTvdb}
            />

            <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">How to get API keys:</p>
              <p>🎬 <strong>TMDB:</strong> <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">themoviedb.org/settings/api</a> — free account required</p>
              <p>⭐ <strong>OMDB:</strong> <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">omdbapi.com/apikey.aspx</a> — 1000 req/day free</p>
              <p>📺 <strong>TVDB:</strong> <a href="https://thetvdb.com/api-information" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">thetvdb.com/api-information</a> — free registration</p>
            </div>
          </div>
        );

      case "display":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Display Settings</h2>

            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="font-semibold text-foreground">Image Quality</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "low", label: "Low", desc: "Saves data" },
                  { id: "medium", label: "Medium", desc: "Balanced" },
                  { id: "high", label: "High", desc: "Best quality" },
                  { id: "auto", label: "Auto", desc: "Based on connection" },
                ].map(q => (
                  <button key={q.id} onClick={() => { setImageQuality(q.id); localStorage.setItem("image_quality", q.id); toast({ title: `Image quality: ${q.label}` }); }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${imageQuality === q.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <ImageIcon size={13} className={imageQuality === q.id ? "text-primary" : "text-muted-foreground"} />
                      <span className="font-medium text-sm text-foreground">{q.label}</span>
                      {imageQuality === q.id && <CheckCircle size={12} className="text-primary ml-auto" />}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{q.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-foreground">Show Adult Content</div>
                  <div className="text-xs text-muted-foreground">Include R-rated and adult titles in results</div>
                </div>
                <Toggle checked={showAdult} onChange={v => { setShowAdult(v); localStorage.setItem("show_adult", String(v)); }} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="font-semibold text-foreground">Card Density</div>
              {["compact", "normal", "large"].map(d => {
                const current = localStorage.getItem("card_density") || "normal";
                return (
                  <button key={d} onClick={() => { localStorage.setItem("card_density", d); toast({ title: `Density: ${d}` }); }}
                    className={`w-full p-3 rounded-lg border-2 flex items-center justify-between transition-all ${current === d ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {Array.from({ length: d === "compact" ? 5 : d === "normal" ? 3 : 2 }).map((_, i) => (
                          <div key={i} className={`rounded bg-primary/40 ${d === "compact" ? "w-3 h-4" : d === "normal" ? "w-4 h-6" : "w-5 h-8"}`} />
                        ))}
                      </div>
                      <span className="capitalize text-foreground text-sm">{d}</span>
                    </div>
                    {current === d && <CheckCircle className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "accessibility":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Accessibility</h2>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {[
                {
                  label: "High Contrast", desc: "Increases border and text contrast",
                  checked: highContrast,
                  onChange: (v: boolean) => {
                    setHighContrast(v); localStorage.setItem("high_contrast", String(v));
                    document.documentElement.classList.toggle("high-contrast", v);
                    if (v) {
                      document.documentElement.style.setProperty("--border", "220 15% 35%");
                    } else {
                      applyStoredTheme();
                    }
                  }
                },
                {
                  label: "Large Text", desc: "Increases base font size (sets zoom to 115%)",
                  checked: largeText,
                  onChange: (v: boolean) => {
                    setLargeText(v); localStorage.setItem("large_text", String(v));
                    setZoom(v ? 115 : 100);
                  }
                },
                {
                  label: "Reduce Motion", desc: "Minimizes animations and transitions",
                  checked: reduceMotion,
                  onChange: (v: boolean) => {
                    setReduceMotion(v); localStorage.setItem("reduce_motion", String(v));
                    document.documentElement.classList.toggle("reduce-motion", v);
                    if (v) {
                      document.documentElement.style.setProperty("--animation-duration", "0ms");
                    } else {
                      document.documentElement.style.removeProperty("--animation-duration");
                    }
                  }
                },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                  <Toggle checked={item.checked} onChange={item.onChange} />
                </div>
              ))}
            </div>
          </div>
        );

      case "data":
        const stats = getDataStats();
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Data Management</h2>

            {/* Storage summary */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-foreground">Storage Used</div>
                <span className="text-primary font-bold">{storageUsed}</span>
              </div>
              <div className="space-y-2">
                {stats.map(s => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-sm text-foreground">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{s.count}</Badge>
                      {s.count > 0 && (
                        <button onClick={() => clearData(s.key, s.label)} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button onClick={exportData} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-left">
                <Download className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium text-foreground">Export All Data</div>
                  <div className="text-xs text-muted-foreground">Download your complete data as JSON backup</div>
                </div>
              </button>
              <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition-colors cursor-pointer">
                <Upload className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium text-foreground">Import Data</div>
                  <div className="text-xs text-muted-foreground">Restore from a previous backup file</div>
                </div>
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              <button onClick={resetApp} className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 transition-colors text-left">
                <RotateCcw className="w-5 h-5 text-destructive" />
                <div>
                  <div className="font-medium text-destructive">Reset App</div>
                  <div className="text-xs text-muted-foreground">Wipe all data and return to defaults</div>
                </div>
              </button>
            </div>
          </div>
        );

      case "about":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">About</h2>

            {/* App card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">🎬</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Movie Tracker</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">v{APP_VERSION}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Built with React + Vite</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A beautiful Netflix-style movie and series tracker. Discover, track, and organize your watching journey.
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Made with <Heart size={14} className="text-red-400 fill-red-400 mx-1" /> by{" "}
                <a href={`https://github.com/yetemgetaB`} target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium">Yetemgeta Bekele</a>
              </div>
            </div>

            {/* GitHub */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                  <div>
                    <div className="font-semibold text-foreground text-sm">GitHub Repository</div>
                    <div className="text-xs text-muted-foreground">{GITHUB_REPO}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {githubStars !== null && (
                    <div className="flex items-center gap-1 text-xs text-yellow-400">
                      <Star size={12} fill="currentColor" /> {githubStars}
                    </div>
                  )}
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground hover:bg-secondary/80 flex items-center gap-1.5">
                    <ExternalLink size={11} /> View
                  </a>
                </div>
              </div>
            </div>

            {/* Check for updates */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">Check for Updates</div>
                  <div className="text-xs text-muted-foreground">Current version: v{APP_VERSION}</div>
                </div>
                <button
                  onClick={checkForUpdate}
                  disabled={checkingUpdate}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                >
                  {checkingUpdate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {checkingUpdate ? "Checking..." : "Check"}
                </button>
              </div>
              {updateStatus && (
                <div className={`p-3 rounded-lg text-sm ${updateStatus.startsWith("✓") ? "bg-green-500/10 text-green-400" : updateStatus.startsWith("🆕") ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  {updateStatus}
                </div>
              )}
            </div>

            {/* Changelog */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-foreground">Changelog</div>
                {loadingReleases && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
              </div>
              {releases.length === 0 && !loadingReleases ? (
                <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  No releases found. <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Check GitHub</a>
                </div>
              ) : (
                <div className="space-y-2">
                  {releases.map((r, i) => <ChangelogCard key={r.tag_name} release={r} isLatest={i === 0} />)}
                </div>
              )}
            </div>
          </div>
        );

      case "shortcuts":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Keyboard Shortcuts</h2>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {[
                ["Search", "Ctrl + K"],
                ["Go to Home", "G then H"],
                ["Go to Movies", "G then M"],
                ["Go to Series", "G then S"],
                ["Close / Back", "Escape"],
                ["Toggle Fullscreen", "F"],
              ].map(([action, shortcut]) => (
                <div key={action} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-foreground">{action}</span>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border font-mono text-muted-foreground">{shortcut}</kbd>
                </div>
              ))}
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        </div>

        <div className="flex gap-6">
          <aside className="w-52 shrink-0">
            <nav className="space-y-1">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {renderSection()}
          </main>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            Made with <Heart size={11} className="text-red-400 fill-red-400" /> by{" "}
            <a href="https://github.com/yetemgetaB" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Yetemgeta Bekele</a>
            <span className="mx-1">•</span> v{APP_VERSION}
          </p>
        </div>
      </div>

      {/* Update Available Popup */}
      {updateAvailable && (
        <Dialog open onOpenChange={() => setUpdateAvailable(null)}>
          <DialogContent className="max-w-md border-primary/30 bg-background">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Zap className="w-5 h-5" /> New Version Available!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                <div className="text-sm">
                  <span className="text-muted-foreground">Current: </span>
                  <span className="font-mono font-bold">v{APP_VERSION}</span>
                </div>
                <div className="text-primary font-bold text-sm">→</div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Latest: </span>
                  <span className="font-mono font-bold text-primary">{updateAvailable.tag}</span>
                </div>
              </div>
              {updateAvailable.body && (
                <div className="rounded-xl border border-border bg-secondary/20 p-3 max-h-48 overflow-y-auto space-y-1.5">
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Tag size={11} className="text-primary" /> What's new
                  </p>
                  {parseChangelog(updateAvailable.body).slice(0, 10).map((entry, i) => {
                    if (entry.type === "heading") return (
                      <p key={i} className="text-xs font-semibold text-foreground pt-1">{getSectionIcon(entry.text)} {entry.text}</p>
                    );
                    return (
                      <div key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                        <span className="text-primary flex-shrink-0">▸</span>
                        <span>{entry.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2">
                {updateAvailable.tauriUpdate ? (
                  <>
                    <button 
                      onClick={installUpdate}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <DownloadCloud size={14} /> Install & Restart
                    </button>
                    <button onClick={() => setUpdateAvailable(null)}
                      className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
                      Later
                    </button>
                  </>
                ) : (
                  <>
                    <a href={updateAvailable.url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                      <ExternalLink size={14} /> View Release on GitHub
                    </a>
                    <button onClick={() => setUpdateAvailable(null)}
                      className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
                      Later
                    </button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
