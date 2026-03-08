

# Comprehensive Feature Update — All 7 Sections

This is a large-scale update touching nearly every page. Here's the implementation plan organized by section.

---

## 1. Enhanced Home Page

**What changes:**
- Wire up `getRecommendedMovies()` and `getRecommendedSeries()` from `src/lib/recommendations.ts` as new ContentRow sections on HomePage
- Add a "Recommended For You" row (movies) and "Series You Might Like" row after the existing trending rows
- Add mood-based quick filters at the top (e.g. "Feel Good", "Thrilling", "Mind-Bending") that filter TMDB discover by genre combos
- Enhance "Continue Watching" row to show season/episode progress text on cards

**Files:** `src/pages/HomePage.tsx`

---

## 2. Series Episode Tracker

**What changes:**
- Create `src/lib/episodeTracker.ts` — localStorage-based tracker for per-episode watched state (`{ seriesId, seasonNum, episodeNum, watched, watchedAt }[]`)
- Add episode checkboxes in `SeriesDetailView.tsx` season expansion — fetch season details and render each episode with a checkbox
- Add season progress bars (e.g. "5/10 episodes watched")
- Show "Next Episode" indicator based on last watched episode
- Update `watchProgress.ts` to sync with episode tracker data

**Files:** `src/lib/episodeTracker.ts` (new), `src/components/SeriesDetailView.tsx`, `src/lib/watchProgress.ts`

---

## 3. Social & Sharing Enhancements

**What changes:**
- Create `src/components/ShareProfileCard.tsx` — canvas-generated profile card showing user's top stats, top genres, avatar
- Create `src/components/TopFourGrid.tsx` — let users pick 4 favorite movies, render a 2x2 poster grid image via canvas
- Add share buttons on AnalyticsPage to generate and share these cards
- Enhance `src/lib/sharing.ts` with `generateProfileCard()` and `generateTopFourCard()` functions

**Files:** `src/components/ShareProfileCard.tsx` (new), `src/components/TopFourGrid.tsx` (new), `src/lib/sharing.ts`, `src/pages/AnalyticsPage.tsx`

---

## 4. Advanced Search — Global Command Palette

**What changes:**
- Create `src/components/CommandPalette.tsx` — a `Ctrl+K` / `Cmd+K` triggered dialog using the existing `cmdk` library
- Search across: collection items, pages/routes, TMDB movies/series
- Show results grouped by category with keyboard navigation
- Register the shortcut in `AppLayout.tsx`

**Files:** `src/components/CommandPalette.tsx` (new), `src/components/AppLayout.tsx`

---

## 5. UI/UX Polish

**What changes:**
- Add skeleton loading states to HomePage content rows (already partially exists, extend to all rows)
- Add smooth fade/slide transitions when navigating between detail views and list views
- Add loading skeletons to BrowsePage, MoviesPage, SeriesPage results
- Improve empty states with illustrations across all pages
- Add toast confirmations for all destructive actions (remove from collection, etc.)

**Files:** `src/pages/HomePage.tsx`, `src/pages/BrowsePage.tsx`, `src/pages/MoviesPage.tsx`, `src/pages/SeriesPage.tsx`, `src/pages/VaultPage.tsx`, `src/components/MovieDetailView.tsx`, `src/components/SeriesDetailView.tsx`

Note: We will NOT add framer-motion as a dependency to keep bundle size lean. Instead we'll use CSS animations and Tailwind's built-in `animate-in` utilities.

---

## 6. Data & Analytics Upgrades

**What changes:**
- Add "Watch Time Goal" feature — users set a monthly goal (hours), shown as a progress ring on AnalyticsPage
- Add "Year in Review" summary card — a single-page stats card for the current year
- Add "User vs IMDb" rating comparison scatter chart — plot user rating vs IMDb rating for each item
- Store watch time goal in localStorage

**Files:** `src/pages/AnalyticsPage.tsx`, `src/lib/watchGoals.ts` (new)

---

## 7. Quality of Life Fixes

**What changes:**
- Add retry logic to TMDB API calls in `src/lib/tmdb.ts` (retry up to 2 times on failure)
- Add better error boundaries — create `src/components/ErrorBoundary.tsx` wrapping each page
- Improve form validation in add-to-collection dialogs (rating 1-10 validation, date validation)
- Add confirmation dialogs before destructive actions (remove from vault)

**Files:** `src/lib/tmdb.ts`, `src/components/ErrorBoundary.tsx` (new), `src/components/MovieDetailView.tsx`, `src/components/SeriesDetailView.tsx`, `src/pages/VaultPage.tsx`

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `src/lib/episodeTracker.ts` | Per-episode watched state storage |
| `src/lib/watchGoals.ts` | Monthly watch time goals |
| `src/components/CommandPalette.tsx` | Global Ctrl+K search |
| `src/components/ShareProfileCard.tsx` | Shareable profile card generator |
| `src/components/TopFourGrid.tsx` | Top 4 favorites poster grid |
| `src/components/ErrorBoundary.tsx` | Error boundary wrapper |

## Files Modified

`HomePage.tsx`, `SeriesDetailView.tsx`, `MovieDetailView.tsx`, `AnalyticsPage.tsx`, `AppLayout.tsx`, `BrowsePage.tsx`, `MoviesPage.tsx`, `SeriesPage.tsx`, `VaultPage.tsx`, `watchProgress.ts`, `sharing.ts`, `tmdb.ts`

---

## Implementation Order

1. Quality of life (error boundary, retry logic, validation) — foundational
2. Episode tracker library + series detail integration
3. Command palette
4. HomePage recommendations + mood browsing
5. Analytics upgrades (goals, year-in-review, scatter chart)
6. Social sharing cards
7. UI polish pass (skeletons, transitions, empty states)

