import { useState } from "react";
import { Star, Play, CheckCircle, X, Film, Tv } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateCollectionItem, addToCollection, isInCollection } from "@/lib/collection";
import { launchMediaNative, type ParsedMediaItem } from "@/lib/mediaScanner";
import { toast } from "@/hooks/use-toast";

interface QuickRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaItem: ParsedMediaItem | null;
  nextEpisodeItem?: ParsedMediaItem | null;
}

export default function QuickRateModal({
  open,
  onOpenChange,
  mediaItem,
  nextEpisodeItem,
}: QuickRateModalProps) {
  const [selectedRating, setSelectedRating] = useState<number>(8);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  if (!mediaItem) return null;

  const title = mediaItem.tmdbMatch?.title || mediaItem.title;
  const poster = mediaItem.tmdbMatch?.poster;
  const isSeries = mediaItem.type === "series";
  const episodeLabel = isSeries && mediaItem.season && mediaItem.episode
    ? `S${String(mediaItem.season).padStart(2, "0")}E${String(mediaItem.episode).padStart(2, "0")}`
    : null;

  const handleSaveRating = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const itemId = mediaItem.tmdbMatch?.id || Date.now();

    if (isInCollection(itemId, mediaItem.type)) {
      updateCollectionItem(itemId, {
        userRating: String(selectedRating),
        finishDate: todayStr,
      }, mediaItem.type);
    } else {
      addToCollection({
        id: itemId,
        type: mediaItem.type,
        title,
        poster: poster || "",
        genre: "Local Media",
        year: String(mediaItem.year || new Date().getFullYear()),
        userRating: String(selectedRating),
        startDate: todayStr,
        finishDate: todayStr,
        addedAt: new Date().toISOString(),
        notes: `Local file: ${mediaItem.filePath}`,
        director: "",
        stars: "",
        rated: "",
        imdb: "",
        rt: "",
        status: "Completed",
      } as any);
    }

    toast({
      title: `Rated ${title} ★ ${selectedRating}/10`,
      description: "Marked as completed in your Vault.",
    });

    onOpenChange(false);
  };

  const handlePlayNext = async () => {
    if (!nextEpisodeItem) return;
    handleSaveRating();
    try {
      await launchMediaNative(nextEpisodeItem.filePath);
      toast({
        title: "Playing Next Episode",
        description: nextEpisodeItem.rawFilename,
      });
    } catch (err) {
      console.error("Failed to launch next episode:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card/95 backdrop-blur-xl border border-border shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Rate Playback</DialogTitle>
        </DialogHeader>

        <div className="relative p-6 flex gap-4 items-center">
          {/* Poster or Icon */}
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="w-20 h-28 object-cover rounded-lg shadow-md flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-28 rounded-lg bg-secondary/80 flex items-center justify-center flex-shrink-0">
              {isSeries ? <Tv size={32} className="text-muted-foreground/50" /> : <Film size={32} className="text-muted-foreground/50" />}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Just Finished Watching
            </span>
            <h3 className="text-base font-bold text-foreground truncate mt-0.5">{title}</h3>
            {episodeLabel && (
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                {episodeLabel} {mediaItem.rawFilename !== title ? `· ${mediaItem.rawFilename}` : ""}
              </p>
            )}

            {/* Rating Stars (1-10) */}
            <div className="mt-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, i) => {
                  const starVal = i + 1;
                  const isFilled = (hoverRating !== null ? hoverRating : selectedRating) >= starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setSelectedRating(starVal)}
                      className="p-0.5 transition-transform hover:scale-125 focus:outline-none"
                      title={`${starVal}/10`}
                    >
                      <Star
                        size={16}
                        className={isFilled ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>Rating: <strong className="text-foreground">{selectedRating} / 10</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-secondary/30 border-t border-border/50 flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground h-8"
          >
            Dismiss
          </Button>

          <Button
            size="sm"
            onClick={handleSaveRating}
            className="text-xs h-8 gap-1.5 rounded-lg"
          >
            <CheckCircle size={13} /> Save Rating
          </Button>

          {nextEpisodeItem && (
            <Button
              size="sm"
              variant="default"
              onClick={handlePlayNext}
              className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm"
            >
              <Play size={12} fill="currentColor" /> Play Next (E{String(nextEpisodeItem.episode).padStart(2, "0")})
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
