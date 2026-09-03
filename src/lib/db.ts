import Database from "@tauri-apps/plugin-sql";
import type { CollectionItem } from "./collection";

export const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database | null> {
  if (!isTauri()) return null;
  if (!dbInstance) {
    try {
      dbInstance = await Database.load("sqlite:movie_tracker.db");
    } catch (err) {
      console.error("Failed to load SQLite database:", err);
      return null;
    }
  }
  return dbInstance;
}

function backupLocalStorageData(): void {
  try {
    const col = localStorage.getItem("movie_tracker_collection");
    if (col && !localStorage.getItem("movie_tracker_pre_sqlite_backup_collection")) {
      localStorage.setItem("movie_tracker_pre_sqlite_backup_collection", col);
    }
    const wl = localStorage.getItem("movie_tracker_watchlist");
    if (wl && !localStorage.getItem("movie_tracker_pre_sqlite_backup_watchlist")) {
      localStorage.setItem("movie_tracker_pre_sqlite_backup_watchlist", wl);
    }
  } catch (err) {
    console.warn("Failed to create safety backup in localStorage:", err);
  }
}

async function migrateLocalStorageToSqlite(db: Database): Promise<void> {
  try {
    const metaRows = await db.select<{ key: string; value: string }[]>(
      "SELECT value FROM meta WHERE key = 'migrated_from_localstorage'"
    );
    if (metaRows.length > 0 && metaRows[0].value === "true") {
      return;
    }

    // Migrate collection
    const rawCollection = localStorage.getItem("movie_tracker_collection");
    if (rawCollection) {
      const items = JSON.parse(rawCollection);
      if (Array.isArray(items)) {
        for (const item of items) {
          if (!item || typeof item.id !== "number") continue;
          await db.execute(
            `INSERT OR REPLACE INTO collection (
              id, type, title, poster, genre, year, user_rating,
              start_date, finish_date, status, seasons, episodes,
              director, stars, rated, imdb, rt, next_season, added_at,
              notes, mood_tags, runtime
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
            [
              item.id,
              item.type || "movie",
              item.title || "",
              item.poster || "",
              item.genre || "",
              item.year || "",
              item.userRating || "",
              item.startDate || "",
              item.finishDate || "",
              item.status || "",
              item.seasons || 0,
              item.episodes || 0,
              item.director || "",
              item.stars || "",
              item.rated || "",
              item.imdb || "",
              item.rt || "",
              item.nextSeason || "",
              item.addedAt || new Date().toISOString(),
              item.notes || "",
              Array.isArray(item.moodTags) ? JSON.stringify(item.moodTags) : "",
              item.runtime || 0,
            ]
          );
        }
      }
    }

    // Migrate watchlist
    const rawWatchlist = localStorage.getItem("movie_tracker_watchlist");
    if (rawWatchlist) {
      const wItems = JSON.parse(rawWatchlist);
      if (Array.isArray(wItems)) {
        for (const w of wItems) {
          if (!w || typeof w.id !== "number") continue;
          await db.execute(
            `INSERT OR REPLACE INTO watchlist (
              id, type, title, poster, genre, year, priority, added_at, notes, list_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              w.id,
              w.type || "movie",
              w.title || "",
              w.poster || "",
              w.genre || "",
              w.year || "",
              w.priority || "medium",
              w.addedAt || w.addedDate || new Date().toISOString(),
              w.notes || "",
              w.listId || "default",
            ]
          );
        }
      }
    }

    await db.execute(
      "INSERT OR REPLACE INTO meta (key, value) VALUES ('migrated_from_localstorage', 'true')"
    );
  } catch (err) {
    console.error("Migration error from localStorage to SQLite:", err);
  }
}

export async function initDatabase(): Promise<void> {
  // Always create an immutable safety backup in localStorage
  backupLocalStorageData();

  if (!isTauri()) return;

  const db = await getDatabase();
  if (!db) return;

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS collection (
        id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        poster TEXT,
        genre TEXT,
        year TEXT,
        user_rating TEXT,
        start_date TEXT,
        finish_date TEXT,
        status TEXT,
        seasons INTEGER,
        episodes INTEGER,
        director TEXT,
        stars TEXT,
        rated TEXT,
        imdb TEXT,
        rt TEXT,
        next_season TEXT,
        added_at TEXT,
        notes TEXT,
        mood_tags TEXT,
        runtime INTEGER,
        PRIMARY KEY (id, type)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        poster TEXT,
        genre TEXT,
        year TEXT,
        priority TEXT,
        added_at TEXT,
        notes TEXT,
        list_id TEXT,
        PRIMARY KEY (id, type)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    await migrateLocalStorageToSqlite(db);
  } catch (err) {
    console.error("Failed to initialize SQLite tables:", err);
  }
}

export async function fetchCollectionFromDb(): Promise<CollectionItem[]> {
  const db = await getDatabase();
  if (!db) return [];
  try {
    const rows = await db.select<any[]>("SELECT * FROM collection ORDER BY added_at DESC");
    return rows.map((r) => {
      let parsedTags: string[] = [];
      try {
        if (r.mood_tags) parsedTags = JSON.parse(r.mood_tags);
      } catch {}

      return {
        id: r.id,
        type: r.type,
        title: r.title,
        poster: r.poster,
        genre: r.genre,
        year: r.year,
        userRating: r.user_rating,
        startDate: r.start_date,
        finishDate: r.finish_date,
        status: r.status,
        seasons: r.seasons,
        episodes: r.episodes,
        director: r.director,
        stars: r.stars,
        rated: r.rated,
        imdb: r.imdb,
        rt: r.rt,
        nextSeason: r.next_season,
        addedAt: r.added_at,
        notes: r.notes,
        moodTags: parsedTags,
        runtime: r.runtime,
      };
    }) as CollectionItem[];
  } catch (err) {
    console.error("Error fetching collection from DB:", err);
    return [];
  }
}

export async function dbSaveCollectionItem(item: CollectionItem): Promise<void> {
  const db = await getDatabase();
  if (!db) return;
  try {
    await db.execute(
      `INSERT OR REPLACE INTO collection (
        id, type, title, poster, genre, year, user_rating,
        start_date, finish_date, status, seasons, episodes,
        director, stars, rated, imdb, rt, next_season, added_at,
        notes, mood_tags, runtime
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
      [
        item.id,
        item.type,
        item.title,
        item.poster || "",
        item.genre || "",
        item.year || "",
        item.userRating || "",
        item.startDate || "",
        item.finishDate || "",
        (item as any).status || "",
        (item as any).seasons || 0,
        (item as any).episodes || 0,
        item.director || "",
        item.stars || "",
        item.rated || "",
        item.imdb || "",
        item.rt || "",
        (item as any).nextSeason || "",
        item.addedAt || new Date().toISOString(),
        item.notes || "",
        Array.isArray(item.moodTags) ? JSON.stringify(item.moodTags) : "",
        item.runtime || 0,
      ]
    );
  } catch (err) {
    console.error("Error saving collection item to DB:", err);
  }
}

export async function dbRemoveCollectionItem(id: number, type?: "movie" | "series"): Promise<void> {
  const db = await getDatabase();
  if (!db) return;
  try {
    if (type) {
      await db.execute("DELETE FROM collection WHERE id = $1 AND type = $2", [id, type]);
    } else {
      await db.execute("DELETE FROM collection WHERE id = $1", [id]);
    }
  } catch (err) {
    console.error("Error deleting collection item from DB:", err);
  }
}
