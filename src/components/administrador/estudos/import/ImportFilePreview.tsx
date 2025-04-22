
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ImportFilePreviewProps {
  file: File;
  index: number;
  onRemove: () => void;
}

const ImportFilePreview: React.FC<ImportFilePreviewProps> = ({ file, onRemove }) => (
  <li className="flex items-center justify-between gap-2 p-2 border rounded-md bg-white shadow-sm">
    <span className="truncate max-w-xs">{file.name}</span>
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

export default ImportFilePreview;
