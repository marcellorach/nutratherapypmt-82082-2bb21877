
import React from 'react';
import { Trash2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface StudyPdfFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  status: 'queued' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  file: File;
  nutraceuticalId?: string; // ID do nutracêutico associado
  conditionId?: string;    // ID da condição associada
}

interface PdfFileItemProps {
  file: StudyPdfFile;
  onRemove: (id: string) => void;
}

const formatSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const PdfFileItem: React.FC<PdfFileItemProps> = ({ file, onRemove }) => {
  return (
    <div className="border rounded-md p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(file.id)}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500 transition-colors" />
          <span className="sr-only">Remover</span>
        </Button>
      </div>
      
      {file.status === 'queued' && (
        <div className="text-xs text-gray-500">Aguardando processamento...</div>
      )}
      
      {file.status === 'uploading' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-600 font-medium">Enviando...</span>
            <span className="text-gray-500">{Number(file.uploadProgress).toFixed(0)}%</span>
          </div>
          <Progress value={Number(file.uploadProgress)} className="h-1.5" />
        </div>
      )}
      
      {file.status === 'success' && (
        <div className="text-xs text-green-600 font-medium">
          Upload concluído
        </div>
      )}
      
      {file.status === 'error' && (
        <div className="text-xs text-red-600 font-medium flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>{file.errorMessage || 'Erro no upload'}</span>
        </div>
      )}
    </div>
  );
};

export default PdfFileItem;
