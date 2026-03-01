import { useState, useMemo } from "react";
import { CalendarDays, Film, Tv, Bell, BellOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { tmdbApi, tmdbSeriesApi, img, hasTmdbKey } from "@/lib/tmdb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const NOTIFY_KEY = "movie_tracker_calendar_notify";

function getNotified(): number[] {
  try { return JSON.parse(localStorage.getItem(NOTIFY_KEY) || "[]"); } catch { return []; }
}
function toggleNotify(id: number) {
  const list = getNotified();
  const updated = list.includes(id) ? list.filter(i => i !== id) : [...list, id];
  localStorage.setItem(NOTIFY_KEY, JSON.stringify(updated));
}

const CalendarPage = () => {
  const [notified, setNotified] = useState(() => getNotified());
  const hasKey = hasTmdbKey();

  const today = new Date();
  const startDate = today.toISOString().split("T")[0];
  const endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: upcomingMovies = [], isLoading: loadingMovies } = useQuery({
    queryKey: ["upcoming-movies-calendar"],
    queryFn: () => tmdbApi.upcoming(),
    enabled: hasKey,
    staleTime: 1000 * 60 * 30,
  });

  const { data: upcomingShows = [], isLoading: loadingSeries } = useQuery({
    queryKey: ["upcoming-shows-calendar"],
    queryFn: () => tmdbSeriesApi.airingToday(),
    enabled: hasKey,
    staleTime: 1000 * 60 * 30,
  });

  const handleNotify = (id: number) => {
    toggleNotify(id);
    setNotified(getNotified());
  };

  if (!hasKey) {
    return (
      <div className="px-6 pt-6 text-center space-y-3">
        <CalendarDays size={48} className="mx-auto text-muted-foreground/30" />
        <p className="text-muted-foreground">Add your TMDB API key in Settings to see upcoming releases.</p>
      </div>
    );
  }

  const UpcomingCard = ({ id, title, date, poster, type }: { id: number; title: string; date: string; poster: string | null; type: "movie" | "series" }) => (
    <div className="glass-panel p-3 flex gap-3 items-center">
      <img src={img(poster, "w185")} alt={title} className="w-12 h-17 object-cover rounded-md flex-shrink-0" style={{ height: "68px" }} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <CalendarDays size={10} /> {date || "TBA"}
        </p>
        <Badge variant="outline" className="text-[10px] mt-1">{type === "movie" ? "Movie" : "Series"}</Badge>
      </div>
      <button
        onClick={() => handleNotify(id)}
        className={`p-2 rounded-full transition-colors ${notified.includes(id) ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
      >
        {notified.includes(id) ? <Bell size={15} fill="currentColor" /> : <BellOff size={15} />}
      </button>
    </div>
  );

  return (
    <div className="px-4 pt-6 space-y-5 pb-4">
      <div className="px-2">
        <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays size={22} className="text-primary" /> Release Calendar</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Upcoming movies & shows</p>
      </div>

      {notified.length > 0 && (
        <div className="glass-panel p-3 mx-2 border border-primary/20">
          <p className="text-xs text-primary flex items-center gap-1.5"><Bell size={12} fill="currentColor" /> Tracking {notified.length} upcoming release{notified.length !== 1 ? "s" : ""}</p>
        </div>
      )}

      <Tabs defaultValue="movies" className="px-2">
        <TabsList className="w-full">
          <TabsTrigger value="movies" className="flex-1 gap-1.5"><Film size={13} /> Upcoming Movies</TabsTrigger>
          <TabsTrigger value="shows" className="flex-1 gap-1.5"><Tv size={13} /> Airing Today</TabsTrigger>
        </TabsList>

        <TabsContent value="movies" className="mt-4 space-y-2">
          {loadingMovies ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : upcomingMovies.length === 0 ? (
            <div className="glass-panel p-10 text-center"><p className="text-muted-foreground text-sm">No upcoming movies found</p></div>
          ) : (
            upcomingMovies.slice(0, 20).map(m => (
              <UpcomingCard key={m.id} id={m.id} title={m.title} date={m.release_date} poster={m.poster_path} type="movie" />
            ))
          )}
        </TabsContent>

        <TabsContent value="shows" className="mt-4 space-y-2">
          {loadingSeries ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : upcomingShows.length === 0 ? (
            <div className="glass-panel p-10 text-center"><p className="text-muted-foreground text-sm">No shows airing today</p></div>
          ) : (
            upcomingShows.slice(0, 20).map(s => (
              <UpcomingCard key={s.id} id={s.id} title={s.name} date={s.first_air_date} poster={s.poster_path} type="series" />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalendarPage;
