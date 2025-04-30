
/**
 * Formata o tamanho do arquivo para uma string legível
 * @param bytes Tamanho em bytes
 * @returns String formatada (ex: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Retorna a configuração do ícone para um tipo de arquivo
 * @param extension Extensão do arquivo
 * @returns Configuração com componente de ícone e classe de cor
 */
import { 
  FileSpreadsheet, FileText, File, 
  FileCode, FileJson
} from 'lucide-react';

export function getFileIconConfig(extension: string) {
  const ext = extension.toLowerCase().replace('.', '');
  
  // Configurações de ícones por tipo de arquivo
  switch (ext) {
    case 'csv':
    case 'xlsx':
    case 'xls':
      return { 
        icon: FileSpreadsheet, 
        color: 'text-green-600' 
      };
    case 'pdf':
      return { 
        icon: FileText, 
        color: 'text-red-600' 
      };
    case 'txt':
    case 'rtf':
      return { 
        icon: FileText, 
        color: 'text-gray-600' 
      };
    case 'json':
      return { 
        icon: FileJson, 
        color: 'text-yellow-600' 
      };
    case 'bib':
    case 'doc':
    case 'docx':
      return { 
        icon: FileText, 
        color: 'text-blue-600' 
      };
    default:
      return { 
        icon: File, 
        color: 'text-gray-500' 
      };
  }
}
