import { useState, useEffect, useCallback, useRef } from "react";
import {
  Settings, Key, Palette, Monitor, Database, Accessibility, Keyboard,
  Eye, EyeOff, CheckCircle, XCircle, Trash2, Download, Upload, RotateCcw,
  Star, RefreshCw, Loader2, ChevronDown,
  Info, ExternalLink, Heart, Image as ImageIcon, Zap, Tag, GitBranch, DownloadCloud,
  Navigation, GripVertical, ArrowUp, ArrowDown, User, Coffee, Mail, Globe
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { applyStoredTheme } from "@/components/AppLayout";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useToast } from "@/hooks/use-toast";
import { useNavSettings, type NavPosition } from "@/hooks/use-nav-settings";
import { useNavigate } from "react-router-dom";
import { openExternal } from "@/lib/openExternal";
import appIcon from "@/assets/app-icon.png";

const APP_VERSION = "1.3.1";
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

const NAV_LABEL_MAP: Record<string, string> = {
  "/": "Home", "/movies": "Movies", "/series": "Series", "/browse": "Browse",
  "/library": "Vault", "/watchlist": "Watchlist", "/calendar": "Calendar",
  "/analytics": "Analytics", "/settings": "Settings",
};

const GLOW_PRESETS = [
  { label: "Accent", value: "accent" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Emerald", value: "#10b981" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "White", value: "#ffffff" },
];

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "navigation", label: "Navigation", icon: Navigation },
  { id: "apis", label: "API Keys", icon: Key },
  { id: "display", label: "Display", icon: Monitor },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "data", label: "Data", icon: Database },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
  { id: "about", label: "About", icon: Info },
  { id: "developer", label: "Developer", icon: User },
];

// Social links for the developer
const DEVELOPER_LINKS = [
  { label: "GitHub", icon: "github", url: "https://github.com/yetemgetaB", color: "#ffffff" },
  { label: "LinkedIn", icon: "linkedin", url: "https://linkedin.com/in/yetemgeta-bekele", color: "#0a66c2" },
  { label: "Instagram", icon: "instagram", url: "https://instagram.com/yetemgetab", color: "#e4405f" },
  { label: "Telegram", icon: "telegram", url: "https://t.me/yetemgetab", color: "#26a5e4" },
  { label: "Twitter / X", icon: "twitter", url: "https://x.com/yetemgetab", color: "#ffffff" },
  { label: "Buy Me a Coffee", icon: "coffee", url: "https://buymeacoffee.com/yetemgetab", color: "#ffdd00" },
  { label: "Email", icon: "email", url: "mailto:yetemgeta@example.com", color: "#ea4335" },
  { label: "Website", icon: "globe", url: "https://yetemgeta.dev", color: "#06b6d4" },
];

// Default shortcut definitions
interface ShortcutDef {
  id: string;
  action: string;
  defaultKeys: string;
  keys: string;
  route?: string;
}

const DEFAULT_SHORTCUTS: ShortcutDef[] = [
  { id: "search", action: "Search", defaultKeys: "Ctrl+K", keys: "Ctrl+K" },
  { id: "home", action: "Go to Home", defaultKeys: "G then H", keys: "G then H", route: "/" },
  { id: "movies", action: "Go to Movies", defaultKeys: "G then M", keys: "G then M", route: "/movies" },
  { id: "series", action: "Go to Series", defaultKeys: "G then S", keys: "G then S", route: "/series" },
  { id: "browse", action: "Go to Browse", defaultKeys: "G then B", keys: "G then B", route: "/browse" },
  { id: "vault", action: "Go to Vault", defaultKeys: "G then V", keys: "G then V", route: "/library" },
  { id: "watchlist", action: "Go to Watchlist", defaultKeys: "G then W", keys: "G then W", route: "/watchlist" },
  { id: "analytics", action: "Go to Analytics", defaultKeys: "G then A", keys: "G then A", route: "/analytics" },
  { id: "settings", action: "Go to Settings", defaultKeys: "G then T", keys: "G then T", route: "/settings" },
  { id: "calendar", action: "Go to Calendar", defaultKeys: "G then C", keys: "G then C", route: "/calendar" },
  { id: "escape", action: "Close / Back", defaultKeys: "Escape", keys: "Escape" },
  { id: "fullscreen", action: "Toggle Fullscreen", defaultKeys: "F11", keys: "F11" },
];

