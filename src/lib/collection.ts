// Collection store – localStorage only

export interface CollectionMovie {
  id: number;
  type: "movie";
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
  notes?: string;
  moodTags?: string[];
  runtime?: number;
}

export interface CollectionSeries {
  id: number;
  type: "series";
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
  notes?: string;
  moodTags?: string[];
  runtime?: number;
}

export type CollectionItem = CollectionMovie | CollectionSeries;

const STORAGE_KEY = "movie_tracker_collection";

function getLocalCollection(): CollectionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item =>
      item &&
      typeof item === 'object' &&
      typeof item.id === 'number' &&
      typeof item.type === 'string' &&
      ['movie', 'series'].includes(item.type)
    );
  } catch (error) {
    console.error('Error parsing collection:', error);
    return [];
  }
}

function saveLocalCollection(items: CollectionItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getCollection(): CollectionItem[] {
  return getLocalCollection();
}

export function addToCollection(item: CollectionItem): void {
  const items = getLocalCollection();
  const existing = items.findIndex(i => i.id === item.id && i.type === item.type);
  if (existing >= 0) {
    items[existing] = { ...items[existing], ...item };
  } else {
    items.push(item);
  }
  saveLocalCollection(items);
}

export function removeFromCollection(id: number): void {
  const items = getLocalCollection().filter(i => i.id !== id);
  saveLocalCollection(items);
}

export function updateCollectionItem(id: number, updates: Partial<CollectionItem>): void {
  const items = getLocalCollection().map(item =>
    item.id === id ? { ...item, ...updates } : item
  );
  saveLocalCollection(items);
}

export function isInCollection(id: number): boolean {
  return getLocalCollection().some(i => i.id === id);
}
