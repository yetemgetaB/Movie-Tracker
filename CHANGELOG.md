# 📝 Changelog

All notable changes to Movie Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.8] - 2026-09-03

### Added
- **PotPlayer Auto-Scrobbler**: Background real-time telemetry polling PotPlayer window titles and `%APPDATA%` recent files to automatically track active playback sessions.
- **Interactive Quick-Rate Notification**: Floating playback completion dialog with a 1–10 star rating bar and a one-click **"Play Next Episode"** action.
- **Automatic Finish Timestamp Logging**: Automatically records `finishDate` and marks media as completed upon playback completion.

---

## [1.3.7] - 2026-09-03

### Added
- **Local Media Folder Scanner**: Native recursive video file scanning across custom directories with resolution parsing and format detection.
- **PotPlayer One-Click Direct Launcher**: Native Windows integration with autodetected PotPlayer (`PotPlayerMini64.exe`), custom player path overrides, and fallback to system default.
- **Episode & Movie Regex Matcher**: Intelligent scene release filename parser (`S01E01`, `1x01`, `1080p`, `4K`, `BluRay`) automatically grouped into seasons and episodes.
- **TMDB Auto-Enrichment**: Matches local filenames with TMDB posters, overviews, ratings, and backdrops.
- **Playback Tracking**: Launching media files automatically tracks playback start date in the collection.

---

## [1.3.6] - 2026-09-03

### Added
- **Local-First SQLite Database Engine**: Integrated `@tauri-apps/plugin-sql` and `tauri-plugin-sql` with persistent `sqlite:movie_tracker.db` database.
- **Zero-Data-Loss Migration**: Automatic detection and safe migration of existing `localStorage` data to SQLite with immutable safety snapshots (`movie_tracker_pre_sqlite_backup_*`).
- **Dual-Write Safety Shadow**: Write operations safely update both SQLite and the persistent store, maintaining full compatibility across desktop and web environments.

---

## [1.3.5] - 2026-09-03

### Added
- **"What to Watch Tonight" Roulette**: Cinematic decision engine with configurable source (Watchlist, Vault, Trending), filters (runtime, genre, rating), spin animation, and trailer preview (`R` key or Titlebar icon).
- **Keyboard Shortcuts Cheat Sheet (`?`)**: Native keybindings overlay showing all quick actions and page navigation hotkeys.
- **Vault Bulk Operations**: Multi-select checkboxes in library tables with floating toolbar for bulk deletion and JSON export.
- **Search & Discover Pagination**: "Load More" pagination across Movies and TV Series discovery pages.

---

## [1.3.4] - 2026-09-03

### Fixed
- Rectified `CollectionMovie` and `CollectionSeries` domain models with shared `BaseCollectionItem`.
- Fixed cross-type ID collision deletions and queries in `removeFromCollection` and `isInCollection`.
- Added YouTube embed iframe sandboxing and lazy-loading in HeroBanner.

### Added
- Created reactive `useCollection` hook powered by `useSyncExternalStore` and in-memory caching.
- Enforced strict Content Security Policy (CSP) in `tauri.conf.json`.

---

## [1.3.3] - 2026-09-03

### Changed
- Consolidated root workspace and restored native `src-tauri` structure.
- Cleaned up root build artifacts and stale timestamp configs.
- Re-synchronized dependencies with clean `package-lock.json`.
- Standardized project name to `movie-tracker` and bumped package/tauri/cargo versions to `1.3.3`.
- Relocated `ROADMAP.md` to repository root.

### Removed
- Legacy build timestamps and obsolete lockfiles.

---

## [1.0.0] - 2024-02-22

### Added
- Initial release of Movie Tracker
- Movie and TV series search functionality
- Personal rating system
- Modern UI with React and Tauri
- Local storage for user data
- Basic statistics tracking
- Theme support (light/dark mode)
- Cross-platform support (Windows, macOS, Linux)

### Features
- 🎬 Universal search across movies and TV series
- ⭐ Personal ratings and tracking
- 📱 Modern, responsive interface with smooth animations
- 🚀 High performance with Rust backend
- 💾 Lightweight application (~15MB)
- 🔒 Local storage only (privacy-focused)
- 📊 Basic viewing statistics
- 🎨 Multiple themes and accent colors

### Technical
- React 18.3.1 with TypeScript
- Tauri 2.10.1 for desktop framework
- Tailwind CSS for styling
- shadcn/ui component library
- Vite build system
- Vitest testing framework

---

## [1.1.0] - 2024-02-22

### Added
- Watchlist functionality with priority levels and notes
- Analytics dashboard with detailed charts and statistics
- Import/Export system supporting JSON and CSV formats
- Auto-update system with in-app changelog viewer
- Enhanced UI with professional update notifications
- UpdateNotification component for automatic update checks
- WatchlistButton component for easy watchlist management
- ImportExportButton for data backup and restore
- Enhanced navigation with watchlist and analytics pages

### Changed
- Improved update system to automatically detect versions
- Enhanced .gitignore for comprehensive coverage
- Updated README.md with new features and documentation
- Optimized build configuration for production
- Enhanced Settings page with update management

### Features
- 📋 **Watchlist** - Add movies/series to personal watchlist with priorities
- 📈 **Analytics Dashboard** - Detailed statistics with interactive charts
- 📤 **Import/Export** - Backup and restore data in JSON/CSV formats
- 🔄 **Auto-Update** - Automatic update checking with changelog viewer
- 🎨 **Enhanced UI** - Professional update notifications and dialogs

### Technical
- Automatic version detection from changelog
- Enhanced error handling and user feedback
- Production-ready build optimizations
- Comprehensive documentation updates
- Improved TypeScript coverage and type safety

---

## [Upcoming Versions]

### [1.1.0] - Planned
- Auto-update system
- Import/Export functionality
- Enhanced analytics dashboard
- Smart recommendation engine
- Notification system
- GitHub view fixes
- Comprehensive error handling

### [1.2.0] - Planned
- Achievement system
- Advanced filtering
- Watch progress tracking
- Custom categories

### [1.3.0] - Planned
- Cloud sync
- User accounts
- Social features

### [2.0.0] - Planned
- Movie streaming integration
- Mobile app companion
- Architecture overhaul

---

## 📋 Version Categories

### 🟢 Patch Releases (x.x.1)
- Bug fixes
- Small improvements
- Security patches

### 🟡 Minor Releases (x.1.0)
- New features
- Enhancements
- Backward compatible changes

### 🔴 Major Releases (1.0.0 → 2.0.0)
- Breaking changes
- Major new features
- Architecture changes

---

*For detailed planning and future features, see [ROADMAP.md](./ROADMAP.md)*
