
import { File, FileText, FileSpreadsheet, FileCode, FileArchive } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface FileIconConfig {
  icon: LucideIcon;
  color: string;
}

export const getFileIconConfig = (ext: string): FileIconConfig => {
  const extLower = ext.toLowerCase();
  
  const configs: Record<string, FileIconConfig> = {
    pdf: { icon: File, color: "text-red-600" },
    doc: { icon: File, color: "text-blue-700" },
    docx: { icon: File, color: "text-blue-700" },
    rtf: { icon: File, color: "text-blue-700" },
    csv: { icon: FileSpreadsheet, color: "text-green-600" },
    xls: { icon: FileSpreadsheet, color: "text-green-600" },
    xlsx: { icon: FileSpreadsheet, color: "text-green-600" },
    bib: { icon: FileCode, color: "text-purple-600" },
    json: { icon: FileCode, color: "text-purple-600" },
    txt: { icon: FileText, color: "text-gray-500" },
    zip: { icon: FileArchive, color: "text-orange-500" },
    rar: { icon: FileArchive, color: "text-orange-500" },
    "7z": { icon: FileArchive, color: "text-orange-500" }
  };

  return configs[extLower] || { icon: File, color: "text-gray-400" };
};

export const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size/1024).toFixed(1)} KB`;
  return `${(size/1024/1024).toFixed(2)} MB`;
};
