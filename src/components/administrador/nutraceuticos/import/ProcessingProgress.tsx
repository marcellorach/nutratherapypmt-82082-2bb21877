import React from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';

interface ProcessingProgressProps {
  progress: number;
  processing: boolean;
}

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ progress, processing }) => {
  const { t } = useTranslation();
  
  if (!processing) return null;
  
  return (
    <div className="mt-4 space-y-2">
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{t('import.nutraceuticals.processing.message')}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default ProcessingProgress;
