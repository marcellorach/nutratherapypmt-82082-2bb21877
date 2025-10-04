import React from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StudiesNotificationProps {
  hasPdfFiles: boolean;
}

const StudiesNotification: React.FC<StudiesNotificationProps> = ({ hasPdfFiles }) => {
  const { t } = useTranslation();
  
  if (!hasPdfFiles) return null;
  
  return (
    <div className="mt-4 bg-blue-50 p-3 rounded-md flex items-start gap-2">
      <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
      <div className="text-sm text-blue-700">
        <p>{t('import.nutraceuticals.processing.withStudies')}</p>
      </div>
    </div>
  );
};

export default StudiesNotification;
