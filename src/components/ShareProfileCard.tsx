import { useState } from "react";
import { Share2, Download, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getCollection } from "@/lib/collection";
import { getAchievementStats } from "@/lib/achievements";
import { shareImage } from "@/lib/sharing";
import { toast } from "@/hooks/use-toast";

function generateProfileCardCanvas(): Promise<string> {
  const collection = getCollection();
  const stats = getAchievementStats();
  const movies = collection.filter(i => i.type === "movie");
  const series = collection.filter(i => i.type === "series");
  const rated = collection.filter(i => i.userRating && i.userRating !== "—" && !isNaN(parseFloat(i.userRating)));
  const avgRating = rated.length ? (rated.reduce((s, i) => s + parseFloat(i.userRating), 0) / rated.length).toFixed(1) : "—";
  
  const genreCounts: Record<string, number> = {};
  collection.forEach(item => {
    (item.genre || "").split(",").forEach(g => {
      const t = g.trim();
      if (t) genreCounts[t] = (genreCounts[t] || 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);

  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 360;
  const ctx = canvas.getContext("2d")!;

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 600, 360);
  gradient.addColorStop(0, "#0a0e1a");
  gradient.addColorStop(0.5, "#0f172a");
  gradient.addColorStop(1, "#1a1035");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 360);

  // Accent line
  const accentGrad = ctx.createLinearGradient(0, 0, 600, 0);
  accentGrad.addColorStop(0, "#3b82f6");
  accentGrad.addColorStop(1, "#8b5cf6");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, 600, 4);

  // Title
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "bold 26px 'Space Grotesk', sans-serif";
  ctx.fillText("🎬 My Movie Profile", 30, 50);

  // Stats grid
  const statsGrid = [
    { label: "Movies", value: String(movies.length), color: "#3b82f6" },
    { label: "Series", value: String(series.length), color: "#8b5cf6" },
    { label: "Avg Rating", value: `${avgRating}/10`, color: "#eab308" },
    { label: "Titles Rated", value: String(rated.length), color: "#22c55e" },
  ];

  statsGrid.forEach((s, i) => {
    const x = 30 + i * 140;
    const y = 80;
    ctx.fillStyle = s.color + "20";
    ctx.beginPath();
    ctx.roundRect(x, y, 120, 70, 8);
    ctx.fill();
    ctx.fillStyle = s.color;
    ctx.font = "bold 28px 'Space Grotesk', sans-serif";
    ctx.fillText(s.value, x + 12, y + 38);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px 'Inter', sans-serif";
    ctx.fillText(s.label, x + 12, y + 56);
  });

  // Top genres
  ctx.fillStyle = "#94a3b8";
  ctx.font = "13px 'Inter', sans-serif";
  ctx.fillText("Top Genres", 30, 190);
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "bold 16px 'Space Grotesk', sans-serif";
  ctx.fillText(topGenres.join("  •  ") || "—", 30, 215);

  // Stats summary
  const totalRuntime = movies.reduce((s, m) => s + ((m as any).runtime || 90), 0);
  ctx.fillStyle = "#64748b";
  ctx.font = "13px 'Inter', sans-serif";
  ctx.fillText(`⏱ ${Math.round(totalRuntime / 60)}h watched  •  🏆 ${stats.totalRated} rated  •  📊 ${collection.length} total`, 30, 260);

  // Divider
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 290);
  ctx.lineTo(570, 290);
  ctx.stroke();

  // Branding
  ctx.fillStyle = "#475569";
  ctx.font = "11px 'Inter', sans-serif";
  ctx.fillText("Movie Tracker App  •  movietracker.app", 30, 330);

  return Promise.resolve(canvas.toDataURL("image/png"));
}

const ShareProfileCard = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    const url = await generateProfileCardCanvas();
    setPreviewUrl(url);
  };

  const handleShare = async () => {
    if (!previewUrl) return;
    const shared = await shareImage(previewUrl, "My Movie Tracker Profile");
    if (!shared) toast({ title: "Profile card downloaded!" });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" onClick={handleGenerate} className="gap-1.5">
          <Image size={13} /> Profile Card
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Your Profile Card</DialogTitle>
        </DialogHeader>
        {previewUrl && (
          <div className="space-y-3">
            <img src={previewUrl} alt="Profile Card" className="w-full rounded-lg" />
            <Button onClick={handleShare} className="w-full gap-2">
              <Share2 size={14} /> Share / Download
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareProfileCard;
