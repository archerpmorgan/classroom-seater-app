import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Download } from "lucide-react";
import { getApiUrl } from "@/lib/config";

export default function UploadArea() {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(getApiUrl('/api/students/upload-csv'), {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Success",
        description: data.message,
      });
      
      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Warning",
          description: `${data.errors.length} rows had errors. Check console for details.`,
          variant: "destructive",
        });
        console.warn("CSV import errors:", data.errors);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const downloadCSVTemplate = () => {
    const templateData = [
      {
        name: "Alex Chen",
        primaryLanguage: "English",
        skillLevel: "intermediate",
        secondaryLanguages: "Spanish",
        worksWellWith: "Maria Rodriguez",
        avoidPairing: "John Smith",
        notes: "Needs extra support with complex problems"
      },
      {
        name: "Maria Rodriguez", 
        primaryLanguage: "Spanish",
        skillLevel: "beginner",
        secondaryLanguages: "English",
        worksWellWith: "Alex Chen",
        avoidPairing: "",
        notes: "Very engaged in group activities"
      },
      {
        name: "John Smith",
        primaryLanguage: "English", 
        skillLevel: "advanced",
        secondaryLanguages: "",
        worksWellWith: "",
        avoidPairing: "Alex Chen",
        notes: "Can help other students"
      }
    ];

    // Convert to CSV
    const headers = Object.keys(templateData[0]);
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row] || '';
          // Wrap in quotes if contains comma
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_data_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template saved to your downloads folder",
    });
  };

  return (
    <div>
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleBrowseClick}
        data-testid="upload-area"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
          data-testid="file-input"
        />
        
        <FileUp className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        
        {uploadMutation.isPending ? (
          <div>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground">
              Drop your CSV file here or{' '}
              <span className="text-primary underline">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports: .csv files
            </p>
          </div>
        )}
      </div>
      
      {/* CSV Template Download */}
      <div className="mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={downloadCSVTemplate}
          data-testid="download-template-button"
        >
          <Download className="w-4 h-4 mr-2" />
          Download CSV Template
        </Button>
      </div>
    </div>
  );
}
