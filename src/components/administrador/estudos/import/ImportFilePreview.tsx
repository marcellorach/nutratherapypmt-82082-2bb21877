
import React from 'react';
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ImportFilePreviewProps {
  file: File;
  onRemove: () => void;
  index: number;
}

const ImportFilePreview: React.FC<ImportFilePreviewProps> = ({ file, onRemove, index }) => {
  const getFileTypeIcon = () => {
    return <FileText className="h-4 w-4 text-blue-500 mr-2" />;
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
  
  return (
    <div className="flex justify-between items-center py-2 group">
      <div className="flex items-center">
        {getFileTypeIcon()}
        <span className="text-sm truncate max-w-[300px]">{file.name}</span>
        <Badge variant="outline" className="ml-2 text-xs">
          {getFileTypeLabel()}
        </Badge>
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
