
import { useState } from 'react';
import { NtaiAnalysisResult } from '@/types/ntai';
import { useNtaiQueue } from './ntai/useNtaiQueue';
import { useNtaiLogs } from './ntai/useNtaiLogs';
import { useNtaiConfig } from './ntai/useNtaiConfig';
import { useAvailableStudies } from './ntai/useAvailableStudies';
import { useSelectionHandling } from './ntai/useSelectionHandling';
import { useProcessingLogic } from './ntai/useProcessingLogic';

export const useNtaiProcessing = () => {
  const [analysisResult, setAnalysisResult] = useState<NtaiAnalysisResult | null>(null);
  const { aiConfigs } = useNtaiConfig();
  const { logEntries, addLogEntry } = useNtaiLogs();
  const { availableStudies } = useAvailableStudies();
  const { selectedItems, toggleItemSelection, handleSelectAll, setSelectedItems } = useSelectionHandling();
  
  const {
    processQueue,
    processingActive,
    activeItemIndex,
    setProcessQueue,
    setProcessingActive,
    setActiveItemIndex,
    addToQueue,
    clearCompleted,
    retryFailed,
  } = useNtaiQueue();

  const { startProcessing } = useProcessingLogic(
    processQueue,
    setProcessQueue,
    addLogEntry,
    setAnalysisResult,
    aiConfigs,
    setProcessingActive,
    setActiveItemIndex
  );

  return {
    processQueue,
    selectedItems,
    processingActive,
    logEntries,
    activeItemIndex,
    analysisResult,
    aiConfigs,
    availableStudies,
    toggleItemSelection,
    handleSelectAll,
    addToQueue,
    clearCompleted,
    retryFailed,
    startProcessing,
  };
};

export default useNtaiProcessing;
