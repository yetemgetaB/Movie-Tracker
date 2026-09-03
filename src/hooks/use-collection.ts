import { useSyncExternalStore, useMemo, useCallback } from "react";
import {
  CollectionItem,
  CollectionMovie,
  CollectionSeries,
  subscribeToCollection,
  getCollectionSnapshot,
  addToCollection as addAction,
  removeFromCollection as removeAction,
  updateCollectionItem as updateAction,
  isInCollection as isInAction,
} from "@/lib/collection";

export function useCollection() {
  const collection = useSyncExternalStore(
    subscribeToCollection,
    getCollectionSnapshot,
    getCollectionSnapshot
  );

  const movies = useMemo(
    () => collection.filter((item): item is CollectionMovie => item.type === "movie"),
    [collection]
  );

  const series = useMemo(
    () => collection.filter((item): item is CollectionSeries => item.type === "series"),
    [collection]
  );

  const isInCollection = useCallback(
    (id: number, type?: "movie" | "series") => isInAction(id, type),
    []
  );

  const addToCollection = useCallback(
    (item: CollectionItem) => addAction(item),
    []
  );

  const removeFromCollection = useCallback(
    (id: number, type?: "movie" | "series") => removeAction(id, type),
    []
  );

  const updateCollectionItem = useCallback(
    (id: number, updates: Partial<CollectionItem>, type?: "movie" | "series") =>
      updateAction(id, updates, type),
    []
  );

  return {
    collection,
    movies,
    series,
    totalCount: collection.length,
    movieCount: movies.length,
    seriesCount: series.length,
    isInCollection,
    addToCollection,
    removeFromCollection,
    updateCollectionItem,
  };
}
