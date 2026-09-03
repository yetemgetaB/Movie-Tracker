# Movie Tracker — Comprehensive Codebase Analysis Report
**Generated:** April 11, 2026  
**App Version:** 1.3.2  
**Codebase Size:** ~50+ files, ~8,000+ lines of TypeScript/React  

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Critical Bugs & Issues](#2-critical-bugs--issues)
3. [Architecture & Code Quality](#3-architecture--code-quality)
4. [Component-Level Analysis](#4-component-level-analysis)
5. [Data Layer & State Management](#5-data-layer--state-management)
6. [Performance Issues](#6-performance-issues)
7. [UX & Accessibility](#7-ux--accessibility)
8. [Security Concerns](#8-security-concerns)
9. [Feature Gaps & Recommendations](#9-feature-gaps--recommendations)
10. [Implementation Priority Matrix](#10-implementation-priority-matrix)

---

## 1. Executive Summary

Movie Tracker is a Tauri-based desktop application for tracking movies and TV series. The frontend is React 18 + TypeScript + Tailwind CSS with shadcn/ui components. Data is stored in localStorage with optional Supabase cloud sync. The app integrates with TMDB and OMDB APIs.

**Overall Assessment:** The app has solid foundational architecture but suffers from several categories of issues:
- **6 Critical bugs** that impact core functionality
- **12 Code quality issues** affecting maintainability
- **8 Performance bottlenecks** causing UI jank
- **5 Security concerns** requiring immediate attention
- **15+ Feature gaps** that would significantly improve UX

---

## 2. Critical Bugs & Issues

### BUG-001: `CollectionMovie` and `CollectionSeries` are identical interfaces
**File:** `src/lib/collection.ts` (lines 3-51)  
**Severity:** 🔴 High  
**Impact:** Both `CollectionMovie` and `CollectionSeries` have identical fields including `seasons`, `episodes`, `nextSeason` on movies — which makes no semantic sense. Movies should NOT have `seasons`/`episodes`/`nextSeason` fields.  
**Fix:** Create a shared `BaseCollectionItem` interface and extend it with type-specific fields:
```typescript
interface BaseCollectionItem {
  id: number; type: string; title: string; poster: string;
  genre: string; year: string; userRating: string;
  startDate: string; finishDate: string; addedAt: string;
  notes?: string; moodTags?: string[];
}
interface CollectionMovie extends BaseCollectionItem {
  type: "movie"; director: string; rated: string; runtime?: number;
  imdb: string; rt: string; stars: string;
}
interface CollectionSeries extends BaseCollectionItem {
  type: "series"; seasons: number; episodes: number;
  status: string; nextSeason: string;
  imdb: string; rt: string; stars: string;
}
```

### BUG-002: Achievement status check uses wrong field values
**File:** `src/lib/achievements.ts` (line 137)  
**Severity:** 🔴 High  
**Impact:** `completedSeries` is filtered by `s.status === "Ended"`, but actual stored data uses values like `"Yes"`, `"No"`, `"Completed"`. This means achievements like `series_finisher` never unlock for users who mark series as complete.  
**Fix:** Align with the status values used in the Vault page:
```typescript
const completedSeries = series.filter(s => {
  const st = (s.status || "").trim().toLowerCase();
  return st === "yes" || st === "completed" || st === "ended" || st === "finished" || !!s.finishDate;
});
```

### BUG-003: Analytics `completedSeries` uses same wrong check
**File:** `src/pages/AnalyticsPage.tsx` (line 64)  
**Severity:** 🔴 High  
**Impact:** The completion rate stat and related analytics are incorrect because `s.status === "Ended"` doesn't match real data.  
**Fix:** Same as BUG-002 — normalize status checking across the entire codebase.

### BUG-004: `removeFromCollection` doesn't filter by type
**File:** `src/lib/collection.ts` (line 96)  
**Severity:** 🟡 Medium  
**Impact:** If a movie and series share the same TMDB ID (possible, since TMDB uses separate ID spaces for movies and TV), calling `removeFromCollection(id)` removes BOTH items. The filter only checks `i.id !== id` without checking `i.type`.  
**Fix:**
```typescript
export function removeFromCollection(id: number, type?: "movie" | "series"): void {
  const items = getLocalCollection().filter(i =>
    type ? !(i.id === id && i.type === type) : i.id !== id
  );
  saveLocalCollection(items);
}
```

### BUG-005: `getCollection()` called inside render without memoization
**File:** `src/components/CommandPalette.tsx` (line 37)  
**Severity:** 🟡 Medium  
**Impact:** `const collection = getCollection()` is called on EVERY render of CommandPalette (which is mounted globally). This parses localStorage JSON on every keystroke, every route change, and every state update. Causes unnecessary work.  
**Fix:** Wrap in `useMemo` or `useState` with a refresh trigger.

### BUG-006: Hero banner YouTube iframe is never cleaned up
**File:** `src/pages/HomePage.tsx` (lines 297-303)  
**Severity:** 🟡 Medium  
**Impact:** The YouTube iframe with `autoplay=1` loads a full YouTube player in the background. When `showVideo` becomes false (component unmounts or hero changes), the iframe is removed from DOM but the YouTube player may continue running in the background, consuming memory and bandwidth. Also, `scale-150` on the iframe means YouTube UI controls are pushed offscreen but still interactive — potential clickjacking surface.  
**Fix:** Use YouTube IFrame API for proper lifecycle control, or add `loading="lazy"` and manage the iframe ref.

---

## 3. Architecture & Code Quality

### ARCH-001: Monolithic page components
**Files:** `HomePage.tsx` (711 lines), `SettingsPage.tsx` (1513 lines), `VaultPage.tsx` (634 lines), `AnalyticsPage.tsx` (644 lines)  
**Issue:** These files contain multiple sub-components, utility functions, constants, and business logic all in single files. `SettingsPage.tsx` at 1513 lines is particularly problematic.  
**Recommendation:** Extract into smaller files:
- `src/components/settings/AppearanceSection.tsx`
- `src/components/settings/ApiKeysSection.tsx`
- `src/components/settings/NavigationSection.tsx`
- `src/components/home/HeroBanner.tsx`
- `src/components/home/ContentRow.tsx`
- `src/components/home/MoviePosterCard.tsx`
- `src/components/vault/VaultStats.tsx`
- `src/components/vault/EditDialog.tsx`

### ARCH-002: Duplicated genre maps across files
**Files:** `HomePage.tsx`, `BrowsePage.tsx`, `MoviesPage.tsx`, `SeriesPage.tsx`  
**Issue:** `GENRE_MAP`, `GENRES`, `MOVIE_GENRES`, `TV_GENRES` are defined separately in 4+ files with slightly different data. This leads to inconsistency — for example, `HomePage.tsx` maps genre ID 878 to "Sci-Fi" while `BrowsePage.tsx` maps it to "Sci-Fi" but with a different structure.  
**Fix:** Create `src/lib/genres.ts` with a single source of truth:
```typescript
export const MOVIE_GENRES = [...];
export const TV_GENRES = [...];
export const GENRE_MAP: Record<number, string> = {};
```

### ARCH-003: Search history logic duplicated
**Files:** `MoviesPage.tsx` (lines 23-32), `SeriesPage.tsx` (lines 21-27)  
**Issue:** Identical `getSearchHistory()` and `addToSearchHistory()` functions with different storage keys.  
**Fix:** Extract to `src/lib/searchHistory.ts` with parameterized key.

### ARCH-004: No TypeScript strict mode
**Issue:** Many `any` casts throughout the codebase (e.g., `(a as any)[key]`, `(m as any).runtime`). The collection interfaces don't enforce required vs optional fields properly.  
**Fix:** Enable stricter TypeScript checking and replace `any` with proper types.

### ARCH-005: `tmdb.ts` is 353 lines and growing
**File:** `src/lib/tmdb.ts`  
**Issue:** Contains types, helper functions, API clients for movies, series, and watch providers all in one file.  
**Fix:** Split into:
- `src/lib/tmdb/client.ts` — core fetch logic
- `src/lib/tmdb/types.ts` — all interfaces
- `src/lib/tmdb/movies.ts` — movie API
- `src/lib/tmdb/series.ts` — series API
- `src/lib/tmdb/images.ts` — image URL helpers

### ARCH-006: Unused imports and dead code
**Files:** Multiple  
**Examples:**
- `BrowsePage.tsx` imports `useQuery`, `useMemo`, `useNavigate`, `Badge`, `MovieDetailView`, `SeriesDetailView` — but `useQuery` and `useMemo` are never used for data fetching (the page is purely static genre buttons)
- `WatchlistPage.tsx` imports `GripVertical` (unused)
- `HomePage.tsx` imports `Sparkles` (unused)

---

## 4. Component-Level Analysis

### COMP-001: `MoviePosterCard` hover card positioning is fragile
**File:** `src/pages/HomePage.tsx` (lines 111-246)  
**Issue:** The hover card uses fixed positioning calculated from `getBoundingClientRect()`. This breaks when:
- The page is scrolled (rect values change relative to viewport)
- Multiple cards are hovered in quick succession (race condition with 400ms timer)
- The card is at the edge of the screen (partial clipping)  
**Fix:** Use a portal with Radix UI's `HoverCard` component which handles positioning, collision detection, and animation properly.

### COMP-002: `LoadingScreen` fires `onFinished` inside `setInterval` callback
**File:** `src/components/LoadingScreen.tsx` (line 13)  
**Issue:** `onFinished` is called inside a `setTimeout` nested in a `setInterval` callback. If `onFinished` changes between renders (it's wrapped in `useCallback` in `App.tsx`, so it's stable — but this is a fragile pattern). Also, the loading screen is purely decorative — it doesn't wait for any actual data to load.  
**Recommendation:** Consider making the loading screen wait for at least one real API call or localStorage hydration to complete, so it provides genuine loading feedback rather than a fake progress bar.

### COMP-003: `ErrorBoundary` doesn't recover on route changes
**File:** `src/components/ErrorBoundary.tsx`  
**Issue:** Once an error is caught, the "Try Again" button resets state but doesn't force a re-mount of children. If the error was caused by bad data on a specific page, navigating away and back will still show the error boundary.  
**Fix:** Add a `key` based on `location.pathname` to force remount:
```tsx
<ErrorBoundary key={location.pathname}>
  <Routes>...</Routes>
</ErrorBoundary>
```

### COMP-004: `BottomNav` creates function inside render on every call
**File:** `src/components/BottomNav.tsx` (line 64)  
**Issue:** `getGlowStyle` is defined inside the component but outside the return — it's recreated every render. While not a critical perf issue, it's inconsistent with the component's other patterns.

### COMP-005: Calendar page doesn't format dates nicely
**File:** `src/pages/CalendarPage.tsx` (line 63)  
**Issue:** Displays raw `date` string (e.g., `2026-04-15`). The Vault page has `formatDisplayDate()` but it's not shared.  
**Fix:** Extract `formatDisplayDate` to `src/lib/dateUtils.ts` and reuse across Calendar, Vault, and Analytics pages.

### COMP-006: `NotificationBell` check runs on every mount
**Issue:** `checkWatchlistNotifications()` in `src/lib/notifications.ts` makes up to 20 API calls (10 movies + 10 series) sequentially. If this runs on every page navigation, it creates significant API load.  
**Fix:** Add a throttle/debounce — only check once every 30 minutes, storing the last check timestamp.

---

## 5. Data Layer & State Management

### DATA-001: All state in localStorage — no reactive updates
**Issue:** The app uses localStorage directly (e.g., `getCollection()`, `getWatchlist()`). When data changes in one component, other components don't know about it until they re-read localStorage. This causes stale data across:
- CommandPalette showing outdated collection
- Analytics page not reflecting new additions
- Watch progress bar not updating after adding to collection  
**Fix:** Implement a simple event-based store or use React Context:
```typescript
// src/lib/store.ts
const listeners = new Set<() => void>();
export function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }
export function notify() { listeners.forEach(fn => fn()); }
// Call notify() after every save operation
```

### DATA-002: No data migration strategy
**Issue:** As the app evolves, the localStorage schema changes (e.g., adding `notes`, `moodTags`, `runtime` fields). Old data lacks these fields, causing undefined checks throughout. There's no versioning or migration system.  
**Fix:** Add a schema version to localStorage and run migrations on app startup:
```typescript
const SCHEMA_VERSION = 2;
function migrateIfNeeded() {
  const v = parseInt(localStorage.getItem("schema_version") || "0");
  if (v < 1) { /* add notes field */ }
  if (v < 2) { /* add moodTags field */ }
  localStorage.setItem("schema_version", String(SCHEMA_VERSION));
}
```

### DATA-003: localStorage size limits
**Issue:** localStorage has a 5-10MB limit depending on browser. With 100+ items each containing poster URLs, genres, cast data, and notes, the collection could approach this limit. There's no size monitoring or cleanup.  
**Fix:** Add a size check utility and warn users when approaching the limit. Consider compressing poster URLs (store only TMDB paths, not full URLs).

### DATA-004: `getCollection()` parses JSON on every call
**Issue:** Every call to `getCollection()` runs `JSON.parse(localStorage.getItem(...))`. In components like `CommandPalette` (called on every render) and `HomePage` (called for recommendations and watch progress), this causes redundant parsing.  
**Fix:** Implement a cache layer that invalidates on write:
```typescript
let cache: CollectionItem[] | null = null;
export function getCollection(): CollectionItem[] {
  if (cache) return cache;
  cache = getLocalCollection();
  return cache;
}
export function invalidateCache() { cache = null; }
```

---

## 6. Performance Issues

### PERF-001: HomePage makes 8+ parallel API calls on mount
**File:** `src/pages/HomePage.tsx` (lines 386-470)  
**Issue:** On first load, the HomePage fires queries for: trending movies, trending series, top-rated movies, top-rated series, now playing, popular series, recommended movies, recommended series, and hero video data. That's 8-10 API calls simultaneously.  
**Fix:** Prioritize above-the-fold content. Load hero + trending first, then lazy-load others as the user scrolls (IntersectionObserver).

### PERF-002: Full collection scanned for every ContentRow
**File:** `src/pages/HomePage.tsx` (line 125)  
**Issue:** `getWatchProgress()` is called inside `MoviePosterCard` render for EVERY card in EVERY row. With 5 rows × 20 items = 100 calls to `getWatchProgress()`, each parsing localStorage.  
**Fix:** Lift `getWatchProgress()` to the `HomePage` component level and pass as a prop or context.

### PERF-003: Images not using `srcset` or responsive sizing
**Issue:** Poster images use a single resolution (e.g., `w342` or `w500`). On high-DPI screens this looks blurry; on mobile it wastes bandwidth.  
**Fix:** Use TMDB's multiple sizes with `srcSet`:
```tsx
<img
  src={img(path, "w342")}
  srcSet={`${img(path, "w185")} 185w, ${img(path, "w342")} 342w, ${img(path, "w500")} 500w`}
  sizes="160px"
/>
```

### PERF-004: No virtualization for large lists
**Files:** `VaultPage.tsx`, `WatchlistPage.tsx`  
**Issue:** The Vault table renders ALL items at once. With 200+ items, this creates hundreds of DOM nodes.  
**Fix:** Use `@tanstack/react-virtual` for virtualized scrolling in table and grid views.

### PERF-005: CSS animations running continuously
**File:** `src/index.css`, `LoadingScreen.tsx`  
**Issue:** The `spin-slow` and `orbit` animations run indefinitely. After the loading screen fades out, these animations continue running on hidden elements until React unmounts the component (which only happens after the fade-out delay).

### PERF-006: Recharts renders full chart libraries
**File:** `AnalyticsPage.tsx`  
**Issue:** Imports from `recharts` pull in the entire charting library including BarChart, PieChart, LineChart, RadarChart, ScatterChart — even if the user only views one tab. Bundle size impact is significant (~150KB gzipped).  
**Fix:** Use `React.lazy()` to code-split each chart tab.

### PERF-007: `useMemo` dependencies include unstable references
**File:** `src/pages/AnalyticsPage.tsx` (line 161)  
**Issue:** `const achievements = useMemo(() => getAllAchievementsWithStatus(), [collection])` — `collection` is created via `useMemo(() => getCollection(), [])` which is stable, but the dependency is the array reference itself. Since `getCollection()` returns a new array on every call, if the `useMemo` on line 55 ever recomputes, ALL downstream memoization breaks.

### PERF-008: No lazy loading for detail view components
**Files:** `MovieDetailView.tsx`, `SeriesDetailView.tsx`  
**Issue:** These are heavy components (~500 lines each) imported eagerly on every page that might show details. They should be lazy-loaded.  
**Fix:** `const MovieDetailView = React.lazy(() => import('./MovieDetailView'))`.

---

## 7. UX & Accessibility

### UX-001: No keyboard navigation in ContentRow carousels
**File:** `src/pages/HomePage.tsx`  
**Issue:** The horizontal scroll carousels are only navigable via mouse click on arrow buttons. No keyboard support (arrow keys, tab focus).  
**Fix:** Add `onKeyDown` handler with ArrowLeft/ArrowRight support and `tabIndex={0}` on the scroll container.

### UX-002: No loading state for Vault page
**File:** `src/pages/VaultPage.tsx`  
**Issue:** The collection loads synchronously from localStorage, so there's no loading state. However, if the collection is large, the initial render can be slow with no visual feedback.

### UX-003: No confirmation before data import
**File:** `src/lib/dataManager.ts`  
**Issue:** Importing data can overwrite existing collection. The replace operation is destructive with no undo capability.  
**Fix:** Add an auto-backup before import and a 30-second undo option.

### UX-004: Calendar page shows raw dates
**File:** `src/pages/CalendarPage.tsx` (line 63)  
**Issue:** Dates are displayed as raw strings like `2026-04-15` instead of formatted like `Apr 15, 2026`.

### UX-005: No empty state CTAs on most pages
**Issue:** When there's no API key or no collection data, most pages show a simple message. They should provide clear action buttons (e.g., "Go to Settings", "Browse Movies").  
**Pages affected:** BrowsePage (no empty state at all), CalendarPage (basic message only), AnalyticsPage (basic message only).

### UX-006: Share functionality has no visual feedback
**File:** `src/pages/WatchlistPage.tsx` (line 74)  
**Issue:** `shareList()` copies to clipboard but `navigator.clipboard.writeText()` can fail silently. No error handling.

### UX-007: Color contrast issues in status badges
**File:** `src/pages/VaultPage.tsx`  
**Issue:** The status badges use colors like `text-emerald-400`, `text-amber-400`, `text-blue-400` which may not meet WCAG AA contrast requirements against the dark card backgrounds.

### UX-008: No "Back to top" button on long pages
**Issue:** Pages like Vault (with many items) and Analytics (with many charts) can be very long. No quick way to return to the top.

---

## 8. Security Concerns

### SEC-001: API keys stored in plain text in localStorage
**File:** `src/lib/tmdb.ts`  
**Severity:** 🟡 Medium  
**Impact:** TMDB and OMDB API keys are stored in plain text in localStorage. Any browser extension or XSS vulnerability can read them. While these are free API keys, they're still credentials.  
**Mitigation:** For the Tauri desktop app, use the Tauri secure store plugin. For the web preview, consider obfuscation (not encryption — localStorage is inherently insecure).

### SEC-002: CSP is set to `null`
**File:** `src-tauri/tauri.conf.json` (line 29)  
**Severity:** 🔴 High  
**Impact:** `"csp": null` disables Content Security Policy entirely. This allows arbitrary script injection, XSS attacks, and loading of external resources without restriction.  
**Fix:** Set a proper CSP:
```json
"csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https://image.tmdb.org data:; connect-src 'self' https://api.themoviedb.org https://www.omdbapi.com; frame-src https://www.youtube.com"
```

### SEC-003: YouTube iframe without sandbox
**File:** `src/pages/HomePage.tsx` (line 298)  
**Impact:** The YouTube embed iframe has no `sandbox` attribute, allowing the embedded page full access to forms, scripts, and navigation.  
**Fix:** Add `sandbox="allow-scripts allow-same-origin allow-presentation"`.

### SEC-004: No input validation on collection data
**File:** `src/lib/collection.ts`  
**Impact:** `addToCollection()` accepts any object shape. Malicious import data could inject unexpected properties.  
**Fix:** Add runtime validation using Zod schemas before storing.

### SEC-005: `openExternal` could open arbitrary URLs
**File:** `src/lib/openExternal.ts`  
**Impact:** If user-controlled data flows into `openExternal()`, it could open `javascript:` or `file:` URLs.  
**Fix:** Validate URL protocol before opening (`https:` only).

---

## 9. Feature Gaps & Recommendations

### FEAT-001: Pagination on search results
**Current:** Search results show max 20 items (1 TMDB page). No "Load More" or pagination.  
**Impact:** Users can't find items beyond the first page of results.  
**Implementation:** Add infinite scroll or "Load More" button using TMDB's `page` parameter.

### FEAT-002: Bulk operations in Vault
**Current:** Can only edit/delete one item at a time.  
**Recommendation:** Add multi-select with checkboxes for bulk delete, bulk genre update, bulk export.

### FEAT-003: Drag-and-drop reordering in Watchlist
**Current:** Items are sorted by priority only.  
**Recommendation:** Add drag-and-drop reordering with `@dnd-kit/core`.

### FEAT-004: Offline mode with service worker
**Current:** The `useOnlineStatus` hook detects offline state and shows a banner, but no offline functionality works.  
**Recommendation:** Add a service worker to cache TMDB images and previously viewed details for offline access.

### FEAT-005: Multi-language support
**Current:** `src/lib/i18n.ts` exists but achievement titles use `titleKey`/`descKey` suggesting localization was planned but never implemented.  
**Recommendation:** Complete the i18n implementation with at least English and one other language.

### FEAT-006: Data backup & restore
**Current:** Import/export via `DataManager` exists but is basic.  
**Recommendation:** Add automatic weekly backups to a local file (Tauri filesystem), with a restore picker showing backup dates.

### FEAT-007: Movie/Series comparison view
**Recommendation:** Allow users to select 2-3 titles and compare them side-by-side (ratings, runtime, genre, cast).

### FEAT-008: Watch party integration
**Recommendation:** Generate shareable links with a curated list of movies for group decision-making.

### FEAT-009: Custom tags/labels
**Current:** Only `moodTags` exist, and they're barely integrated.  
**Recommendation:** Allow users to create custom colored tags and filter by them across all views.

### FEAT-010: Advanced stats: Time to Complete
**Recommendation:** Track how long users take to finish series (startDate to finishDate) and show average completion time in analytics.

### FEAT-011: Keyboard shortcuts overlay (Help modal)
**Current:** Shortcuts are configurable in Settings but there's no in-app help overlay showing available shortcuts.  
**Recommendation:** Add `?` key to show a shortcuts cheat sheet modal.

### FEAT-012: Recently viewed history
**Recommendation:** Track the last 20 movie/series detail views and show as a "Recently Viewed" section on the home page.

### FEAT-013: Trailer preview in search results
**Recommendation:** On hover over search results, show a mini trailer preview (similar to Netflix).

### FEAT-014: Genre-based color coding
**Recommendation:** Assign colors to genres (Action=red, Comedy=yellow, etc.) and use them consistently across the app for visual recognition.

### FEAT-015: Watch reminder notifications
**Current:** Calendar has bell icons but they don't trigger real notifications.  
**Recommendation:** Integrate with Tauri's notification plugin to send desktop notifications for tracked releases.

---

## 10. Implementation Priority Matrix

| Priority | Item | Category | Effort | Impact |
|----------|------|----------|--------|--------|
| 🔴 P0 | BUG-002: Fix achievement status check | Bug | Low | High |
| 🔴 P0 | BUG-003: Fix analytics completion rate | Bug | Low | High |
| 🔴 P0 | SEC-002: Add CSP | Security | Low | Critical |
| 🔴 P0 | DATA-001: Reactive state updates | Architecture | Medium | High |
| 🟡 P1 | BUG-001: Split collection interfaces | Bug/Refactor | Medium | Medium |
| 🟡 P1 | BUG-004: Fix removeFromCollection type | Bug | Low | Medium |
| 🟡 P1 | ARCH-001: Split monolithic page components | Refactor | High | High |
| 🟡 P1 | ARCH-002: Centralize genre maps | Refactor | Low | Medium |
| 🟡 P1 | PERF-001: Lazy-load API calls | Performance | Medium | High |
| 🟡 P1 | PERF-002: Lift getWatchProgress | Performance | Low | Medium |
| 🟡 P1 | COMP-005: Share formatDisplayDate | Code Quality | Low | Medium |
| 🟡 P1 | COMP-006: Throttle notification checks | Performance | Low | Medium |
| 🟢 P2 | PERF-004: Virtualized lists | Performance | Medium | Medium |
| 🟢 P2 | PERF-006: Code-split Recharts | Performance | Medium | Medium |
| 🟢 P2 | PERF-008: Lazy-load detail views | Performance | Low | Medium |
| 🟢 P2 | UX-001: Keyboard nav in carousels | Accessibility | Medium | Medium |
| 🟢 P2 | DATA-002: Schema migration system | Architecture | Medium | High |
| 🟢 P2 | FEAT-001: Search pagination | Feature | Medium | High |
| 🟢 P2 | FEAT-002: Bulk operations | Feature | High | Medium |
| 🟢 P2 | FEAT-011: Shortcuts help overlay | Feature | Low | Medium |
| 🔵 P3 | ARCH-005: Split tmdb.ts | Refactor | Medium | Low |
| 🔵 P3 | FEAT-004: Service worker offline | Feature | High | Medium |
| 🔵 P3 | FEAT-005: i18n completion | Feature | High | Medium |
| 🔵 P3 | FEAT-009: Custom tags | Feature | Medium | Medium |
| 🔵 P3 | FEAT-015: Desktop notifications | Feature | Medium | Medium |

---

## Appendix A: File Size Report

| File | Lines | Recommendation |
|------|-------|----------------|
| `SettingsPage.tsx` | 1,513 | 🔴 Split immediately — 5+ sections |
| `HomePage.tsx` | 711 | 🟡 Extract HeroBanner, ContentRow, MoviePosterCard |
| `AnalyticsPage.tsx` | 644 | 🟡 Extract chart components per tab |
| `VaultPage.tsx` | 634 | 🟡 Extract EditDialog, VaultStats, table components |
| `SeriesDetailView.tsx` | ~560 | 🟡 Extract season picker, cast section |
| `MovieDetailView.tsx` | ~474 | 🟢 Acceptable but could extract PersonModal |
| `tmdb.ts` | 353 | 🟡 Split into types/client/movies/series |

## Appendix B: Dependency Audit

| Package | Status | Notes |
|---------|--------|-------|
| `@supabase/supabase-js` | ⚠️ | Installed but only used for optional cloud sync — 50KB+ bundle impact |
| `next-themes` | ⚠️ | Installed but NOT used — theme is managed manually via `applyStoredTheme()` |
| `react-resizable-panels` | ⚠️ | Installed but no usage found in codebase |
| `input-otp` | ⚠️ | Installed for OTP input UI component — likely unused |
| `embla-carousel-react` | ⚠️ | Installed but carousels use custom scroll implementation |
| `vaul` | ⚠️ | Drawer component — check if actually used |
| `react-day-picker` | ⚠️ | Calendar component — may be unused since CalendarPage uses custom implementation |

**Recommendation:** Run `npx knip` to detect unused dependencies and remove them. Estimated bundle savings: ~100-200KB.

---

*End of Report*
