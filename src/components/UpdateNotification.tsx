import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download, X, RefreshCw, ExternalLink } from 'lucide-react';
import AppUpdater from '@/lib/updater';

interface UpdateNotificationProps {
  onClose?: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onClose }) => {
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  const updater = AppUpdater.getInstance();

  useEffect(() => {
    const info = updater.getUpdateInfo();
    if (info?.available) {
      setUpdateInfo(info);
    }
  }, []);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await updater.checkForUpdates();
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowChangelog = async () => {
    await updater.showChangelog();
  };

  if (!updateInfo?.available) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-lg border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-500">
              Update Available
            </Badge>
            <Download className="h-4 w-4 text-green-500" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle className="text-lg">
          Movie Tracker v{updateInfo.latestVersion}
        </CardTitle>
        <CardDescription>
          A new version is available! You're currently using v{updateInfo.currentVersion}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        {updateInfo.body && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">What's New</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangelog(!showChangelog)}
                className="h-6 text-xs"
              >
                {showChangelog ? 'Hide' : 'Show'} Details
              </Button>
            </div>
            
            {showChangelog && (
              <ScrollArea className="h-32 w-full rounded-md border p-3">
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {updateInfo.body}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="pt-3">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShowChangelog}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Changelog
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Update Now
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default UpdateNotification;
