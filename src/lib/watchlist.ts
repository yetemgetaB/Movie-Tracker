import { CollectionItem } from '@/lib/collection';

export interface WatchlistItem {
  id: number;
  type: "movie" | "series";
  title: string;
  poster: string;
  genre: string;
  year: string;
  seasons: number;
  episodes: number;
  director: string;
  stars: string;
  rated: string;
  imdb: string;
  rt: string;
  userRating: string;
  startDate: string;
  finishDate: string;
  status: string;
  nextSeason: string;
  addedAt: string;
  addedDate: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

export class WatchlistManager {
  private static instance: WatchlistManager;
  private readonly STORAGE_KEY = 'movie_tracker_watchlist';

  private constructor() {}

  static getInstance(): WatchlistManager {
    if (!WatchlistManager.instance) {
      WatchlistManager.instance = new WatchlistManager();
    }
    return WatchlistManager.instance;
  }

  getWatchlist(): WatchlistItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      return [];
    }
  }

  addToWatchlist(item: CollectionItem, priority: 'low' | 'medium' | 'high' = 'medium', notes?: string): void {
    const watchlist = this.getWatchlist();
    
    // Check if item already exists
    if (watchlist.some(watchlistItem => watchlistItem.id === item.id)) {
      return;
    }

    const watchlistItem: WatchlistItem = {
      ...item,
      addedDate: new Date().toISOString(),
      priority,
      notes
    };

    watchlist.push(watchlistItem);
    this.saveWatchlist(watchlist);
  }

  removeFromWatchlist(itemId: number): void {
    const watchlist = this.getWatchlist();
    const filtered = watchlist.filter(item => item.id !== itemId);
    this.saveWatchlist(filtered);
  }

  updatePriority(itemId: number, priority: 'low' | 'medium' | 'high'): void {
    const watchlist = this.getWatchlist();
    const item = watchlist.find(w => w.id === itemId);
    if (item) {
      item.priority = priority;
      this.saveWatchlist(watchlist);
    }
  }

  updateNotes(itemId: number, notes: string): void {
    const watchlist = this.getWatchlist();
    const item = watchlist.find(w => w.id === itemId);
    if (item) {
      item.notes = notes;
      this.saveWatchlist(watchlist);
    }
  }

  moveToCollection(itemId: number): void {
    const watchlist = this.getWatchlist();
    const item = watchlist.find(w => w.id === itemId);
    if (item) {
      // Remove from watchlist
      this.removeFromWatchlist(itemId);
      
      // Add to collection with current date
      const { addedDate, priority, notes, ...collectionItem } = item;
      const existingCollection = JSON.parse(localStorage.getItem('movie_tracker_collection') || '[]');
      
      const updatedItem = {
        ...collectionItem,
        addedAt: new Date().toISOString(),
        status: 'watching',
        startDate: new Date().toISOString().split('T')[0]
      };
      
      existingCollection.push(updatedItem);
      localStorage.setItem('movie_tracker_collection', JSON.stringify(existingCollection));
    }
  }

  isInWatchlist(itemId: number): boolean {
    const watchlist = this.getWatchlist();
    return watchlist.some(item => item.id === itemId);
  }

  getWatchlistStats() {
    const watchlist = this.getWatchlist();
    
    const byPriority = {
      high: watchlist.filter(item => item.priority === 'high').length,
      medium: watchlist.filter(item => item.priority === 'medium').length,
      low: watchlist.filter(item => item.priority === 'low').length
    };

    const byType = {
      movies: watchlist.filter(item => item.type === 'movie').length,
      series: watchlist.filter(item => item.type === 'series').length
    };

    const recentlyAdded = watchlist
      .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
      .slice(0, 5);

    return {
      total: watchlist.length,
      byPriority,
      byType,
      recentlyAdded
    };
  }

  private saveWatchlist(watchlist: WatchlistItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(watchlist));
    } catch (error) {
      console.error('Failed to save watchlist:', error);
    }
  }

  clearWatchlist(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export default WatchlistManager;
