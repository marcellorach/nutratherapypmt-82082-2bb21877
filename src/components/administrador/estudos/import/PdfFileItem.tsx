
import React from 'react';
import { X, Trash2, AlertCircle, FileSpreadsheet, FileCheck, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface StudyPdfFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  status: 'queued' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  file: File;
}

interface PdfFileItemProps {
  file: StudyPdfFile;
  onRemove: (id: string) => void;
  canRemove?: boolean;
}

const PdfFileItem: React.FC<PdfFileItemProps> = ({ file, onRemove, canRemove = true }) => {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'queued':
        return <FileSpreadsheet className="h-4 w-4 text-blue-500" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <FileCheck className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileSpreadsheet className="h-4 w-4" />;
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-colors",
        file.status === 'error' ? "bg-red-50 border-red-200" : 
        file.status === 'success' ? "bg-green-50 border-green-200" : 
        "bg-blue-50 border-blue-100"
      )}
    >
      <div className="flex items-center space-x-3 flex-1">
        {getStatusIcon()}
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium truncate mr-2">{file.name}</p>
            {canRemove && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                onClick={() => onRemove(file.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="mt-1">
            {file.status === 'error' ? (
              <div className="flex items-center text-xs text-red-600">
                <span className="truncate">{file.errorMessage || 'Erro no upload'}</span>
              </div>
            ) : file.status === 'uploading' ? (
              <div className="w-full space-y-1">
                <Progress 
                  value={Number(file.uploadProgress) || 0} 
                  className="h-1" 
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatFileSize(file.size)}</span>
                  <span>{Number(file.uploadProgress).toFixed(0)}%</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
            )}
          </div>
        </div>
      </div>
      
      {file.status !== 'uploading' && canRemove && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
                onClick={() => onRemove(file.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remover arquivo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default PdfFileItem;
