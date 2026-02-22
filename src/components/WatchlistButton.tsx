import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Plus, Check } from 'lucide-react';
import WatchlistManager from '@/lib/watchlist';
import { CollectionItem } from '@/lib/collection';
import { toast } from '@/hooks/use-toast';

interface WatchlistButtonProps {
  item: CollectionItem;
  className?: string;
}

const WatchlistButton = ({ item, className = '' }: WatchlistButtonProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  
  const watchlistManager = WatchlistManager.getInstance();
  const isInWatchlist = watchlistManager.isInWatchlist(item.id);

  const handleAddToWatchlist = () => {
    if (!isAdding) {
      setIsAdding(true);
      return;
    }

    try {
      watchlistManager.addToWatchlist(item, priority);
      setIsAdding(false);
      toast({
        title: 'Added to Watchlist',
        description: `${item.title} has been added to your watchlist.`,
      });
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to watchlist.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFromWatchlist = () => {
    try {
      watchlistManager.removeFromWatchlist(item.id);
      toast({
        title: 'Removed from Watchlist',
        description: `${item.title} has been removed from your watchlist.`,
      });
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from watchlist.',
        variant: 'destructive',
      });
    }
  };

  if (isInWatchlist) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleRemoveFromWatchlist}
        className={`bg-green-50 border-green-200 text-green-700 hover:bg-green-100 ${className}`}
      >
        <Check className="h-4 w-4 mr-2" />
        In Watchlist
      </Button>
    );
  }

  if (isAdding) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        
        <Button size="sm" onClick={handleAddToWatchlist} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
        
        <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsAdding(true)}
      className={`${className}`}
    >
      <Clock className="h-4 w-4 mr-2" />
      Watchlist
    </Button>
  );
};

export default WatchlistButton;
