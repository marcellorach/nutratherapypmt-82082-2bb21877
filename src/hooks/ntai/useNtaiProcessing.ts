
import { useState } from 'react';
import { NtaiAnalysisResult, ProcessingStage } from '@/types/ntai';
import ntaiService from '@/services/ntai-service';
import { useNtaiQueue } from './useNtaiQueue';
import { useNtaiLogs } from './useNtaiLogs';
import { useNtaiConfig } from './useNtaiConfig';

const getProgressForStage = (stage: ProcessingStage): number => {
  switch (stage) {
    case 'extracting': return 30;
    case 'analyzing': return 60;
    case 'standardizing': return 90;
    default: return 0;
  }
};

export const useNtaiProcessing = () => {
  const [analysisResult, setAnalysisResult] = useState<NtaiAnalysisResult | null>(null);
  const { aiConfigs } = useNtaiConfig();
  const { logEntries, addLogEntry } = useNtaiLogs();
  const {
    processQueue,
    selectedItems,
    processingActive,
    activeItemIndex,
    setProcessQueue,
    setProcessingActive,
    setActiveItemIndex,
    addToQueue,
    clearCompleted,
    retryFailed,
  } = useNtaiQueue();

  const startProcessing = async () => {
    if (processQueue.length === 0 || processingActive) return;
    
    setProcessingActive(true);
    const updatedQueue = [...processQueue];
    setAnalysisResult(null);
    
    addLogEntry('Iniciando processamento com configurações:');
    addLogEntry(`Modelo: ${aiConfigs.modelName || 'padrão'}, Temperature: ${aiConfigs.temperature || '0.7'}`);
    
    const processNextItem = async (index: number) => {
      if (index >= updatedQueue.length) {
        setProcessingActive(false);
        setActiveItemIndex(-1);
        return;
      }
      
      setActiveItemIndex(index);
      const item = updatedQueue[index];
      
      if (item.stage === 'complete' || item.stage === 'error') {
        processNextItem(index + 1);
        return;
      }

      try {
        for (const stage of ['extracting', 'analyzing', 'standardizing'] as ProcessingStage[]) {
          updatedQueue[index] = { ...item, stage, progress: getProgressForStage(stage) };
          setProcessQueue([...updatedQueue]);
          await simulateStageProcessing(stage, item.title, addLogEntry);
        }

        const simulatedResult = await ntaiService.analyzeStudy(
          item.id,
          `Texto simulado de ${item.title}`,
          aiConfigs.nutraceuticals_prompt,
          aiConfigs.conditions_prompt
        );
        setAnalysisResult(simulatedResult);

        const cardId = `card-${Date.now()}-${item.id}`;
        addLogEntry(`Card gerado com ID: ${cardId}`);
        addLogEntry(`Card adicionado ao kanban na coluna "Novos Estudos"`);

        updatedQueue[index] = { ...updatedQueue[index], stage: 'complete' as ProcessingStage, progress: 100 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`Processamento NTAI concluído para: ${item.title}`);

      } catch (error) {
        addLogEntry(`[ERRO] Falha no processamento para: ${item.title} - ${error}`);
        updatedQueue[index] = { 
          ...updatedQueue[index], 
          stage: 'error' as ProcessingStage, 
          progress: 50,
          error: `Erro desconhecido: ${error}`
        };
        setProcessQueue([...updatedQueue]);
      }

      setTimeout(() => processNextItem(index + 1), 1000);
    };
    
    processNextItem(0);
  };

  return {
    processQueue,
    selectedItems,
    processingActive,
    logEntries,
    activeItemIndex,
    analysisResult,
    aiConfigs,
    addToQueue,
    clearCompleted,
    retryFailed,
    startProcessing,
  };
};

const simulateStageProcessing = async (
  stage: ProcessingStage,
  itemTitle: string,
  logCallback: (message: string) => void
) => {
  const delay = Math.random() * 2000 + 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const stageMessage = getStageMessage(stage);
  logCallback(`${stageMessage} para: ${itemTitle}`);
  
  if (stage === 'extracting') {
    logCallback(`Extraindo texto de documento PDF: ${itemTitle}`);
  } else if (stage === 'analyzing') {
    logCallback(`Analisando conteúdo com prompt especializado para nutracêuticos`);
  } else if (stage === 'standardizing') {
    logCallback(`Padronizando dados para integração com o kanban`);
  }
};

const getStageMessage = (stage: ProcessingStage): string => {
  switch (stage) {
    case 'extracting': return 'Extraindo texto';
    case 'analyzing': return 'Analisando conteúdo';
    case 'standardizing': return 'Padronizando dados';
    default: return 'Processando';
  }
};
