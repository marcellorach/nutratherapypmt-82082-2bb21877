
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import FileIcon from "./FileIcon";
import { formatFileSize } from "@/utils/file-utils";

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
        <span className="flex-shrink-0">
          <FileIcon extension={ext} />
        </span>
        <span className="truncate max-w-xs" title={file.name}>
          {file.name}
        </span>
        <span className="pl-1 text-xs text-gray-500">
          {formatFileSize(file.size)}
        </span>
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
