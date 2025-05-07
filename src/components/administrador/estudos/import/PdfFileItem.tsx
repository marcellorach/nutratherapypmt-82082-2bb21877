
import React from 'react';
import { Trash2, FileText, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface StudyPdfFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress?: number;
  status?: 'queued' | 'uploading' | 'error' | 'complete';
  errorMessage?: string;
  file: File;
  nutraceuticalId?: string;
  conditionId?: string;
}

interface PdfFileItemProps {
  file: StudyPdfFile;
  onRemove: (id: string) => void;
}

const PdfFileItem: React.FC<PdfFileItemProps> = ({ file, onRemove }) => {
  // Formatação do tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Determinando o status do arquivo
  const getStatusDisplay = () => {
    switch (file.status) {
      case 'queued':
        return 'Pronto para envio';
      case 'uploading':
        return `Enviando... ${file.uploadProgress?.toFixed(0)}%`;
      case 'error':
        return file.errorMessage || 'Erro no upload';
      case 'complete':
        return 'Enviado com sucesso';
      default:
        return 'Arquivo selecionado';
    }
  };

  // Renderiza o item do arquivo
  return (
    <div className="flex items-center justify-between border rounded-md p-2 bg-white">
      <div className="flex items-center space-x-3 flex-1">
        <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          
          {file.status === 'uploading' && (
            <div className="mt-1">
              <Progress value={file.uploadProgress || 0} className="h-1" />
            </div>
          )}
          
          <div className="flex items-center mt-1">
            {file.status === 'error' ? (
              <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
            ) : file.status === 'complete' ? (
              <Check className="h-3 w-3 text-green-500 mr-1" />
            ) : null}
            <p className="text-xs text-muted-foreground">
              {getStatusDisplay()}
            </p>
          </div>
        </div>
      </div>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onRemove(file.id)}
      >
        <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
        <span className="sr-only">Remover arquivo</span>
      </Button>
    </div>
  );
};

export default PdfFileItem;
