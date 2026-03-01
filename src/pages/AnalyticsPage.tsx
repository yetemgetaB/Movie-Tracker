import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, RadarChart,
  Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import {
  BarChart3, Film, Tv, Star, Clock, Calendar, TrendingUp, Award, Target,
  Flame, CheckCircle, Download, Tag, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getCollection } from '@/lib/collection';
import { toast } from '@/hooks/use-toast';

const COLORS = [
  "hsl(var(--primary))", "hsl(260,70%,55%)", "hsl(340,70%,55%)",
  "hsl(45,90%,55%)", "hsl(160,70%,45%)", "hsl(20,85%,55%)", "hsl(280,60%,50%)"
];

const CustomTooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

const StatCard = ({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) => (
  <Card className="glass-panel border-border/30">
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

const AnalyticsPage = () => {
  const collection = useMemo(() => getCollection(), []);
  const movies = collection.filter(i => i.type === "movie");
  const series = collection.filter(i => i.type === "series");

  // ── Core Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const rated = collection.filter(i => i.userRating && i.userRating !== "—" && !isNaN(parseFloat(i.userRating)));
    const avgRating = rated.length ? rated.reduce((s, i) => s + parseFloat(i.userRating), 0) / rated.length : 0;
    const totalRuntime = movies.reduce((s, m) => s + (m.runtime || 90), 0);
    const completedSeries = series.filter(s => s.status === "Ended" || s.finishDate);
    const completionRate = series.length ? Math.round((completedSeries.length / series.length) * 100) : 0;
    return {
      totalMovies: movies.length, totalSeries: series.length,
      avgRating, totalRuntime, rated: rated.length, completionRate,
      completedSeries: completedSeries.length,
    };
  }, [collection]);

  // ── Genre data ──────────────────────────────────────────────────────────────
  const genreData = useMemo(() => {
    const counts: Record<string, number> = {};
    collection.forEach(item => {
      (item.genre || "").split(",").forEach(g => {
        const t = g.trim(); if (t) counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [collection]);

  // ── Rating distribution ─────────────────────────────────────────────────────
  const ratingDist = useMemo(() => {
    const buckets = Array(10).fill(0);
    collection.forEach(i => {
      if (i.userRating && i.userRating !== "—") {
        const r = Math.floor(parseFloat(i.userRating));
        if (r >= 1 && r <= 10) buckets[r - 1]++;
      }
    });
    return buckets.map((count, i) => ({ rating: `${i + 1}★`, count }));
  }, [collection]);

  // ── Monthly activity ────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const months: Record<string, { total: number; movies: number; series: number }> = {};
    collection.forEach(i => {
      if (i.addedAt) {
        const m = i.addedAt.slice(0, 7);
        if (!months[m]) months[m] = { total: 0, movies: 0, series: 0 };
        months[m].total++;
        if (i.type === "movie") months[m].movies++; else months[m].series++;
      }
    });
    return Object.entries(months).sort().slice(-12).map(([month, v]) => ({
      month: month.slice(5), ...v,
    }));
  }, [collection]);

  // ── Top directors ───────────────────────────────────────────────────────────
  const topDirectors = useMemo(() => {
    const dirs: Record<string, number> = {};
    collection.forEach(i => { if (i.director && i.director !== "—") dirs[i.director] = (dirs[i.director] || 0) + 1; });
    return Object.entries(dirs).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name: name.split(" ").slice(-1)[0], full: name, count }));
  }, [collection]);

  // ── Watching streak ─────────────────────────────────────────────────────────
  const streak = useMemo(() => {
    const days = new Set<string>();
    collection.forEach(i => { if (i.addedAt) days.add(i.addedAt.slice(0, 10)); });
    const sorted = [...days].sort();
    if (sorted.length === 0) return { current: 0, longest: 0 };
    let current = 1, longest = 1, temp = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]), curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { temp++; if (temp > longest) longest = temp; } else temp = 1;
    }
    // current streak from today
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    current = days.has(today) || days.has(yesterday) ? temp : 0;
    return { current, longest };
  }, [collection]);

  // ── Decade breakdown ────────────────────────────────────────────────────────
  const decadeData = useMemo(() => {
    const decades: Record<string, number> = {};
    collection.forEach(i => {
      if (i.year) {
        const d = Math.floor(parseInt(i.year) / 10) * 10;
        const key = `${d}s`;
        decades[key] = (decades[key] || 0) + 1;
      }
    });
    return Object.entries(decades).sort().map(([name, value]) => ({ name, value }));
  }, [collection]);

  // ── Mood tag distribution ───────────────────────────────────────────────────
  const moodData = useMemo(() => {
    const tags: Record<string, number> = {};
    collection.forEach(i => {
      (i.moodTags || []).forEach(t => { tags[t] = (tags[t] || 0) + 1; });
    });
    return Object.entries(tags).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [collection]);

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      stats: {
        totalMovies: stats.totalMovies,
        totalSeries: stats.totalSeries,
        hoursWatched: Math.round(stats.totalRuntime / 60),
        averageRating: stats.avgRating.toFixed(2),
        completionRate: `${stats.completionRate}%`,
        watchingStreak: `${streak.current} days (longest: ${streak.longest})`,
      },
      topGenres: genreData.slice(0, 5),
      topDirectors: topDirectors.slice(0, 5),
      decadeBreakdown: decadeData,
      allTitles: collection.map(i => ({
        title: i.title, type: i.type, year: i.year,
        rating: i.userRating, genre: i.genre, addedAt: i.addedAt,
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `movie-tracker-report-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report exported!" });
  };

  if (collection.length === 0) {
    return (
      <div className="px-6 pt-6 flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <BarChart3 size={48} className="text-muted-foreground/30" />
        <p className="text-muted-foreground text-center">Add movies and series to your vault to see analytics</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5 pb-4">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 size={22} className="text-primary" /> Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your complete viewing insights</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportReport} className="gap-1.5">
          <Download size={13} /> Export
        </Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 px-2">
        <StatCard icon={Film} label="Movies" value={stats.totalMovies} color="text-blue-400" />
        <StatCard icon={Tv} label="Series" value={stats.totalSeries} color="text-purple-400" />
        <StatCard icon={Star} label="Avg Rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"} sub={`${stats.rated} rated`} color="text-yellow-400" />
        <StatCard icon={Clock} label="Hours Watched" value={`${Math.round(stats.totalRuntime / 60)}h`} sub="movies only" color="text-green-400" />
        <StatCard icon={Flame} label="Current Streak" value={`${streak.current}d`} sub={`Best: ${streak.longest}d`} color="text-orange-400" />
        <StatCard icon={Target} label="Completion" value={`${stats.completionRate}%`} sub={`${stats.completedSeries}/${stats.totalSeries} series`} color="text-cyan-400" />
      </div>

      <Tabs defaultValue="genres" className="px-2">
        <TabsList className="w-full grid grid-cols-4 text-xs">
          <TabsTrigger value="genres">Genres</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="more">More</TabsTrigger>
        </TabsList>

        {/* Genres tab */}
        <TabsContent value="genres" className="mt-4 space-y-4">
          <Card className="glass-panel border-border/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Genre Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={genreData} cx="50%" cy="50%" outerRadius={90} innerRadius={35} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={10}>
                    {genreData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => [`${v} titles`]} contentStyle={CustomTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {topDirectors.length > 0 && (
            <Card className="glass-panel border-border/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Award size={14} className="text-primary" /> Top Directors</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={topDirectors} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={70} />
                    <Tooltip
                      formatter={(v, _, p) => [`${v} film${v === 1 ? "" : "s"}`, p.payload.full]}
                      contentStyle={CustomTooltipStyle}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {decadeData.length > 0 && (
            <Card className="glass-panel border-border/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar size={14} className="text-primary" /> Decade Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={decadeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <Tooltip formatter={v => [`${v} titles`]} contentStyle={CustomTooltipStyle} />
                    <Bar dataKey="value" fill="hsl(260,70%,55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Ratings tab */}
        <TabsContent value="ratings" className="mt-4 space-y-4">
          <Card className="glass-panel border-border/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm">My Rating Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ratingDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="rating" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip formatter={v => [`${v} titles`]} contentStyle={CustomTooltipStyle} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Series completion */}
          <Card className="glass-panel border-border/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle size={14} className="text-green-400" /> Series Completion</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-3 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-green-400 transition-all" style={{ width: `${stats.completionRate}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-green-400">{stats.completionRate}%</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <p className="text-lg font-bold text-green-400">{stats.completedSeries}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-lg font-bold">{stats.totalSeries - stats.completedSeries}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity tab */}
        <TabsContent value="activity" className="mt-4 space-y-4">
          <Card className="glass-panel border-border/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Activity</CardTitle></CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <Tooltip contentStyle={CustomTooltipStyle} />
                    <Bar dataKey="movies" name="Movies" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="series" name="Series" stackId="a" fill="hsl(260,70%,55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Not enough data yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Flame size={14} className="text-orange-400" /> Watching Streak</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-orange-500/10 text-center">
                <Flame size={20} className="text-orange-400 mx-auto mb-1" />
                <p className="text-2xl font-black text-orange-400">{streak.current}</p>
                <p className="text-xs text-muted-foreground">Current streak (days)</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary text-center">
                <TrendingUp size={20} className="text-primary mx-auto mb-1" />
                <p className="text-2xl font-black text-foreground">{streak.longest}</p>
                <p className="text-xs text-muted-foreground">Best streak (days)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* More tab */}
        <TabsContent value="more" className="mt-4 space-y-4">
          {moodData.length > 0 && (
            <Card className="glass-panel border-border/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Tag size={14} className="text-primary" /> Mood Tags</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {moodData.map(({ name, value }) => (
                  <div key={name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
                    <span className="text-sm text-foreground">{name}</span>
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">{value}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="glass-panel border-border/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap size={14} className="text-yellow-400" /> Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Most-watched genre", value: genreData[0]?.name || "—" },
                { label: "Most-watched decade", value: decadeData.sort((a, b) => b.value - a.value)[0]?.name || "—" },
                { label: "Total titles", value: collection.length },
                { label: "Movies rated", value: stats.rated },
                { label: "Days of content", value: `~${Math.round(stats.totalRuntime / 60 / 24)} days` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="font-semibold text-sm text-foreground">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
