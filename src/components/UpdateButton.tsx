import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Download, CheckCircle, AlertCircle, RefreshCw, 
  Calendar, ExternalLink, X 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
 
interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  body?: string;
  date?: string;
}
 
const UpdateButton = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
 
  const checkForUpdates = async () => {
    setIsChecking(true);
 
    try {
      // Simulate update check (replace with actual Tauri updater when available)
      await new Promise(resolve => setTimeout(resolve, 2000));
 
      // Mock update info for demonstration
      const mockUpdateInfo: UpdateInfo = {
        available: false, // Set to true to test update dialog
        currentVersion: '1.1.0',
        latestVersion: '1.1.0',
        body: '### What\'s Changed\n\n- Added watchlist functionality\n- Enhanced analytics dashboard\n- Improved import/export system\n- Bug fixes and performance improvements',
        date: new Date().toISOString()
      };
 
      setUpdateInfo(mockUpdateInfo);
 
      if (mockUpdateInfo.available) {
        setShowUpdateDialog(true);
        toast({
          title: 'Update Available',
          description: `Version ${mockUpdateInfo.latestVersion} is ready to install.`,
        });
      } else {
        toast({
          title: 'Up to Date',
          description: 'You\'re running the latest version.',
        });
      }
    } catch (error) {
      console.error('Update check failed:', error);
      toast({
        title: 'Update Check Failed',
        description: 'Unable to check for updates. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };
 
  const installUpdate = async () => {
    try {
      // Simulate update installation (replace with actual Tauri updater)
      await new Promise(resolve => setTimeout(resolve, 3000));
 
      toast({
        title: 'Update Installed',
        description: 'Update has been installed successfully. Restarting app...',
      });
 
      // Simulate app restart
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Update installation failed:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to install update. Please try again.',
        variant: 'destructive',
      });
    }
  };
 
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={checkForUpdates}
        disabled={isChecking}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
        {isChecking ? 'Checking...' : 'Check for Updates'}
      </Button>
 
      {/* Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="glass-panel-strong border-border/50 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Update Available
            </DialogTitle>
          </DialogHeader>
 
          {updateInfo && (
            <div className="space-y-6">
              {/* Version Info */}
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Current Version</p>
                  <p className="font-mono font-semibold">{updateInfo.currentVersion}</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">→</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Latest Version</p>
                  <p className="font-mono font-semibold text-green-600">{updateInfo.latestVersion}</p>
                </div>
              </div>
 
              {/* Update Status */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    A new version is available!
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Update to get the latest features and improvements.
                  </p>
                </div>
              </div>
 
              {/* Changelog */}
              {updateInfo.body && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    What's New
                  </h4>
                  <div className="bg-muted/50 p-4 rounded-lg max-h-60 overflow-y-auto">
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: updateInfo.body
                          .replace(/### (.+)/g, '<h3 class="font-semibold text-base mb-2">$1</h3>')
                          .replace(/^- (.+)/g, '<li class="ml-4 mb-1">• $1</li>')
                          .replace(/\n\n/g, '</ul><br/><ul>')
                          .replace(/^- (.+)/g, '<li class="ml-4 mb-1">• $1</li>')
                          .replace(/<li>/g, '<ul><li>')
                          .replace(/<\/li>/g, '</li></ul>')
                      }}
                    />
                  </div>
                </div>
              )}
 
              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={installUpdate}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install Update
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUpdateDialog(false)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Later
                </Button>
              </div>
 
              {/* Additional Info */}
              {updateInfo.date && (
                <div className="text-xs text-muted-foreground text-center">
                  Release date: {new Date(updateInfo.date).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
 
export default UpdateButton;
 