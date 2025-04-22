
import React from "react";
import { Button } from "@/components/ui/button";
import { X, FileText, FilePdf, FileWord, FileSpreadsheet, FileCode, File as FileGeneric } from "lucide-react";

// Função pra determinar ícone baseado na extensão
function getFileIcon(ext: string) {
  const extLower = ext.toLowerCase();
  if (["pdf"].includes(extLower)) return <FilePdf className="text-red-600" />;
  if (["doc", "docx", "rtf"].includes(extLower)) return <FileWord className="text-blue-700" />;
  if (["csv", "xls", "xlsx"].includes(extLower)) return <FileSpreadsheet className="text-green-600" />;
  if (["bib", "json"].includes(extLower)) return <FileCode className="text-purple-600" />;
  if (["txt"].includes(extLower)) return <FileText className="text-gray-500" />;
  return <FileGeneric className="text-gray-400" />;
}

// Formata o tamanho do arquivo em kb/mb
function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size/1024).toFixed(1)} KB`;
  return `${(size/1024/1024).toFixed(2)} MB`;
}

interface ImportFilePreviewProps {
  file: File;
  index: number;
  onRemove: () => void;
}

const ImportFilePreview: React.FC<ImportFilePreviewProps> = ({ file, onRemove }) => {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  return (
    <li className="flex items-center justify-between gap-3 p-2 border rounded-md bg-white shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0">{getFileIcon(ext)}</span>
        <span className="truncate max-w-xs" title={file.name}>{file.name}</span>
        <span className="pl-1 text-xs text-gray-500">{formatFileSize(file.size)}</span>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="ml-2 text-red-600 hover:text-red-700 flex-shrink-0"
        onClick={onRemove}
        aria-label="Remover arquivo"
        type="button"
      >
        <X className="h-5 w-5" />
      </Button>
    </li>
  );
};

export default ImportFilePreview;
