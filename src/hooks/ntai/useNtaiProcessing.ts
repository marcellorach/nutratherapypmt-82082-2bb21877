import { useState } from 'react';
import { NtaiAnalysisResult, ProcessingItem } from '@/types/ntai';
import { useNtaiQueue } from './useNtaiQueue';
import { useNtaiLogs } from './useNtaiLogs';
import { useNtaiConfig } from './useNtaiConfig';
import { supabase } from '@/integrations/supabase/client';
import ntaiService from '@/services/ntai-service';

const getProgressForStage = (stage: ProcessingStage): number => {
  switch (stage) {
    case 'extracting': return 30;
    case 'analyzing': return 60;
    case 'standardizing': return 90;
    default: return 0;
  }
};

export const useNtaiProcessing = () => {
  const [analysisResults, setAnalysisResults] = useState<NtaiAnalysisResult[]>([]);
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
    setSelectedItems,
    addToQueue,
    clearCompleted,
    retryFailed,
  } = useNtaiQueue();

  const startProcessing = async () => {
    if (processQueue.length === 0 || processingActive) return;
    
    setProcessingActive(true);
    const updatedQueue = [...processQueue];
    setAnalysisResults([]);
    
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

        addLogEntry(`Enviando para processamento com IA: ${item.title}`);
        
        const simulatedResult = await ntaiService.analyzeStudy(
          item.id,
          `Texto simulado de ${item.title}`,
          aiConfigs.nutraceuticals_prompt,
          aiConfigs.conditions_prompt
        );
        
        setAnalysisResults(prev => [...prev, simulatedResult]);

        updatedQueue[index] = { ...updatedQueue[index], stage: 'complete', progress: 100 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`Processamento NTAI concluído para: ${item.title}`);

      } catch (error: any) {
        addLogEntry(`[ERRO] Falha no processamento para: ${item.title} - ${error.message}`);
        updatedQueue[index] = { 
          ...updatedQueue[index], 
          stage: 'error', 
          progress: 50,
          error: `Erro: ${error.message}`
        };
        setProcessQueue([...updatedQueue]);
      }

      setTimeout(() => processNextItem(index + 1), 1000);
    };
    
    processNextItem(0);
  };

  const sendToCuration = async (results: NtaiAnalysisResult[]) => {
    try {
      for (const result of results) {
        const { error } = await supabase
          .from('processed_studies')
          .insert({
            study_id: result.studyId,
            analysis_data: JSON.parse(JSON.stringify(result)),
            kanban_status: 'new',
            processed_by: 'ntai'
          });

        if (error) throw error;
        addLogEntry(`Estudo ${result.studyId} enviado para curadoria com sucesso`);
      }
      
      setAnalysisResults([]);
      
    } catch (error: any) {
      console.error('Error sending to curation:', error);
      throw error;
    }
  };

  return {
    processQueue,
    selectedItems,
    processingActive,
    logEntries,
    activeItemIndex,
    analysisResults,
    aiConfigs,
    toggleItemSelection,
    handleSelectAll,
    addToQueue,
    clearCompleted,
    retryFailed,
    startProcessing,
    sendToCuration,
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
