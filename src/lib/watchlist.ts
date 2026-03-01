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
  listId?: string;
}

export interface CustomList {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  color?: string;
}

export class WatchlistManager {
  private static instance: WatchlistManager;
  private readonly STORAGE_KEY = 'movie_tracker_watchlist';
  private readonly LISTS_KEY = 'movie_tracker_custom_lists';

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
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  getCustomLists(): CustomList[] {
    try {
      const stored = localStorage.getItem(this.LISTS_KEY);
      if (!stored) return [{ id: 'default', name: 'My Watchlist', createdAt: new Date().toISOString() }];
      return JSON.parse(stored);
    } catch {
      return [{ id: 'default', name: 'My Watchlist', createdAt: new Date().toISOString() }];
    }
  }

  saveCustomLists(lists: CustomList[]): void {
    localStorage.setItem(this.LISTS_KEY, JSON.stringify(lists));
  }

  createList(name: string, description?: string, color?: string): CustomList {
    const lists = this.getCustomLists();
    const newList: CustomList = {
      id: Date.now().toString(),
      name,
      description,
      color,
      createdAt: new Date().toISOString(),
    };
    lists.push(newList);
    this.saveCustomLists(lists);
    return newList;
  }

  deleteList(listId: string): void {
    const lists = this.getCustomLists().filter(l => l.id !== listId);
    this.saveCustomLists(lists);
    // Remove items from deleted list
    const watchlist = this.getWatchlist().filter(i => i.listId !== listId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(watchlist));
  }

  renameList(listId: string, newName: string): void {
    const lists = this.getCustomLists().map(l =>
      l.id === listId ? { ...l, name: newName } : l
    );
    this.saveCustomLists(lists);
  }

  addToWatchlist(item: CollectionItem, priority: 'low' | 'medium' | 'high' = 'medium', notes?: string, listId = 'default'): void {
    const watchlist = this.getWatchlist();
    if (watchlist.some(w => w.id === item.id && w.listId === listId)) return;

    const watchlistItem: WatchlistItem = {
      ...item,
      addedDate: new Date().toISOString(),
      priority,
      notes,
      listId,
    };

    watchlist.push(watchlistItem);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(watchlist));
  }

  removeFromWatchlist(id: number, listId?: string): void {
    const watchlist = this.getWatchlist().filter(i => {
      if (listId) return !(i.id === id && i.listId === listId);
      return i.id !== id;
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(watchlist));
  }

  updatePriority(id: number, priority: 'low' | 'medium' | 'high'): void {
    const watchlist = this.getWatchlist().map(i =>
      i.id === id ? { ...i, priority } : i
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(watchlist));
  }

  updateNotes(id: number, notes: string): void {
    const watchlist = this.getWatchlist().map(i =>
      i.id === id ? { ...i, notes } : i
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(watchlist));
  }

  isInWatchlist(id: number): boolean {
    return this.getWatchlist().some(i => i.id === id);
  }

  reorderWatchlist(items: WatchlistItem[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }
}

export default WatchlistManager;
