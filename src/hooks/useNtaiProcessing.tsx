
import { useState, useEffect } from 'react';
import { NtaiAnalysisResult } from '@/types/ntai';
import { useNtaiQueue } from './ntai/useNtaiQueue';
import { useNtaiLogs } from './ntai/useNtaiLogs';
import { useNtaiConfig } from './ntai/useNtaiConfig';
import { useAvailableStudies } from './ntai/useAvailableStudies';
import { useSelectionHandling } from './ntai/useSelectionHandling';
import { useProcessingLogic } from './ntai/useProcessingLogic';
import { useAnalysisResults } from './ntai/useAnalysisResults';

export const useNtaiProcessing = () => {
  // Integração dos hooks especializados
  const { aiConfigs, updateAiConfig } = useNtaiConfig();
  const { logEntries, addLogEntry, clearLogs, exportLogs } = useNtaiLogs();
  const { availableStudies, refreshAvailableStudies } = useAvailableStudies();
  const { analysisResult, setAnalysisResult, clearAnalysisResult } = useAnalysisResults();
  
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
    updateProcessedStudy
  } = useNtaiQueue();

  // Integrar com a lógica de processamento
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

  // Dados para dashboard
  const [processingStats, setProcessingStats] = useState({
    totalProcessed: 0,
    totalStudies: 0,
    pendingAnalysis: 0
  });

  // Atualizar estatísticas
  useEffect(() => {
    const updateStats = () => {
      setProcessingStats({
        totalProcessed: processQueue.filter(item => item.stage === 'complete').length,
        totalStudies: availableStudies.length,
        pendingAnalysis: processQueue.filter(item => item.stage !== 'complete' && item.stage !== 'error').length
      });
    };
    
    updateStats();
  }, [processQueue, availableStudies]);

  // Verificar arquivos automaticamente após upload
  useEffect(() => {
    const checkNewStudies = async () => {
      if (availableStudies.length > 0 && processQueue.length === 0 && !processingActive) {
        addLogEntry('Verificando novos estudos para processamento...');
        await refreshAvailableStudies();
      }
    };
    
    checkNewStudies();
  }, [availableStudies.length]);

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
    processingStats,
    toggleItemSelection,
    handleSelectAll,
    addToQueue: handleAddToQueue,
    clearCompleted,
    retryFailed,
    startProcessing,
    clearSelection,
    updateAiConfig,
    clearLogs,
    exportLogs,
    refreshAvailableStudies
  };
};

export default useNtaiProcessing;
