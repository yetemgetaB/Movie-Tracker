import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, Plus, Trash2, Play, Clock, Star, Calendar, 
  Filter, Search, SortAsc, Film, Tv, AlertCircle
} from 'lucide-react';
import { img } from '@/lib/tmdb';
import WatchlistManager, { WatchlistItem } from '@/lib/watchlist';
import { toast } from '@/hooks/use-toast';

const WatchlistPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'series'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'priority' | 'year'>('date');
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesText, setNotesText] = useState('');

  const watchlistManager = WatchlistManager.getInstance();
  const watchlist = watchlistManager.getWatchlist();

  const filteredAndSortedWatchlist = useMemo(() => {
    let filtered = watchlist.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
      
      return matchesSearch && matchesType && matchesPriority;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'year':
          return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [watchlist, searchTerm, filterType, filterPriority, sortBy]);

  const stats = watchlistManager.getWatchlistStats();

  const handleMoveToCollection = (itemId: number) => {
    watchlistManager.moveToCollection(itemId);
    toast({
      title: 'Moved to Collection',
      description: 'Item has been moved to your main collection.',
    });
  };

  const handleRemoveFromWatchlist = (itemId: number) => {
    watchlistManager.removeFromWatchlist(itemId);
    toast({
      title: 'Removed from Watchlist',
      description: 'Item has been removed from your watchlist.',
    });
  };

  const handleUpdatePriority = (itemId: number, priority: 'low' | 'medium' | 'high') => {
    watchlistManager.updatePriority(itemId, priority);
    toast({
      title: 'Priority Updated',
      description: `Priority set to ${priority}.`,
    });
  };

  const handleUpdateNotes = (itemId: number) => {
    watchlistManager.updateNotes(itemId, notesText);
    setEditingNotes(null);
    setNotesText('');
    toast({
      title: 'Notes Updated',
      description: 'Your notes have been saved.',
    });
  };

  const startEditingNotes = (item: WatchlistItem) => {
    setEditingNotes(item.id);
    setNotesText(item.notes || '');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="px-6 pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <Clock className="text-primary" />
              Watchlist
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Movies and series you want to watch later
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/movies')}>
            Browse Movies
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 fade-up" style={{ animationDelay: '0.1s' }}>
        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-red-500">{stats.byPriority.high}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Movies</p>
                <p className="text-2xl font-bold">{stats.byType.movies}</p>
              </div>
              <Film className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Series</p>
                <p className="text-2xl font-bold">{stats.byType.series}</p>
              </div>
              <Tv className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-panel fade-up" style={{ animationDelay: '0.2s' }}>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search watchlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="movie">Movies</SelectItem>
                <SelectItem value="series">Series</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Added</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Watchlist Items */}
      <div className="space-y-4 fade-up" style={{ animationDelay: '0.3s' }}>
        {filteredAndSortedWatchlist.length === 0 ? (
          <Card className="glass-panel">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Your watchlist is empty</h3>
              <p className="text-muted-foreground mb-4">
                Start adding movies and series you want to watch later.
              </p>
              <Button onClick={() => navigate('/movies')}>
                <Plus className="h-4 w-4 mr-2" />
                Browse Movies
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedWatchlist.map((item) => (
            <Card key={item.id} className="glass-panel hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Poster */}
                  <div className="flex-shrink-0">
                    {item.poster ? (
                      <img
                        src={img(item.poster)}
                        alt={item.title}
                        className="w-20 h-28 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-muted rounded-lg flex items-center justify-center">
                        <Film className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{item.type}</span>
                          {item.year && <span>• {item.year}</span>}
                          {item.imdb && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {item.imdb}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityVariant(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      {editingNotes === item.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Add your notes..."
                            className="min-h-[60px]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateNotes(item.id)}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingNotes(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {item.notes ? (
                            <p className="text-sm text-muted-foreground bg-secondary/50 p-2 rounded">
                              {item.notes}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No notes</p>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditingNotes(item)}
                            className="mt-1 text-xs"
                          >
                            {item.notes ? 'Edit' : 'Add'} Notes
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Added {new Date(item.addedDate).toLocaleDateString()}
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={item.priority}
                          onValueChange={(value: any) => handleUpdatePriority(item.id, value)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          onClick={() => handleMoveToCollection(item.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Watch
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveFromWatchlist(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;
