import React, { useState, useMemo } from 'react';
import { Clock, Plus, Trash2, Star, Calendar, Filter, Search, Film, Tv, Edit2, Check, X, FolderPlus, Share2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { img } from '@/lib/tmdb';
import WatchlistManager, { type WatchlistItem, type CustomList } from '@/lib/watchlist';
import { toast } from '@/hooks/use-toast';
import MovieDetailView from '@/components/MovieDetailView';
import SeriesDetailView from '@/components/SeriesDetailView';

const PRIORITY_CONFIG = {
  high: { label: "High", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  medium: { label: "Medium", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  low: { label: "Low", color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

const WatchlistPage = () => {
  const manager = WatchlistManager.getInstance();
  const [lists, setLists] = useState<CustomList[]>(() => manager.getCustomLists());
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => manager.getWatchlist());
  const [activeListId, setActiveListId] = useState("default");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "movie" | "series">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedItem, setSelectedItem] = useState<{ id: number; type: "movie" | "series" } | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  const reload = () => { setLists(manager.getCustomLists()); setWatchlist(manager.getWatchlist()); };

  const activeItems = useMemo(() => watchlist.filter(i => i.listId === activeListId || (!i.listId && activeListId === "default")), [watchlist, activeListId]);

  const filtered = useMemo(() => activeItems.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || i.type === filterType;
    const matchPriority = filterPriority === "all" || i.priority === filterPriority;
    return matchSearch && matchType && matchPriority;
  }).sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 };
    return pOrder[a.priority] - pOrder[b.priority];
  }), [activeItems, search, filterType, filterPriority]);

  const handleRemove = (item: WatchlistItem) => {
    manager.removeFromWatchlist(item.id, item.listId);
    reload();
    toast({ title: `${item.title} removed` });
  };

  const saveNotes = (item: WatchlistItem) => {
    manager.updateNotes(item.id, notesText);
    reload();
    setEditingNotes(null);
  };

  const createList = () => {
    if (!newListName.trim()) return;
    manager.createList(newListName.trim());
    reload();
    setNewListName("");
    setShowNewList(false);
    toast({ title: `List "${newListName}" created!` });
  };

  const shareList = () => {
    const titles = filtered.map(i => `${i.title} (${i.year})`).join("\n");
    navigator.clipboard.writeText(titles).then(() => toast({ title: "List copied to clipboard!" }));
  };

  if (selectedItem) {
    if (selectedItem.type === "movie") return <MovieDetailView movieId={selectedItem.id} onBack={() => setSelectedItem(null)} onSelectMovie={(id) => setSelectedItem({ id, type: "movie" })} />;
    return <SeriesDetailView seriesId={selectedItem.id} onBack={() => setSelectedItem(null)} onSelectSeries={(id) => setSelectedItem({ id, type: "series" })} />;
  }

  return (
    <div className="px-4 pt-6 space-y-5 pb-4">
      <div className="flex items-start justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Clock size={22} className="text-primary" /> Watchlist</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{watchlist.length} titles across {lists.length} list{lists.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowNewList(true)} className="gap-1.5">
          <FolderPlus size={14} /> New List
        </Button>
      </div>

      {/* Lists Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-2">
        {lists.map(l => (
          <button
            key={l.id}
            onClick={() => setActiveListId(l.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeListId === l.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
          >
            {l.name}
            <span className="ml-1 opacity-60">({watchlist.filter(i => (i.listId || "default") === l.id).length})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap px-2">
        <div className="relative flex-1 min-w-[140px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 bg-secondary/50 border-border/50 text-sm" />
        </div>
        <Select value={filterType} onValueChange={v => setFilterType(v as any)}>
          <SelectTrigger className="w-28 h-9 bg-secondary/50 border-border/50 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="movie">Movies</SelectItem>
            <SelectItem value="series">Series</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={v => setFilterPriority(v as any)}>
          <SelectTrigger className="w-28 h-9 bg-secondary/50 border-border/50 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">🔴 High</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="low">🟢 Low</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={shareList} className="h-9 gap-1.5">
          <Share2 size={13} /> Share
        </Button>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="glass-panel p-10 text-center mx-2">
          <Clock size={40} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No items in this list</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Add movies & series from their detail pages</p>
        </div>
      ) : (
        <div className="space-y-2 px-2">
          {filtered.map(item => (
            <div key={`${item.id}-${item.listId}`} className="glass-panel p-3 flex gap-3 group card-hover">
              <img
                src={img(item.poster)}
                alt={item.title}
                className="w-12 h-17 object-cover rounded-md flex-shrink-0 cursor-pointer"
                style={{ height: "68px" }}
                onClick={() => setSelectedItem({ id: item.id, type: item.type })}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium truncate cursor-pointer hover:text-primary transition-colors text-sm" onClick={() => setSelectedItem({ id: item.id, type: item.type })}>{item.title}</p>
                  <Select value={item.priority} onValueChange={v => { manager.updatePriority(item.id, v as any); reload(); }}>
                    <SelectTrigger className="w-24 h-6 text-[10px] border-0 bg-transparent p-0 gap-0.5 focus:ring-0">
                      <Badge variant="outline" className={`text-[10px] ${PRIORITY_CONFIG[item.priority].color}`}>{PRIORITY_CONFIG[item.priority].label}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">🔴 High</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="low">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                  {item.type === "movie" ? <Film size={10} /> : <Tv size={10} />}
                  <span>{item.year}</span>
                  {item.imdb && item.imdb !== "—" && <span>• IMDb {item.imdb}</span>}
                </div>

                {editingNotes === item.id ? (
                  <div className="mt-2 space-y-1.5">
                    <Textarea value={notesText} onChange={e => setNotesText(e.target.value)} className="bg-secondary/50 border-border/50 text-xs resize-none h-16" placeholder="Add notes..." />
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-6 text-xs px-2" onClick={() => saveNotes(item)}><Check size={10} /> Save</Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingNotes(null)}><X size={10} /></Button>
                    </div>
                  </div>
                ) : item.notes ? (
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 italic cursor-pointer" onClick={() => { setEditingNotes(item.id); setNotesText(item.notes || ""); }}>{item.notes}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingNotes(item.id); setNotesText(item.notes || ""); }} className="p-1.5 rounded hover:bg-secondary/80 transition-colors"><Edit2 size={12} /></button>
                <button onClick={() => handleRemove(item)} className="p-1.5 rounded hover:bg-destructive/20 text-destructive transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New List Dialog */}
      <Dialog open={showNewList} onOpenChange={setShowNewList}>
        <DialogContent className="glass-panel-strong border-border/50">
          <DialogHeader><DialogTitle>Create New List</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={newListName} onChange={e => setNewListName(e.target.value)} onKeyDown={e => e.key === "Enter" && createList()} placeholder="List name (e.g. Date Night, Classics...)" className="bg-secondary/50" />
            <div className="flex gap-2">
              <Button onClick={createList} className="flex-1">Create</Button>
              <Button variant="outline" onClick={() => setShowNewList(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WatchlistPage;
