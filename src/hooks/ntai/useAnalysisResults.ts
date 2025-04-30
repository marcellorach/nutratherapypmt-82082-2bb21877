
import { useState } from 'react';
import { NtaiAnalysisResult } from '@/types/ntai';

export const useAnalysisResults = () => {
  const [analysisResult, setAnalysisResult] = useState<NtaiAnalysisResult | null>(null);

  const clearAnalysisResult = () => {
    setAnalysisResult(null);
  };

  return {
    analysisResult,
    setAnalysisResult,
    clearAnalysisResult
  };
};
