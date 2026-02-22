import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileJson, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import DataManager from '@/lib/dataManager';

interface ImportExportButtonProps {
  className?: string;
}

const ImportExportButton: React.FC<ImportExportButtonProps> = ({ className }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastAction, setLastAction] = useState<'export' | 'import' | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const dataManager = DataManager.getInstance();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await dataManager.exportData();
      setLastAction('export');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await dataManager.importData();
      setLastAction('import');
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={className}>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Data Management</CardTitle>
              <CardDescription>
                Backup your movie data or import from other sources
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2"
              variant="outline"
            >
              {isExporting ? (
                <>
                  <Download className="h-4 w-4 animate-pulse" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Data
                </>
              )}
            </Button>

            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="flex items-center gap-2"
              variant="outline"
            >
              {isImporting ? (
                <>
                  <Upload className="h-4 w-4 animate-pulse" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Data
                </>
              )}
            </Button>
          </div>

          {lastAction && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-800 dark:text-green-200">
                {lastAction === 'export' ? 'Data exported successfully!' : 'Data imported successfully!'}
              </span>
            </div>
          )}

          {showDetails && (
            <>
              <Separator />
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    Export Formats
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">JSON</Badge>
                    <Badge variant="secondary">CSV</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Complete backup including movies, settings, and statistics
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Import Support
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">JSON</Badge>
                    <Badge variant="secondary">CSV</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Merge with existing data or replace completely
                  </p>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">Pro Tip:</p>
                    <p>Regularly export your data to prevent loss. JSON format preserves all data, while CSV is great for spreadsheet analysis.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportExportButton;
