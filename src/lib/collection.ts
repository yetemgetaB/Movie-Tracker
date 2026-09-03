// Collection store – localStorage & SQLite with reactive listeners & in-memory cache
import { isTauri, fetchCollectionFromDb, dbSaveCollectionItem, dbRemoveCollectionItem } from "./db";

export interface BaseCollectionItem {
  id: number;
  type: "movie" | "series";
  title: string;
  poster: string;
  genre: string;
  year: string;
  userRating: string;
  startDate: string;
  finishDate: string;
  addedAt: string;
  notes?: string;
  moodTags?: string[];
  runtime?: number;
  director?: string;
  stars?: string;
  rated?: string;
  imdb?: string;
  rt?: string;
}

export interface CollectionMovie extends BaseCollectionItem {
  type: "movie";
  director: string;
  stars: string;
  rated: string;
  imdb: string;
  rt: string;
}

export interface CollectionSeries extends BaseCollectionItem {
  type: "series";
  seasons: number;
  episodes: number;
  director: string;
  stars: string;
  rated: string;
  imdb: string;
  rt: string;
  status: string;
  nextSeason: string;
}

export type CollectionItem = CollectionMovie | CollectionSeries;

const STORAGE_KEY = "movie_tracker_collection";

let collectionCache: CollectionItem[] | null = null;
const listeners = new Set<() => void>();

export function subscribeToCollection(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (err) {
      console.error("Error in collection listener:", err);
    }
  });
}

function getLocalCollection(): CollectionItem[] {
  if (collectionCache) return collectionCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      collectionCache = [];
      return collectionCache;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      collectionCache = [];
      return collectionCache;
    }
    collectionCache = parsed.filter(item =>
      item &&
      typeof item === 'object' &&
      typeof item.id === 'number' &&
      typeof item.type === 'string' &&
      ['movie', 'series'].includes(item.type)
    );
    return collectionCache;
  } catch (error) {
    console.error('Error parsing collection:', error);
    collectionCache = [];
    return collectionCache;
  }
}

function saveLocalCollection(items: CollectionItem[]): void {
  collectionCache = items;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  notifyListeners();
}

export function getCollection(): CollectionItem[] {
  return getLocalCollection();
}

export function getCollectionSnapshot(): CollectionItem[] {
  return getLocalCollection();
}

export function invalidateCollectionCache(): void {
  collectionCache = null;
  notifyListeners();
}

export async function syncCollectionFromSqlite(): Promise<void> {
  if (!isTauri()) return;
  const dbItems = await fetchCollectionFromDb();
  if (dbItems.length > 0) {
    collectionCache = dbItems;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dbItems));
    notifyListeners();
  }
}

export function addToCollection(item: CollectionItem): void {
  const items = [...getLocalCollection()];
  const existing = items.findIndex(i => i.id === item.id && i.type === item.type);
  if (existing >= 0) {
    items[existing] = { ...items[existing], ...item } as CollectionItem;
  } else {
    items.push(item);
  }
  saveLocalCollection(items);
  if (isTauri()) {
    dbSaveCollectionItem(item).catch(err => console.error("SQLite save error:", err));
  }
}

export function removeFromCollection(id: number, type?: "movie" | "series"): void {
  const items = getLocalCollection().filter(i =>
    type ? !(i.id === id && i.type === type) : i.id !== id
  );
  saveLocalCollection(items);
  if (isTauri()) {
    dbRemoveCollectionItem(id, type).catch(err => console.error("SQLite remove error:", err));
  }
}

export function updateCollectionItem(id: number, updates: Partial<CollectionItem>, type?: "movie" | "series"): void {
  let updatedItem: CollectionItem | undefined;
  const items = getLocalCollection().map(item => {
    if (item.id === id && (type ? item.type === type : true)) {
      updatedItem = { ...item, ...updates } as CollectionItem;
      return updatedItem;
    }
    return item;
  });
  saveLocalCollection(items);
  if (isTauri() && updatedItem) {
    dbSaveCollectionItem(updatedItem).catch(err => console.error("SQLite update error:", err));
  }
}

export function isInCollection(id: number, type?: "movie" | "series"): boolean {
  return getLocalCollection().some(i => i.id === id && (type ? i.type === type : true));
}
