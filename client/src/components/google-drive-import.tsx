import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CloudDownload, RefreshCw, AlertCircle, CheckCircle, FileText, Calendar, FileSpreadsheet } from "lucide-react";
import { getApiUrl } from "@/lib/config";

interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
  mimeType?: string;
}

interface DriveStatus {
  configured: boolean;
  hasAccess: boolean;
  message: string;
}

export default function GoogleDriveImport() {
  const [folderId, setFolderId] = useState("");
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check Google Drive configuration on component mount
  useEffect(() => {
    checkDriveStatus();
  }, []);

  const checkDriveStatus = async () => {
    try {
      const response = await fetch(getApiUrl('/api/google-drive/verify'));
      const status = await response.json();
      setDriveStatus(status);
    } catch (error) {
      console.error('Failed to check Google Drive status:', error);
      setDriveStatus({
        configured: false,
        hasAccess: false,
        message: "Failed to check Google Drive configuration"
      });
    }
  };

  const loadFiles = async () => {
    if (!folderId.trim()) {
      toast({
        title: "Missing Folder ID",
        description: "Please enter a Google Drive folder ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingFiles(true);
    try {
      const response = await fetch(getApiUrl(`/api/google-drive/files/${folderId}`));
      if (!response.ok) {
        throw new Error('Failed to load files');
      }
      const data = await response.json();
      setFiles(data);
      
      if (data.length === 0) {
        toast({
          title: "No Files Found",
          description: "No CSV or Excel files found in the specified folder",
        });
      } else {
        toast({
          title: "Files Loaded",
          description: `Found ${data.length} spreadsheet file(s)`,
        });
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      toast({
        title: "Error",
        description: "Failed to load files from Google Drive",
        variant: "destructive",
      });
    }
    setIsLoadingFiles(false);
  };

  const importFile = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(getApiUrl('/api/students/import-from-drive'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to import file');
      }

      const result = await response.json();
      
      // Invalidate students query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      toast({
        title: "Import Successful",
        description: `Imported ${result.count} students from ${fileName}`,
      });
      
    } catch (error) {
      console.error('Failed to import file:', error);
      toast({
        title: "Import Failed",
        description: `Failed to import ${fileName}`,
        variant: "destructive",
      });
    }
  };

  const importMutation = useMutation({
    mutationFn: ({ fileId, fileName }: { fileId: string; fileName: string }) => importFile(fileId, fileName),
  });

  const getFileIcon = (file: GoogleDriveFile) => {
    const isExcel = file.mimeType?.includes('spreadsheet') || file.mimeType?.includes('excel');
    return isExcel ? FileSpreadsheet : FileText;
  };

  const getFileTypeLabel = (file: GoogleDriveFile) => {
    const isExcel = file.mimeType?.includes('spreadsheet') || file.mimeType?.includes('excel');
    return isExcel ? 'Excel' : 'CSV';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatFileSize = (size?: string) => {
    if (!size) return '';
    const bytes = parseInt(size);
    return `${(bytes / 1024).toFixed(1)}KB`;
  };

  // Show setup instructions if not configured
  if (!driveStatus?.configured) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            Setup Required
          </CardTitle>
          <CardDescription className="text-xs">
            Configure Google Drive integration
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-xs">
            <p className="text-muted-foreground">
              See GOOGLE_DRIVE_SETUP.md for instructions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!driveStatus.hasAccess) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Access Failed
          </CardTitle>
          <CardDescription className="text-xs">
            {driveStatus.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button onClick={checkDriveStatus} variant="outline" size="sm" className="h-7 text-xs">
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CloudDownload className="w-4 h-4" />
          Google Drive Import
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          Import CSV/Excel files from Drive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Google Drive Status - Compact */}
        {driveStatus && (
          <div className={`p-2 rounded-md border text-xs ${
            driveStatus.configured && driveStatus.hasAccess
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-1.5">
              {driveStatus.configured && driveStatus.hasAccess ? (
                <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
              )}
              <span className={`font-medium truncate ${
                driveStatus.configured && driveStatus.hasAccess
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {driveStatus.configured && driveStatus.hasAccess ? 'Connected' : 'Setup Required'}
              </span>
            </div>
          </div>
        )}

        {/* Folder ID Input - Compact */}
        <div className="space-y-1.5">
          <Label htmlFor="folderId" className="text-xs font-medium">
            Drive Folder ID
          </Label>
          <Input
            id="folderId"
            type="text"
            placeholder="Folder ID from Drive URL"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full text-xs h-8"
          />
          <p className="text-xs text-muted-foreground leading-tight">
            Copy ID from Drive URL after '/folders/'
          </p>
        </div>

        {/* Load Files Button - Compact */}
        <Button 
          onClick={loadFiles} 
          disabled={!folderId.trim() || isLoadingFiles || !(driveStatus?.configured && driveStatus?.hasAccess)}
          className="w-full h-8 text-xs"
          size="sm"
        >
          {isLoadingFiles ? (
            <>
              <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="w-3 h-3 mr-1.5" />
              Load Files
            </>
          )}
        </Button>

        {/* Files List - Optimized for narrow space */}
        {files.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground">Files ({files.length})</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {files.map((file) => {
                  const isExcel = file.mimeType?.includes('spreadsheet') || file.mimeType?.includes('excel');
                  const fileType = isExcel ? 'XLS' : 'CSV';
                  const fileIcon = isExcel ? FileSpreadsheet : FileText;
                  const IconComponent = fileIcon;
                  
                  return (
                    <div key={file.id} className="border rounded-md p-2 hover:bg-muted/50 space-y-1.5">
                      {/* File header with icon and type */}
                      <div className="flex items-center gap-1.5">
                        <IconComponent className={`w-3 h-3 flex-shrink-0 ${
                          isExcel ? 'text-green-600' : 'text-blue-600'
                        }`} />
                        <Badge variant="secondary" className={`text-xs px-1 py-0 h-4 ${
                          isExcel ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {fileType}
                        </Badge>
                      </div>
                      
                      {/* File name - truncated */}
                      <p className="text-xs font-medium truncate leading-tight" title={file.name}>
                        {file.name}
                      </p>
                      
                      {/* File details and import button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-2.5 h-2.5" />
                          <span className="truncate">
                            {formatDate(file.modifiedTime)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => importFile(file.id, file.name)}
                          disabled={importMutation.isPending}
                          className="h-6 px-2 text-xs"
                        >
                          {importMutation.isPending ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <CloudDownload className="w-3 h-3 mr-1" />
                              Import
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
