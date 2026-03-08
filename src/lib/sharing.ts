// Social Sharing — Generate shareable cards/images

import { getCollection } from "./collection";
import { getAchievementStats } from "./achievements";

export interface ShareData {
  title: string;
  text: string;
  imageDataUrl?: string;
}

// Generate a shareable text summary
export function generateStatsText(): string {
  const stats = getAchievementStats();
  const collection = getCollection();
  const rated = collection.filter(
    (i) => i.userRating && i.userRating !== "—" && !isNaN(parseFloat(i.userRating))
  );
  const avgRating = rated.length
    ? (rated.reduce((s, i) => s + parseFloat(i.userRating), 0) / rated.length).toFixed(1)
    : "—";

  const topGenres = (() => {
    const counts: Record<string, number> = {};
    collection.forEach((item) => {
      (item.genre || "").split(",").forEach((g) => {
        const t = g.trim();
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
  })();

  return [
    "📊 My Movie Tracker Stats",
    `🎬 ${stats.totalMovies} Movies | 📺 ${stats.totalSeries} Series`,
    `⭐ Avg Rating: ${avgRating}/10`,
    `🎭 Top Genres: ${topGenres.join(", ") || "—"}`,
    `🏆 ${stats.totalRated} titles rated`,
    "",
    "— Movie Tracker App",
  ].join("\n");
}

// Generate a shareable card for a single movie/series
export function generateItemShareText(item: {
  title: string;
  year: string;
  userRating: string;
  genre: string;
  type: string;
}): string {
  const emoji = item.type === "movie" ? "🎬" : "📺";
  return [
    `${emoji} ${item.title} (${item.year})`,
    `⭐ My Rating: ${item.userRating}/10`,
    `🎭 ${item.genre}`,
    "",
    "— Movie Tracker App",
  ].join("\n");
}

// Generate shareable card as canvas image
export async function generateShareCard(
  title: string,
  subtitle: string,
  stats: { label: string; value: string }[],
  posterUrl?: string
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 600, 400);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(1, "#1e293b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 400);

  // Accent border
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 3;
  ctx.strokeRect(15, 15, 570, 370);

  // Title
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 28px 'Space Grotesk', sans-serif";
  ctx.fillText(title, 30, 60);

  // Subtitle
  ctx.fillStyle = "#94a3b8";
  ctx.font = "16px 'Inter', sans-serif";
  ctx.fillText(subtitle, 30, 90);

  // Divider
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 110);
  ctx.lineTo(570, 110);
  ctx.stroke();

  // Stats
  const startY = 140;
  stats.forEach((stat, i) => {
    const y = startY + i * 50;
    ctx.fillStyle = "#64748b";
    ctx.font = "13px 'Inter', sans-serif";
    ctx.fillText(stat.label, 30, y);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 22px 'Space Grotesk', sans-serif";
    ctx.fillText(stat.value, 30, y + 25);
  });

  // Branding
  ctx.fillStyle = "#475569";
  ctx.font = "12px 'Inter', sans-serif";
  ctx.fillText("Movie Tracker App", 30, 375);

  return canvas.toDataURL("image/png");
}

// Share using Web Share API with fallback
export async function shareContent(data: { title: string; text: string; url?: string }) {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch {
      // User cancelled or error
    }
  }
  // Fallback: copy to clipboard
  await navigator.clipboard.writeText(data.text);
  return false;
}

// Share image
export async function shareImage(dataUrl: string, title: string) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "movie-tracker-card.png", { type: "image/png" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      return true;
    }
  } catch {}

  // Fallback: download
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = "movie-tracker-card.png";
  a.click();
  return false;
}
