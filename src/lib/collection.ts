// Collection store – localStorage only

export interface CollectionMovie {
  id: number;
  type: "movie";
  title: string;
  poster: string;
  genre: string;
  year: string;
  seasons: number; // 0 for movies
  episodes: number; // 0 for movies
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
}

export type CollectionItem = CollectionMovie | CollectionSeries;

const STORAGE_KEY = "movie_tracker_collection";

// --- Local helpers ---
function getLocalCollection(): CollectionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Basic validation
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

// --- Public API (used by components) ---

export function getCollection(): CollectionItem[] {
  return getLocalCollection();
}

export function addToCollection(item: CollectionItem): void {
  const collection = getLocalCollection();
  const exists = collection.find((c) => c.id === item.id && c.type === item.type);
  if (exists) return;
  // Validate item structure
  if (!item.id || !item.type || !item.title || !item.addedAt) {
    console.error('Invalid item structure:', item);
    return;
  }
  collection.unshift(item);
  saveLocalCollection(collection);
}

export function removeFromCollection(id: number, type: "movie" | "series"): void {
  const collection = getLocalCollection().filter((c) => !(c.id === id && c.type === type));
  saveLocalCollection(collection);
}

export function updateCollectionItem(
  id: number,
  type: "movie" | "series",
  updates: Partial<CollectionItem>
): void {
  const collection = getLocalCollection();
  const idx = collection.findIndex((c) => c.id === id && c.type === type);
  if (idx === -1) return;
  collection[idx] = { ...collection[idx], ...updates } as CollectionItem;
  saveLocalCollection(collection);
}
