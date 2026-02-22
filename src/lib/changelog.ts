export interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    added: string[];
    changed: string[];
    features: string[];
    technical: string[];
  };
}

export class ChangelogManager {
  private static instance: ChangelogManager;
  private changelog: ChangelogEntry[] = [];

  private constructor() {
    this.loadChangelog();
  }

  static getInstance(): ChangelogManager {
    if (!ChangelogManager.instance) {
      ChangelogManager.instance = new ChangelogManager();
    }
    return ChangelogManager.instance;
  }

  private loadChangelog() {
    // This would normally fetch from a changelog file or API
    // For now, we'll use the hardcoded changelog data
    this.changelog = [
      {
        version: "1.1.0",
        date: "2024-02-22",
        changes: {
          added: [
            "Watchlist functionality with priority levels and notes",
            "Analytics dashboard with detailed charts and statistics", 
            "Import/Export system supporting JSON and CSV formats",
            "Auto-update system with in-app changelog viewer",
            "Enhanced UI with professional update notifications",
            "UpdateNotification component for automatic update checks",
            "WatchlistButton component for easy watchlist management",
            "ImportExportButton for data backup and restore",
            "Enhanced navigation with watchlist and analytics pages"
          ],
          changed: [
            "Improved update system to automatically detect versions",
            "Enhanced .gitignore for comprehensive coverage",
            "Updated README.md with new features and documentation",
            "Optimized build configuration for production",
            "Enhanced Settings page with update management"
          ],
          features: [
            "📋 Watchlist - Add movies/series to personal watchlist with priorities",
            "📈 Analytics Dashboard - Detailed statistics with interactive charts",
            "📤 Import/Export - Backup and restore data in JSON/CSV formats", 
            "🔄 Auto-Update - Automatic update checking with changelog viewer",
            "🎨 Enhanced UI - Professional update notifications and dialogs"
          ],
          technical: [
            "Automatic version detection from changelog",
            "Enhanced error handling and user feedback",
            "Production-ready build optimizations",
            "Comprehensive documentation updates",
            "Improved TypeScript coverage and type safety"
          ]
        }
      },
      {
        version: "1.0.0",
        date: "2024-02-22",
        changes: {
          added: [
            "Initial release of Movie Tracker",
            "Movie and TV series search functionality",
            "Personal rating system",
            "Modern UI with React and Tauri",
            "Local storage for user data",
            "Basic statistics tracking",
            "Theme support (light/dark mode)",
            "Cross-platform support (Windows, macOS, Linux)"
          ],
          changed: [],
          features: [
            "🎬 Universal search across movies and TV series",
            "⭐ Personal ratings and tracking",
            "📱 Modern, responsive interface with smooth animations",
            "🚀 High performance with Rust backend",
            "💾 Lightweight application (~15MB)",
            "🔒 Local storage only (privacy-focused)",
            "📊 Basic viewing statistics",
            "🎨 Multiple themes and accent colors"
          ],
          technical: [
            "React 18.3.1 with TypeScript",
            "Tauri 2.10.1 for desktop framework",
            "Tailwind CSS for styling",
            "shadcn/ui component library",
            "Vite build system",
            "Vitest testing framework"
          ]
        }
      }
    ];
  }

  getLatestVersion(): ChangelogEntry | null {
    return this.changelog.length > 0 ? this.changelog[0] : null;
  }

  getVersionHistory(): ChangelogEntry[] {
    return this.changelog;
  }

  getChangelogForVersion(version: string): ChangelogEntry | null {
    return this.changelog.find(entry => entry.version === version) || null;
  }

  getChangesSinceVersion(currentVersion: string): ChangelogEntry | null {
    const currentIndex = this.changelog.findIndex(entry => entry.version === currentVersion);
    if (currentIndex === -1 || currentIndex === 0) {
      return null;
    }
    
    // Return the latest version (the one to update to)
    return this.changelog[0];
  }

  formatChangelogMarkdown(entry: ChangelogEntry): string {
    let markdown = `### What's Changed\n\n`;
    
    if (entry.changes.added.length > 0) {
      markdown += `#### Added\n${entry.changes.added.map(item => `- ${item}`).join('\n')}\n\n`;
    }
    
    if (entry.changes.changed.length > 0) {
      markdown += `#### Changed\n${entry.changes.changed.map(item => `- ${item}`).join('\n')}\n\n`;
    }
    
    if (entry.changes.features.length > 0) {
      markdown += `#### Features\n${entry.changes.features.map(item => `- ${item}`).join('\n')}\n\n`;
    }
    
    if (entry.changes.technical.length > 0) {
      markdown += `#### Technical\n${entry.changes.technical.map(item => `- ${item}`).join('\n')}\n\n`;
    }
    
    return markdown;
  }
}