function loadShortcuts(): ShortcutDef[] {
  try {
    const raw = localStorage.getItem("movie_tracker_shortcuts");
    if (raw) {
      const saved = JSON.parse(raw) as ShortcutDef[];
      // Merge with defaults to pick up new shortcuts
      return DEFAULT_SHORTCUTS.map(d => {
        const s = saved.find(x => x.id === d.id);
        return s ? { ...d, keys: s.keys } : d;
      });
    }
  } catch { /* ignore */ }
  return DEFAULT_SHORTCUTS.map(d => ({ ...d }));
}

function saveShortcuts(shortcuts: ShortcutDef[]) {
  localStorage.setItem("movie_tracker_shortcuts", JSON.stringify(shortcuts));
}

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
        <div
          className="absolute w-6 h-6 rounded-full bg-primary border-2 border-background shadow-lg shadow-primary/30 transition-all pointer-events-none flex items-center justify-center"
          style={{ left: `calc(${pct}% - 12px)` }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
        </div>
      </div>
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
  const [open, setOpen] = useState(isLatest);
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
          <button
            onClick={() => openExternal(release.html_url)}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1 pt-2"
          >
            <ExternalLink size={10} /> View full release on GitHub
          </button>
        </div>
      )}
    </div>
  );
};

// Social link icon component
const SocialIcon = ({ type, size = 18 }: { type: string; size?: number }) => {
  switch (type) {
    case "github":
      return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>;
    case "linkedin":
      return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
    case "instagram":
      return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913a5.885 5.885 0 001.384 2.126A5.868 5.868 0 004.14 23.37c.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558a5.898 5.898 0 002.126-1.384 5.86 5.86 0 001.384-2.126c.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913a5.89 5.89 0 00-1.384-2.126A5.847 5.847 0 0019.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227a3.81 3.81 0 01-.899 1.382 3.744 3.744 0 01-1.38.896c-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421a3.716 3.716 0 01-1.379-.899 3.644 3.644 0 01-.9-1.38c-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg>;
    case "telegram":
      return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>;
    case "twitter":
      return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
    case "coffee":
      return <Coffee size={size} />;
    case "email":
      return <Mail size={size} />;
    case "globe":
      return <Globe size={size} />;
    default:
      return <Globe size={size} />;
  }
};

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { accent, setAccent } = useAccentColor();
  const [activeSection, setActiveSection] = useState("appearance");
  const { settings: navSettings, update: updateNav, resetDefaults: resetNavDefaults } = useNavSettings();

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
  const [updateAvailable, setUpdateAvailable] = useState<{ tag: string; url: string; body: string; tauriUpdate?: any } | null>(null);

  // Shortcuts
  const [shortcuts, setShortcuts] = useState<ShortcutDef[]>(loadShortcuts);
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [capturedKeys, setCapturedKeys] = useState<string>("");

  // Drag state for nav reorder
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Data stats
  const [storageUsed, setStorageUsed] = useState("—");

  // G-key sequence handler
  const gPendingRef = useRef(false);
  const gTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    document.documentElement.style.fontSize = `${zoom}%`;
    localStorage.setItem("movie_tracker_zoom", String(zoom));
  }, [zoom]);

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
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`);
      const repo = await res.json();
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

  // Keyboard shortcuts - G then X sequence
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (editingShortcut) return;

      // Ctrl+K: search
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        return;
      }

      // F11: fullscreen
      if (e.key === "F11") {
        e.preventDefault();
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
        return;
      }

      // Escape
      if (e.key === "Escape") {
        const closeButton = document.querySelector('[data-testid="close-button"]') as HTMLButtonElement;
        if (closeButton) closeButton.click();
        return;
      }

      // G-key sequence
      if (e.key === "g" || e.key === "G") {
        if (!gPendingRef.current) {
          gPendingRef.current = true;
          clearTimeout(gTimeoutRef.current);
          gTimeoutRef.current = setTimeout(() => { gPendingRef.current = false; }, 800);
          return;
        }
      }

      if (gPendingRef.current) {
        gPendingRef.current = false;
        clearTimeout(gTimeoutRef.current);
        const secondKey = e.key.toUpperCase();
        // Find matching shortcut
        const match = shortcuts.find(s => {
          const m = s.keys.match(/^G then (.+)$/);
          return m && m[1].toUpperCase() === secondKey;
        });
        if (match?.route) {
          e.preventDefault();
          navigate(match.route);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, navigate, editingShortcut]);

  const checkForUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateStatus(null);
    setUpdateAvailable(null);
    
    try {
      let isTauri = false;
      try {
        await import("@tauri-apps/api/core");
        isTauri = true;
      } catch { isTauri = false; }

      if (isTauri) {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        if (update?.available) {
          setUpdateStatus(`🆕 Update available: ${update.version}`);
          setUpdateAvailable({ 
            tag: `v${update.version}`, 
            url: "",
            body: update.body || "",
            tauriUpdate: update
          });
        } else {
          setUpdateStatus(`✓ You're on the latest version (v${APP_VERSION})`);
        }
      } else {
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
      setUpdateStatus("📦 Downloading update...");
      await updateAvailable.tauriUpdate.download();
      setUpdateStatus("⚡ Installing update...");
      await updateAvailable.tauriUpdate.install();
      setUpdateStatus("✅ Update installed! Restarting app...");
      setTimeout(async () => {
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      }, 1500);
    } catch (error) {
      console.error('Update installation failed:', error);
      setUpdateStatus("❌ Failed to install update.");
      toast({ title: "Update Failed", description: "Could not install the update. Please try again or download manually.", variant: "destructive" });
    }
  };

  function saveTheme(t: string) {
    setTheme(t);
    localStorage.setItem("movie_tracker_theme", t);
    applyStoredTheme();
    toast({ title: `${t === "light" ? "Light" : "Dark"} mode applied` });
  }

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

  // Drag handlers for nav reorder
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newOrder = [...navSettings.order];
    const [moved] = newOrder.splice(dragIndex, 1);
    newOrder.splice(index, 0, moved);
    updateNav({ order: newOrder });
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  const moveItem = (index: number, dir: -1 | 1) => {
    const newOrder = [...navSettings.order];
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    updateNav({ order: newOrder });
  };

  const toggleItemVisibility = (path: string) => {
    const visible = navSettings.visibleItems.includes(path);
    if (visible) {
      if (navSettings.visibleItems.length <= 3) {
        toast({ title: "At least 3 items must be visible", variant: "destructive" });
        return;
      }
      updateNav({ visibleItems: navSettings.visibleItems.filter(p => p !== path) });
    } else {
      updateNav({ visibleItems: [...navSettings.visibleItems, path] });
    }
  };

  // Shortcut editing
  const startEditShortcut = (id: string) => {
    setEditingShortcut(id);
    setCapturedKeys("");
  };

  const handleShortcutKeyCapture = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editingShortcut) return;

    if (e.key === "Escape") {
      setEditingShortcut(null);
      setCapturedKeys("");
      return;
    }

    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push("Meta");
    
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (!["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
      parts.push(key);
    }

    if (parts.length > 0 && !["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
      const combo = parts.join("+");
      // Check for conflicts
      const conflict = shortcuts.find(s => s.id !== editingShortcut && s.keys === combo);
      if (conflict) {
        toast({ title: `Conflict: "${combo}" is already used for "${conflict.action}"`, variant: "destructive" });
        return;
      }
      
      const updated = shortcuts.map(s => s.id === editingShortcut ? { ...s, keys: combo } : s);
      setShortcuts(updated);
      saveShortcuts(updated);
      setEditingShortcut(null);
      setCapturedKeys("");
      toast({ title: `Shortcut updated to ${combo}` });
    }
  };

  const resetShortcut = (id: string) => {
    const def = DEFAULT_SHORTCUTS.find(s => s.id === id);
    if (!def) return;
    const updated = shortcuts.map(s => s.id === id ? { ...s, keys: def.defaultKeys } : s);
    setShortcuts(updated);
    saveShortcuts(updated);
    toast({ title: "Shortcut reset to default" });
  };

  const resetAllShortcuts = () => {
    const defaults = DEFAULT_SHORTCUTS.map(d => ({ ...d }));
    setShortcuts(defaults);
    saveShortcuts(defaults);
    toast({ title: "All shortcuts reset to defaults" });
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
                    <div className="w-9 h-9 rounded-full transition-transform group-hover:scale-110"
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

      case "navigation":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Navigation</h2>

            {/* Position */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="font-semibold text-foreground">Position</div>
              <div className="grid grid-cols-4 gap-2">
                {(["bottom", "top", "left", "right"] as NavPosition[]).map(pos => (
                  <button key={pos} onClick={() => updateNav({ position: pos })}
                    className={`p-3 rounded-xl border-2 text-center transition-all capitalize text-sm ${navSettings.position === pos ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:border-primary/50 text-muted-foreground"}`}>
                    {pos}
                    {navSettings.position === pos && <CheckCircle size={12} className="inline ml-1.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-hide */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">Auto-hide on Scroll</div>
                  <div className="text-xs text-muted-foreground">Navbar hides when you scroll down, reappears on scroll up</div>
                </div>
                <Switch checked={navSettings.autoHide} onCheckedChange={v => updateNav({ autoHide: v })} />
              </div>
            </div>

            {/* Glow color */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div>
                <div className="font-semibold text-foreground">Glow Color</div>
                <div className="text-xs text-muted-foreground">Choose a custom glow color for the navigation bar</div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {GLOW_PRESETS.map(g => (
                  <button key={g.value} onClick={() => updateNav({ glowColor: g.value })}
                    className={`p-2.5 rounded-xl border-2 flex items-center gap-2 transition-all text-sm ${navSettings.glowColor === g.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                    <div className="w-5 h-5 rounded-full flex-shrink-0 border border-border/50"
                      style={{ background: g.value === "accent" ? "hsl(var(--primary))" : g.value }} />
                    <span className="text-xs text-foreground">{g.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Custom hex:</label>
                <input
                  type="color"
                  value={navSettings.glowColor.startsWith("#") ? navSettings.glowColor : "#3b82f6"}
                  onChange={e => updateNav({ glowColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={navSettings.glowColor}
                  onChange={e => updateNav({ glowColor: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Reorder + Visibility */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div>
                <div className="font-semibold text-foreground">Reorder & Visibility</div>
                <div className="text-xs text-muted-foreground">Drag to reorder, toggle to show/hide. Hidden items appear on hover (like Windows taskbar).</div>
              </div>
              <div className="space-y-1">
                {navSettings.order.map((path, index) => {
                  const isVisible = navSettings.visibleItems.includes(path);
                  return (
                    <div
                      key={path}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                        dragIndex === index ? "border-primary bg-primary/10 scale-[1.02]" : "border-border/50 hover:bg-secondary/50"
                      } ${!isVisible ? "opacity-50" : ""}`}
                    >
                      <GripVertical size={14} className="text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 text-sm text-foreground">{NAV_LABEL_MAP[path] || path}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveItem(index, -1)} disabled={index === 0}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                          <ArrowUp size={12} />
                        </button>
                        <button onClick={() => moveItem(index, 1)} disabled={index === navSettings.order.length - 1}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                          <ArrowDown size={12} />
                        </button>
                        <button onClick={() => toggleItemVisibility(path)}
                          className={`p-1 transition-colors ${isVisible ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                          {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={resetNavDefaults} className="text-xs text-primary hover:underline flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Reset to defaults
              </button>
            </div>
          </div>
        );

      case "apis":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">API Keys</h2>

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

            <p className="text-sm text-muted-foreground">Click "Test & Save" to validate your key before it's stored.</p>

            <ApiKeyField label="TMDB" storageKey="tmdb_api_key" value={tmdbKey} setValue={setTmdbKey} show={showTmdb} setShow={setShowTmdb}
              description="Required for all movie & series data, trailers, cast, recommendations"
              features={["Trending", "Search", "Trailers", "Cast", "Recommendations", "Genres"]}
              onValidate={validateTmdb} />
            <ApiKeyField label="OMDB" storageKey="omdb_api_key" value={omdbKey} setValue={setOmdbKey} show={showOmdb} setShow={setShowOmdb}
              description="Enables IMDb & Rotten Tomatoes ratings, episode ratings, content rating"
              features={["IMDb Ratings", "RT Scores", "Episode Ratings", "Rated (PG/R/etc)"]}
              onValidate={validateOmdb} />
            <ApiKeyField label="TVDB" storageKey="tvdb_api_key" value={tvdbKey} setValue={setTvdbKey} show={showTvdb} setShow={setShowTvdb}
              description="Enhanced series data, episode artwork, and additional cast info"
              features={["Episode Artwork", "Extended Cast", "Network Info"]}
              onValidate={validateTvdb} />

            <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">How to get API keys:</p>
              <p>🎬 <strong>TMDB:</strong> <button onClick={() => openExternal("https://www.themoviedb.org/settings/api")} className="text-primary hover:underline">themoviedb.org/settings/api</button> — free account required</p>
              <p>⭐ <strong>OMDB:</strong> <button onClick={() => openExternal("https://www.omdbapi.com/apikey.aspx")} className="text-primary hover:underline">omdbapi.com/apikey.aspx</button> — 1000 req/day free</p>
              <p>📺 <strong>TVDB:</strong> <button onClick={() => openExternal("https://thetvdb.com/api-information")} className="text-primary hover:underline">thetvdb.com/api-information</button> — free registration</p>
            </div>
          </div>
        );

      case "display":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Display Settings</h2>

            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="font-semibold text-foreground">Image Quality</div>
              <p className="text-xs text-muted-foreground">Controls the resolution of movie/series poster images loaded from TMDB</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "low", label: "Low", desc: "~200px wide · Saves data" },
                  { id: "medium", label: "Medium", desc: "~342px wide · Balanced" },
                  { id: "high", label: "High", desc: "~500px wide · Best quality" },
                  { id: "auto", label: "Auto", desc: "Based on your connection speed" },
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
                  <div className="text-xs text-muted-foreground">Include R-rated and adult titles in search/discover results</div>
                </div>
                <Switch checked={showAdult} onCheckedChange={v => { setShowAdult(v); localStorage.setItem("show_adult", String(v)); }} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="font-semibold text-foreground">Card Density</div>
              <p className="text-xs text-muted-foreground">Affects the number of columns in grid views</p>
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
                    if (v) document.documentElement.style.setProperty("--border", "220 15% 35%");
                    else applyStoredTheme();
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
                    if (v) document.documentElement.style.setProperty("--animation-duration", "0ms");
                    else document.documentElement.style.removeProperty("--animation-duration");
                  }
                },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                  <Switch checked={item.checked} onCheckedChange={item.onChange} />
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

      case "shortcuts":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Keyboard Shortcuts</h2>
              <button onClick={resetAllShortcuts} className="text-xs text-primary hover:underline flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Reset all
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Click on a shortcut to rebind it. Press Escape to cancel.</p>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {shortcuts.map(shortcut => (
                <div key={shortcut.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-foreground">{shortcut.action}</span>
                  <div className="flex items-center gap-2">
                    {editingShortcut === shortcut.id ? (
                      <div
                        tabIndex={0}
                        onKeyDown={handleShortcutKeyCapture}
                        className="px-3 py-1.5 text-xs bg-primary/20 rounded border-2 border-primary font-mono text-primary animate-pulse focus:outline-none"
                        autoFocus
                      >
                        Press keys...
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditShortcut(shortcut.id)}
                        className="px-2 py-1 text-xs bg-muted rounded border border-border font-mono text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                      >
                        {shortcut.keys}
                      </button>
                    )}
                    {shortcut.keys !== shortcut.defaultKeys && (
                      <button
                        onClick={() => resetShortcut(shortcut.id)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Reset to default"
                      >
                        <RotateCcw size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-secondary/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Tips:</p>
              <p>• "G then X" shortcuts: Press G, then quickly press the second key</p>
              <p>• Click any shortcut to change its binding</p>
              <p>• Conflicts are automatically detected</p>
            </div>
          </div>
        );

      case "about":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">About</h2>

            {/* App Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
                  <img src={appIcon} alt="Movie Tracker" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Movie Tracker</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">v{APP_VERSION}</Badge>
                    <span className="text-xs text-muted-foreground">Built with React + Vite + Tauri</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A beautiful Netflix-style movie and series tracker. Discover, track, and organize your watching journey with a stunning UI, offline support, and deep customization.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["React", "TypeScript", "Tailwind CSS", "Vite", "Tauri", "TMDB API"].map(tech => (
                  <Badge key={tech} variant="outline" className="text-[10px] border-border/50">{tech}</Badge>
                ))}
              </div>
            </div>

            {/* GitHub */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SocialIcon type="github" size={20} />
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
                  <button onClick={() => openExternal(GITHUB_URL)}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground hover:bg-secondary/80 flex items-center gap-1.5">
                    <ExternalLink size={11} /> View
                  </button>
                </div>
              </div>
            </div>

            {/* Updates */}
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
                  No releases found. <button onClick={() => openExternal(GITHUB_URL)} className="text-primary hover:underline">Check GitHub</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {releases.map((r, i) => <ChangelogCard key={r.tag_name} release={r} isLatest={i === 0} />)}
                </div>
              )}
            </div>
          </div>
        );

      case "developer":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Developer</h2>

            {/* Developer profile card */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                    <User size={36} className="text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Yetemgeta Bekele</h3>
                  <p className="text-sm text-muted-foreground">Full-Stack Developer</p>
                  <p className="text-xs text-muted-foreground mt-1">Creator of Movie Tracker</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Passionate about building beautiful, functional apps with modern web technologies. Movie Tracker is a labor of love — combining my passion for film with clean UI/UX design.
              </p>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Made with <Heart size={14} className="text-red-400 fill-red-400 mx-1" /> and lots of ☕
              </div>
            </div>

            {/* Social links */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="font-semibold text-foreground">Connect with me</div>
              <div className="grid grid-cols-2 gap-2">
                {DEVELOPER_LINKS.map(link => (
                  <button
                    key={link.label}
                    onClick={() => openExternal(link.url)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-secondary/50 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: `${link.color}15`, color: link.color }}>
                      <SocialIcon type={link.icon} size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{link.label}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {link.url.replace(/^https?:\/\//, "").replace(/^mailto:/, "")}
                      </div>
                    </div>
                    <ExternalLink size={10} className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            {/* Support */}
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Coffee size={18} className="text-yellow-500" />
                <div className="font-semibold text-foreground">Support this project</div>
              </div>
              <p className="text-sm text-muted-foreground">
                If you enjoy Movie Tracker, consider buying me a coffee! It helps me keep developing new features and improvements.
              </p>
              <button
                onClick={() => openExternal("https://buymeacoffee.com/yetemgetab")}
                className="px-4 py-2.5 rounded-xl bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 transition-colors flex items-center gap-2"
              >
                <Coffee size={14} /> Buy Me a Coffee
              </button>
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

        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            Made with <Heart size={11} className="text-red-400 fill-red-400" /> by{" "}
            <button onClick={() => openExternal("https://github.com/yetemgetaB")} className="text-primary hover:underline">Yetemgeta Bekele</button>
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
                    <button
                      onClick={() => openExternal(updateAvailable!.url)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink size={14} /> View Release on GitHub
                    </button>
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
