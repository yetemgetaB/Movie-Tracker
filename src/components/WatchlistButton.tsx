import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Plus, Check, X } from 'lucide-react';
import WatchlistManager from '@/lib/watchlist';
import { CollectionItem } from '@/lib/collection';
import { toast } from '@/hooks/use-toast';

interface WatchlistButtonProps {
  item: CollectionItem;
  className?: string;
  compact?: boolean;
}

const WatchlistButton = ({ item, className = '', compact = false }: WatchlistButtonProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedList, setSelectedList] = useState('default');

  const watchlistManager = WatchlistManager.getInstance();
  const isInWatchlist = watchlistManager.isInWatchlist(item.id);
  const lists = watchlistManager.getCustomLists();

  const handleAddToWatchlist = () => {
    if (!isAdding) {
      setIsAdding(true);
      return;
    }

    try {
      watchlistManager.addToWatchlist(item, priority, undefined, selectedList);
      setIsAdding(false);
      toast({
        title: 'Added to Watchlist',
        description: `${item.title} has been added.`,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to add item.', variant: 'destructive' });
    }
  };

  const handleRemoveFromWatchlist = () => {
    try {
      watchlistManager.removeFromWatchlist(item.id);
      toast({ title: 'Removed', description: `${item.title} removed from watchlist.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to remove item.', variant: 'destructive' });
    }
  };

  if (isInWatchlist) {
    return (
      <Button
        variant="secondary"
        size={compact ? "sm" : "default"}
        onClick={handleRemoveFromWatchlist}
        className={`gap-2 ${className}`}
      >
        <Check size={16} className="text-primary" />
        {!compact && "In Watchlist"}
      </Button>
    );
  }

  if (isAdding) {
    return (
      <div className={`flex gap-2 items-center flex-wrap ${className}`}>
        <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">🔴 High</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="low">🟢 Low</SelectItem>
          </SelectContent>
        </Select>
        {lists.length > 1 && (
          <Select value={selectedList} onValueChange={setSelectedList}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="List" />
            </SelectTrigger>
            <SelectContent>
              {lists.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" onClick={handleAddToWatchlist} className="gap-1">
          <Check size={14} /> Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
          <X size={14} />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size={compact ? "sm" : "default"}
      onClick={handleAddToWatchlist}
      className={`gap-2 ${className}`}
    >
      <Clock size={16} />
      {!compact && "Add to Watchlist"}
    </Button>
  );
};

export default WatchlistButton;
