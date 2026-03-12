
import { useState, useEffect } from 'react';
import { VetGraphRAGAnalysisResult } from '@/types/vetgraphrag';
import { useVetGraphRAGQueue } from './ntai/useVetGraphRAGQueue';
import { useVetGraphRAGLogs } from './ntai/useVetGraphRAGLogs';
import { useVetGraphRAGConfig } from './ntai/useVetGraphRAGConfig';
import { useAvailableStudies } from './ntai/useAvailableStudies';
import { useSelectionHandling } from './ntai/useSelectionHandling';
import { useProcessingLogic } from './ntai/useProcessingLogic';
import { useAnalysisResults } from './ntai/useAnalysisResults';

export const useNtaiProcessing = () => {
  const { aiConfigs, updateAiConfig } = useVetGraphRAGConfig();
  const { logEntries, addLogEntry, clearLogs, exportLogs, calculatedProgress, resetProgress } = useVetGraphRAGLogs();
  const { availableStudies, refreshAvailableStudies } = useAvailableStudies();
  const { analysisResult, setAnalysisResult, clearAnalysisResult } = useAnalysisResults();
  
  const { 
    selectedItems, 
    toggleItemSelection, 
    handleSelectAll,
    clearSelection
  } = useSelectionHandling();
  
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
    clearFailed,
    removeFromQueue,
    updateProcessedStudy
  } = useVetGraphRAGQueue();

  const { startProcessing } = useProcessingLogic(
    processQueue,
    setProcessQueue,
    addLogEntry,
    setAnalysisResult,
    aiConfigs,
    setProcessingActive,
    setActiveItemIndex,
    updateProcessedStudy
  );

  const [processingStats, setProcessingStats] = useState({
    totalProcessed: 0,
    totalStudies: 0,
    pendingAnalysis: 0
  });

  useEffect(() => {
    setProcessingStats({
      totalProcessed: processQueue.filter(item => item.stage === 'complete').length,
      totalStudies: availableStudies.length,
      pendingAnalysis: processQueue.filter(item => item.stage !== 'complete' && item.stage !== 'error').length
    });
  }, [processQueue, availableStudies]);

  useEffect(() => {
    const checkNewStudies = async () => {
      if (availableStudies.length > 0 && processQueue.length === 0 && !processingActive) {
        addLogEntry('Verificando novos estudos para processamento...');
        await refreshAvailableStudies();
      }
    };
    checkNewStudies();
  }, [availableStudies.length]);

  const handleAddToQueue = () => {
    addToQueue(availableStudies, selectedItems);
    clearSelection();
  };

  return {
    processQueue,
    selectedItems,
    processingActive,
    logEntries,
    activeItemIndex,
    analysisResult,
    aiConfigs,
    availableStudies,
    processingStats,
    calculatedProgress,
    toggleItemSelection,
    handleSelectAll,
    addToQueue: handleAddToQueue,
    clearCompleted,
    retryFailed,
    clearFailed,
    removeFromQueue,
    startProcessing,
    clearSelection,
    updateAiConfig,
    clearLogs,
    exportLogs,
    refreshAvailableStudies,
    resetProgress,
  };
};

export default useNtaiProcessing;
