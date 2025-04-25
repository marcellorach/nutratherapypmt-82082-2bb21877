
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
  
  // Extrair métodos do hook de seleção
  const { 
    selectedItems, 
    toggleItemSelection, 
    handleSelectAll,
    clearSelection
  } = useSelectionHandling();
  
  // Extrair métodos e estados do hook de fila
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

  // Integrar com a lógica de processamento
  const { startProcessing } = useProcessingLogic(
    processQueue,
    setProcessQueue,
    addLogEntry,
    setAnalysisResult,
    aiConfigs,
    setProcessingActive,
    setActiveItemIndex
  );

  // Função para adicionar os itens selecionados à fila
  const handleAddToQueue = () => {
    console.log('Adicionando estudos selecionados à fila:', selectedItems);
    console.log('Estudos disponíveis:', availableStudies);
    
    // Passa os estudos disponíveis e os IDs selecionados
    addToQueue(availableStudies, selectedItems);
    
    // Limpar a seleção após adicionar à fila
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
    toggleItemSelection,
    handleSelectAll,
    addToQueue: handleAddToQueue,
    clearCompleted,
    retryFailed,
    startProcessing,
    clearSelection
  };
};

export default useNtaiProcessing;
