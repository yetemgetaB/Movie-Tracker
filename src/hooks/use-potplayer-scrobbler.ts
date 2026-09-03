import { useEffect, useRef, useState } from "react";
import { isTauri } from "@/lib/db";
import {
  getPotplayerStatusNative,
  parseFilename,
  type ParsedMediaItem,
} from "@/lib/mediaScanner";
import { addToCollection, isInCollection } from "@/lib/collection";

const LOCAL_ITEMS_CACHE_KEY = "movie_tracker_cached_local_media";

interface ActiveSession {
  filename: string;
  startedAt: number;
  item: ParsedMediaItem;
}

export function usePotplayerScrobbler() {
  const [completedMedia, setCompletedMedia] = useState<{
    item: ParsedMediaItem;
    nextItem?: ParsedMediaItem;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const activeSessionRef = useRef<ActiveSession | null>(null);

  useEffect(() => {
    if (!isTauri()) return;

    const findMatchingItem = (filename: string): ParsedMediaItem => {
      try {
        const cachedRaw = localStorage.getItem(LOCAL_ITEMS_CACHE_KEY);
        if (cachedRaw) {
          const items = JSON.parse(cachedRaw) as ParsedMediaItem[];
          const match = items.find(
            (i) =>
              i.rawFilename.toLowerCase() === filename.toLowerCase() ||
              filename.toLowerCase().includes(i.rawFilename.toLowerCase())
          );
          if (match) return match;
        }
      } catch {}

      return parseFilename("", filename, 0);
    };

    const findNextEpisode = (current: ParsedMediaItem): ParsedMediaItem | undefined => {
      if (current.type !== "series" || !current.season || !current.episode) return undefined;
      try {
        const cachedRaw = localStorage.getItem(LOCAL_ITEMS_CACHE_KEY);
        if (cachedRaw) {
          const items = JSON.parse(cachedRaw) as ParsedMediaItem[];
          const nextEp = items.find(
            (i) =>
              i.type === "series" &&
              i.title.toLowerCase() === current.title.toLowerCase() &&
              i.season === current.season &&
              i.episode === (current.episode || 0) + 1
          );
          return nextEp;
        }
      } catch {}
      return undefined;
    };

    const interval = setInterval(async () => {
      try {
        const status = await getPotplayerStatusNative();
        if (!status) return;

        const currentFilename = status.current_filename;

        // Case 1: PotPlayer is currently playing a video file
        if (status.is_running && currentFilename) {
          const active = activeSessionRef.current;

          // Started a new video file
          if (!active || active.filename !== currentFilename) {
            // If previous video was watched for at least 2 minutes, mark it as completed
            if (active && Date.now() - active.startedAt >= 2 * 60 * 1000) {
              const next = findNextEpisode(active.item);
              setCompletedMedia({ item: active.item, nextItem: next });
              setModalOpen(true);
            }

            // Start tracking the new video
            const parsed = findMatchingItem(currentFilename);
            activeSessionRef.current = {
              filename: currentFilename,
              startedAt: Date.now(),
              item: parsed,
            };

            // Log start date in collection
            const todayStr = new Date().toISOString().slice(0, 10);
            const itemId = parsed.tmdbMatch?.id || Date.now();
            if (!isInCollection(itemId, parsed.type)) {
              addToCollection({
                id: itemId,
                type: parsed.type,
                title: parsed.tmdbMatch?.title || parsed.title,
                poster: parsed.tmdbMatch?.poster || "",
                genre: "Local Media",
                year: String(parsed.year || new Date().getFullYear()),
                userRating: "",
                startDate: todayStr,
                finishDate: "",
                addedAt: new Date().toISOString(),
                notes: `Started in PotPlayer: ${currentFilename}`,
                director: "",
                stars: "",
                rated: "",
                imdb: "",
                rt: "",
              } as any);
            }
          }
        }
        // Case 2: PotPlayer closed or stopped
        else if (!status.is_running || !currentFilename) {
          const active = activeSessionRef.current;
          if (active) {
            // If watched for at least 2 minutes, trigger rating prompt
            if (Date.now() - active.startedAt >= 2 * 60 * 1000) {
              const next = findNextEpisode(active.item);
              setCompletedMedia({ item: active.item, nextItem: next });
              setModalOpen(true);
            }
            activeSessionRef.current = null;
          }
        }
      } catch (err) {
        console.error("PotPlayer scrobbler poll error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    completedMedia,
    modalOpen,
    setModalOpen,
  };
}
