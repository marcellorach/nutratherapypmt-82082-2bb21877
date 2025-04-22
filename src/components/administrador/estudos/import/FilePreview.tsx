import React from "react";
import { Button } from "@/components/ui/button";
import { Database, X } from "lucide-react";

// Função para formatar o tamanho do arquivo
const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  else if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  else return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const sizeColor = (size: number): string => {
  if (size < 1024 * 50) return 'text-green-600';           // até 50KB verde
  if (size < 1024 * 200) return 'text-yellow-600';         // até 200KB amarelo
  if (size < 1024 * 1024) return 'text-orange-500';        // até 1MB laranja
  return 'text-red-600';                                   // acima, vermelho
};

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  label: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove, label }) => (
  <div className="flex justify-between items-center w-full">
    <div className="flex flex-col gap-2 max-w-[80%]">
      <div className="line-clamp-3 break-all font-normal" title={file.name}>
        {file.name}
      </div>
      <span className={`${sizeColor(file.size)} flex items-center text-xs font-medium gap-1`}>
        <Database className="h-4 w-4 flex-shrink-0" />
        {formatFileSize(file.size)}
      </span>
    </div>
    {onRemove && (
      <Button
        size="icon"
        variant="ghost"
        onClick={onRemove}
        aria-label={`Remover ${label}`}
        className="ml-2 text-red-600 hover:text-red-700 flex-shrink-0"
        type="button"
      >
        <X className="h-5 w-5" />
      </Button>
    )}
  </div>
);

export default FilePreview;
