import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        // Focus search input
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          toast({
            title: 'Search',
            description: 'Navigate to home page to use search',
          });
        }
      },
      description: 'Focus search'
    },
    {
      key: ',',
      ctrlKey: true,
      action: () => navigate('/settings'),
      description: 'Open settings'
    },
    {
      key: 'h',
      ctrlKey: true,
      action: () => navigate('/'),
      description: 'Go home'
    },
    {
      key: 'l',
      ctrlKey: true,
      action: () => navigate('/library'),
      description: 'Go to library'
    },
    {
      key: 'w',
      ctrlKey: true,
      action: () => navigate('/watchlist'),
      description: 'Go to watchlist'
    },
    {
      key: 'a',
      ctrlKey: true,
      action: () => navigate('/analytics'),
      description: 'Go to analytics'
    },

    // Window shortcuts
    {
      key: 'F11',
      action: () => {
        toast({
          title: 'Fullscreen',
          description: 'Toggle fullscreen mode (window controls)',
        });
      },
      description: 'Toggle fullscreen'
    },
    {
      key: 'F1',
      action: () => {
        toast({
          title: 'Help',
          description: 'Ctrl+K: Search | Ctrl+,: Settings | Ctrl+H: Home | Ctrl+L: Library | Ctrl+W: Watchlist | Ctrl+A: Analytics',
        });
      },
      description: 'Show help'
    },

    // App shortcuts
    {
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        toast({
          title: 'Refresh',
          description: 'Refreshing app data...',
        });
        window.location.reload();
      },
      description: 'Hard refresh'
    },
    {
      key: '?',
      shiftKey: true,
      action: () => {
        const shortcutsList = shortcuts.map(s => {
          const keys = [];
          if (s.ctrlKey) keys.push('Ctrl');
          if (s.altKey) keys.push('Alt');
          if (s.shiftKey) keys.push('Shift');
          keys.push(s.key);
          return `${keys.join('+')}: ${s.description}`;
        }).join('\n');

        toast({
          title: 'Keyboard Shortcuts',
          description: shortcutsList,
          duration: 10000,
        });
      },
      description: 'Show all shortcuts'
    }
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey === event.ctrlKey;
        const altMatches = shortcut.altKey === event.altKey;
        const shiftMatches = shortcut.shiftKey === event.shiftKey;

        return keyMatches && ctrlMatches && altMatches && shiftMatches;
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  return shortcuts;
};
