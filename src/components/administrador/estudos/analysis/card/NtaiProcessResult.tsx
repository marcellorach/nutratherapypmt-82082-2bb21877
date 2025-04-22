
import React from 'react';
import { ArrowRight } from "lucide-react";
import { ProcessingStage } from '@/types/ntai';

interface NtaiProcessResultProps {
  stage: ProcessingStage;
  error?: string;
}

export const NtaiProcessResult: React.FC<NtaiProcessResultProps> = ({ stage, error }) => {
  if (error) {
    return (
      <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
        {error}
      </div>
    );
  }

  if (stage === 'complete') {
    return (
      <div className="mt-2 text-xs text-green-600 flex items-center justify-end gap-1">
        <span>Estudo padronizado disponível</span>
        <ArrowRight className="h-3 w-3" />
      </div>
    );
  }

  return null;
};
