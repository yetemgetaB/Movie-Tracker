

# Plan: Major Feature Bundle + Navbar Fix (No Version Bump)

This is a large feature set. Given scope, I'll implement them in priority order across the affected files.

## 1. Navbar Fix — Hidden Items Should Stay Hidden

**Problem**: When a nav item is toggled off, it still appears on hover. User wants "off = completely hidden."

**Fix in `BottomNav.tsx`**: Remove the entire "hidden items revealed on hover" section (lines 122-150). Only render `visibleItems`. Remove `showHidden` state.

---

## 2. Streaming Provider Integration

**Add to `tmdb.ts`**: New API endpoint `watchProviders(id)` calling `/movie/{id}/watch/providers` and `/tv/{id}/watch/providers`.

**Add to `MovieDetailView.tsx` and `SeriesDetailView.tsx`**: New "Where to Watch" section showing streaming logos (Netflix, Amazon, Disney+, etc.) using TMDB's provided logo URLs. Group by flatrate (subscription), rent, and buy.

---

## 3. PWA / Mobile Companion

Install `vite-plugin-pwa`. Configure in `vite.config.ts` with manifest, icons, and offline caching strategy. Add meta tags to `index.html`. Create an `/install` page with install prompt.

---

## 4. Offline Mode with Caching

Extend the PWA service worker to cache TMDB API responses (posters, detail pages). Use `workbox` runtime caching with a stale-while-revalidate strategy for API calls and cache-first for images.

---

## 5. Multi-language Support (i18n)

Create `src/lib/i18n.ts` with a simple translation system using localStorage. Support English, Amharic (አማርኛ), Spanish, French. Create translation dictionaries for all UI strings. Add a language selector in Settings > Appearance.

---

## 6. Notification System

Create `src/lib/notifications.ts` — check watchlisted items against TMDB upcoming/airing data. Show in-app toast notifications on HomePage load for upcoming releases. Store "notified" IDs in localStorage to avoid duplicates. Add a notification bell icon to the layout.

---

## 7. Data Visualization Enhancements

Enhance `AnalyticsPage.tsx`:
- Genre distribution **pie chart** (already exists, enhance)
- Monthly watch **heatmap** (calendar-style grid)
- Rating distribution **histogram**
- Director/Actor frequency charts
- Watching streak visualization

---

## 8. Accessibility Improvements

- Add `aria-label` attributes to all interactive elements
- Ensure proper `role` attributes on nav, buttons, cards
- Add **skip to content** link
- Add **high contrast mode** CSS class (partially exists, enhance)
- Ensure all keyboard navigation works (tab order, focus rings)
- Add screen reader announcements for route changes

---

## 9. Achievement/Gamification System

Create `src/lib/achievements.ts`:
- Define badges: "First Movie", "10 Movies", "50 Movies", "100 Movies", "Genre Explorer" (5+ genres), "Binge Watcher" (5 in a day), "Critic" (50 ratings), "Series Completionist"
- Check achievements on collection changes
- Show unlocked badges in a new "Achievements" section on Analytics page
- Toast notification on new achievement unlock

---

## 10. Custom Collections/Lists

Extend `src/lib/watchlist.ts` (already has `CustomList` support):
- Enhance the UI on WatchlistPage to allow creating lists like "Weekend Watch", "Best Thrillers"
- Add drag-to-reorder within lists
- Add color/emoji customization per list
- Add "Add to List" option in movie/series detail views

---

## 11. Social Sharing

Create `src/lib/sharing.ts`:
- Generate shareable cards as canvas-rendered images
- Include movie poster, user rating, app branding
- Support sharing stats summary cards
- Use `navigator.share()` API with fallback to clipboard copy

---

## 12. Smart Recommendations (Algorithm-based, No AI)

Create `src/lib/recommendations.ts`:
- Analyze user's collection: top genres, directors, actors, average ratings
- Score TMDB discover results by matching user preferences
- Weight by genre overlap, director match, actor match, rating similarity
- Show "Recommended for You" section on HomePage

---

## 13. Advanced Search & Filters

Enhance `MoviesPage.tsx` and `SeriesPage.tsx`:
- Add **language** filter (using TMDB's `with_original_language`)
- Add **streaming availability** filter (using watch providers API)
- Add **runtime** range slider
- These filters partially exist; enhance with streaming and language

---

## 14. Plugin/Extension System

Create `src/lib/plugins.ts`:
- Define a plugin interface: `{ id, name, type: 'theme' | 'widget' | 'datasource', config }`
- Support custom CSS theme injection
- Support custom widget components on HomePage
- Store plugin configs in localStorage
- Add a "Plugins" section in Settings

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/components/BottomNav.tsx` | Remove hidden-items-on-hover behavior |
| `src/lib/tmdb.ts` | Add `watchProviders()` endpoints |
| `src/components/MovieDetailView.tsx` | Add "Where to Watch" streaming section |
| `src/components/SeriesDetailView.tsx` | Add "Where to Watch" streaming section |
| `vite.config.ts` | Add `vite-plugin-pwa` config |
| `index.html` | Add PWA meta tags |
| `src/pages/InstallPage.tsx` | New: PWA install prompt page |
| `src/lib/i18n.ts` | New: translation system |
| `src/lib/translations/` | New: en.ts, am.ts, es.ts, fr.ts |
| `src/lib/notifications.ts` | New: watchlist notification checker |
| `src/pages/AnalyticsPage.tsx` | Add heatmap, enhanced charts |
| `src/lib/achievements.ts` | New: badge/achievement system |
| `src/lib/recommendations.ts` | New: algorithm-based recommendations |
| `src/lib/sharing.ts` | New: shareable card generator |
| `src/lib/plugins.ts` | New: plugin system |
| `src/pages/HomePage.tsx` | Add recommendations section, notification bell |
| `src/pages/MoviesPage.tsx` | Add language & streaming filters |
| `src/pages/SeriesPage.tsx` | Add language & streaming filters |
| `src/pages/WatchlistPage.tsx` | Enhanced custom lists UI |
| `src/pages/SettingsPage.tsx` | Add Language, Plugins sections |
| `src/components/AppLayout.tsx` | Add skip-to-content, aria announcements |
| `src/App.tsx` | Add /install route |

No version bump per user request — this is a testing/development build.

