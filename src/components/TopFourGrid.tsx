import { useState, useMemo } from "react";
import { Grid2X2, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getCollection } from "@/lib/collection";
import { shareImage } from "@/lib/sharing";
import { toast } from "@/hooks/use-toast";

const TopFourGrid = () => {
  const collection = useMemo(() => getCollection(), []);
  const [selected, setSelected] = useState<number[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const generateGrid = async () => {
    const items = selected.map(id => collection.find(c => c.id === id)!).filter(Boolean);
    if (items.length < 4) {
      toast({ title: "Select 4 titles", description: "Pick 4 favorites to create your grid" });
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 680;
    const ctx = canvas.getContext("2d")!;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 600, 680);
    gradient.addColorStop(0, "#0a0e1a");
    gradient.addColorStop(1, "#1a1035");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 680);

    // Title
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "bold 22px 'Space Grotesk', sans-serif";
    ctx.fillText("🎬 My Top 4", 24, 40);

    // Load posters
    const posterSize = { w: 268, h: 402 };
    const gap = 12;
    const startX = (600 - (posterSize.w * 2 + gap)) / 2;
    const startY = 60;

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (posterSize.w + gap);
      const y = startY + row * (posterSize.h + gap);

      try {
        const imgEl = await loadImage(items[i].poster);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, posterSize.w, posterSize.h, 8);
        ctx.clip();
        ctx.drawImage(imgEl, x, y, posterSize.w, posterSize.h);
        ctx.restore();
      } catch {
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.roundRect(x, y, posterSize.w, posterSize.h, 8);
        ctx.fill();
        ctx.fillStyle = "#64748b";
        ctx.font = "12px 'Inter', sans-serif";
        ctx.fillText(items[i].title, x + 10, y + posterSize.h / 2);
      }
    }

    // Branding
    ctx.fillStyle = "#475569";
    ctx.font = "11px 'Inter', sans-serif";
    ctx.fillText("Movie Tracker App", 24, 660);

    setPreviewUrl(canvas.toDataURL("image/png"));
  };

  const handleShare = async () => {
    if (!previewUrl) return;
    const shared = await shareImage(previewUrl, "My Top 4");
    if (!shared) toast({ title: "Top 4 grid downloaded!" });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Grid2X2 size={13} /> Top 4 Grid
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Your Top 4</DialogTitle>
        </DialogHeader>

        {!previewUrl ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Select 4 favorites ({selected.length}/4)</p>
            <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
              {collection.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`relative rounded-lg overflow-hidden transition-all ${
                    selected.includes(item.id) ? "ring-2 ring-primary scale-95" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={item.poster} alt={item.title} className="w-full aspect-[2/3] object-cover" />
                  {selected.includes(item.id) && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {selected.indexOf(item.id) + 1}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <Button onClick={generateGrid} disabled={selected.length < 4} className="w-full">
              Generate Grid
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <img src={previewUrl} alt="Top 4 Grid" className="w-full rounded-lg" />
            <div className="flex gap-2">
              <Button onClick={() => setPreviewUrl(null)} variant="outline" className="flex-1 gap-1.5">
                <X size={14} /> Edit
              </Button>
              <Button onClick={handleShare} className="flex-1 gap-1.5">
                <Share2 size={14} /> Share / Download
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default TopFourGrid;
