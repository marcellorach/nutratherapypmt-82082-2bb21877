
import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FilePreviewProps {
  file: File;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
      <div className="flex items-center">
        <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-600" />
        <div>
          <p className="text-sm font-medium">{file.name}</p>
          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
        </div>
      </div>
      <Badge variant="outline">{file.type || 'Planilha'}</Badge>
    </div>
  );
};

export default FilePreview;
