import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Minus, Square, Maximize2, X, 
  Settings, HelpCircle, Info 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TitleBarProps {
  title?: string;
  version?: string;
  showControls?: boolean;
}

const TitleBar = ({ 
  title = "Movie Tracker", 
  version = "1.1.1",
  showControls = true 
}: TitleBarProps) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check window state on mount
    checkWindowState();
  }, []);

  const checkWindowState = async () => {
    try {
      // In a real Tauri app, you'd use Tauri API to check window state
      // For now, we'll simulate it
      const maximized = false; // await window.__TAURI__.window.getCurrent().isMaximized();
      setIsMaximized(maximized);
    } catch (error) {
      console.error('Failed to check window state:', error);
    }
  };

  const minimizeWindow = async () => {
    try {
      // await window.__TAURI__.window.getCurrent().minimize();
      toast({
        title: 'Window Minimized',
        description: 'Window minimized to taskbar',
      });
    } catch (error) {
      console.error('Failed to minimize window:', error);
      toast({
        title: 'Action Failed',
        description: 'Unable to minimize window',
        variant: 'destructive',
      });
    }
  };

  const maximizeWindow = async () => {
    try {
      if (isMaximized) {
        // await window.__TAURI__.window.getCurrent().unmaximize();
        setIsMaximized(false);
        toast({
          title: 'Window Restored',
          description: 'Window restored to normal size',
        });
      } else {
        // await window.__TAURI__.window.getCurrent().maximize();
        setIsMaximized(true);
        toast({
          title: 'Window Maximized',
          description: 'Window maximized to full screen',
        });
      }
    } catch (error) {
      console.error('Failed to toggle maximize:', error);
      toast({
        title: 'Action Failed',
        description: 'Unable to maximize/restore window',
        variant: 'destructive',
      });
    }
  };

  const closeWindow = async () => {
    try {
      // await window.__TAURI__.window.getCurrent().close();
      toast({
        title: 'Goodbye!',
        description: 'Thank you for using Movie Tracker',
      });
      // Simulate window close
      setTimeout(() => {
        window.close();
      }, 1000);
    } catch (error) {
      console.error('Failed to close window:', error);
      toast({
        title: 'Action Failed',
        description: 'Unable to close window',
        variant: 'destructive',
      });
    }
  };

  const showAbout = () => {
    toast({
      title: 'About Movie Tracker',
      description: `Version ${version} - Built with ❤️ using React and Tauri`,
    });
  };

  const showHelp = () => {
    toast({
      title: 'Help & Shortcuts',
      description: 'Ctrl+K: Search | Ctrl+,: Settings | F11: Fullscreen',
    });
  };

  return (
    <div className="flex items-center justify-between h-8 bg-background border-b border-border/50 px-2 select-none drag-region">
      {/* Title Section */}
      <div className="flex items-center gap-2 flex-1">
        <div className="flex items-center gap-2">
          {/* App Icon/Logo */}
          <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">M</span>
          </div>
          
          {/* App Title */}
          <span className="text-sm font-medium text-foreground">{title}</span>
          
          {/* Version Badge */}
          <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-mono">
            v{version}
          </span>
        </div>
      </div>

      {/* Center Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-muted/50"
          onClick={showHelp}
          title="Help (Ctrl+H)"
        >
          <HelpCircle className="h-3 w-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-muted/50"
          onClick={showAbout}
          title="About"
        >
          <Info className="h-3 w-3" />
        </Button>
      </div>

      {/* Window Controls */}
      {showControls && (
        <div className="flex items-center gap-0.5 no-drag">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-yellow-500/20 hover:text-yellow-600 rounded-none"
            onClick={minimizeWindow}
            title="Minimize"
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-green-500/20 hover:text-green-600 rounded-none"
            onClick={maximizeWindow}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Square className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-600 rounded-none"
            onClick={closeWindow}
            title="Close"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TitleBar;
