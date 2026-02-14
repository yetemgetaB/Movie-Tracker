# Movie Tracker - Project Structure

## Overview
Clean Tauri-based Movie Tracker application with no Electron or cloud dependencies.

## Version
- **Current Version**: 0.1.2
- **Build Status**: ✅ Working

## Directory Structure

```
Movie Tracker Frontend/
├── src/                    # React application source
│   ├── components/         # UI components
│   ├── lib/               # Utility libraries
│   ├── pages/             # Page components
│   └── hooks/             # Custom React hooks
├── src-tauri/              # Tauri backend (Rust)
├── public/                 # Static assets
├── docs/                   # Documentation & data files
│   ├── movie-data.json    # Movies database
│   ├── series-data.json   # Series database
│   └── PROJECT_STRUCTURE.md
├── assets/                 # Project assets
│   ├── Hopstarter-Button-Button-Play.ico
│   └── Hopstarter-Button-Button-Play.256.png
├── archive/                # Archived files
└── dist/                   # Build output
```

## Key Features
- ✅ Local storage only (no cloud sync)
- ✅ Direct TMDB/OMDB API integration
- ✅ Tauri desktop application
- ✅ Clean UI with shadcn/ui components
- ✅ Movie & Series tracking
- ✅ Statistics and data management

## Removed Dependencies
- ❌ Electron & electron-builder
- ❌ Supabase cloud services
- ❌ Lovable integrations
- ❌ Cloud sync functionality

## Build Commands
```bash
# Development
npm run tauri:dev

# Build for production
npm run tauri:build

# Output files
# - MSI Installer: src-tauri/target/release/bundle/msi/
# - NSIS Installer: src-tauri/target/release/bundle/nsis/
# - Executable: src-tauri/target/release/movie-tracker.exe
```

## API Configuration
- TMDB API Key: Configured in settings (localStorage)
- OMDB API Key: Configured in settings (localStorage)
- Direct API calls (no proxy)

## Data Storage
- LocalStorage only
- JSON format for movies and series
- Export/Import functionality available
