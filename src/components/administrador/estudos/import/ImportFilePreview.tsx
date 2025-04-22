
import React from 'react';
import { FileText, X, FileCode, FileImage, FileVideo, FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ImportFilePreviewProps {
  file: File;
  onRemove: () => void;
  index: number;
}

const ImportFilePreview: React.FC<ImportFilePreviewProps> = ({ file, onRemove, index }) => {
  const getFileTypeIcon = () => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'json':
      case 'bib':
        return <FileCode className="h-4 w-4 text-blue-500 mr-2" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500 mr-2" />;
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
        return <FileText className="h-4 w-4 text-blue-500 mr-2" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <FileImage className="h-4 w-4 text-green-500 mr-2" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <FileVideo className="h-4 w-4 text-purple-500 mr-2" />;
      case 'zip':
      case 'rar':
        return <FileArchive className="h-4 w-4 text-amber-500 mr-2" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500 mr-2" />;
    }
  };
  
  const getFileTypeLabel = () => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'bib':
        return 'BibTeX';
      case 'pdf':
        return 'PDF';
      case 'csv':
        return 'CSV';
      case 'json':
        return 'JSON';
      case 'doc':
        return 'DOC';
      case 'docx':
        return 'DOCX';
      case 'txt':
        return 'TXT';
      case 'rtf':
        return 'RTF';
      default:
        return extension?.toUpperCase() || 'Arquivo';
    }
  };

  const getFileSizeLabel = () => {
    const sizeInKB = file.size / 1024;
    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(1)} KB`;
    } else {
      return `${(sizeInKB / 1024).toFixed(2)} MB`;
    }
  };
  
  return (
    <div className="flex justify-between items-center py-2 px-3 group hover:bg-gray-50 rounded-md transition">
      <div className="flex items-center">
        {getFileTypeIcon()}
        <span className="text-sm truncate max-w-[300px]">{file.name}</span>
        <div className="flex items-center gap-2 ml-2">
          <Badge variant="outline" className="text-xs">
            {getFileTypeLabel()}
          </Badge>
          <span className="text-xs text-gray-500">{getFileSizeLabel()}</span>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onRemove} 
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remover</span>
      </Button>
    </div>
  );
};

export default ImportFilePreview;
