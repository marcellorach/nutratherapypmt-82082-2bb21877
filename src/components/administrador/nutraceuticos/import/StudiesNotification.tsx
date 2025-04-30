
import React from 'react';
import { FileText } from 'lucide-react';

interface StudiesNotificationProps {
  hasPdfFiles: boolean;
}

const StudiesNotification: React.FC<StudiesNotificationProps> = ({ hasPdfFiles }) => {
  if (!hasPdfFiles) return null;
  
  return (
    <div className="mt-4 bg-blue-50 p-3 rounded-md flex items-start gap-2">
      <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
      <div className="text-sm text-blue-700">
        <p>Existem arquivos PDF de estudos científicos que serão associados durante o processamento.</p>
      </div>
    </div>
  );
};

export default StudiesNotification;
