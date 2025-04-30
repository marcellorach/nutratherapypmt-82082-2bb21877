
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProcessingProgressProps {
  progress: number;
  processing: boolean;
}

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ progress, processing }) => {
  if (!processing) return null;
  
  return (
    <div className="mt-4 space-y-2">
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between text-xs text-gray-500">
        <span>Processando via IA...</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default ProcessingProgress;
