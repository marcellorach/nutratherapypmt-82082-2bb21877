
import { useState } from 'react';
import { NtaiAnalysisResult } from '@/types/ntai';
import { useNtaiQueue } from './ntai/useNtaiQueue';
import { useNtaiLogs } from './ntai/useNtaiLogs';
import { useNtaiConfig } from './ntai/useNtaiConfig';
import ntaiService from '@/services/ntai-service';
import { supabase } from '@/integrations/supabase/client';

// Helper function for simulating stage processing
const simulateStageProcessing = async (
  stage: any,
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

// Helper function for stage messages
const getStageMessage = (stage: string): string => {
  switch (stage) {
    case 'extracting': return 'Extraindo texto';
    case 'analyzing': return 'Analisando conteúdo';
    case 'standardizing': return 'Padronizando dados';
    default: return 'Processando';
  }
};

// Helper function for stage progress
const getProgressForStage = (stage: string): number => {
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
    setSelectedItems,
    addToQueue,
    clearCompleted,
    retryFailed,
  } = useNtaiQueue();

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (estudos: any[]) => {
    if (selectedItems.length === estudos.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(estudos.map(estudo => estudo.id));
    }
  };

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
        for (const stage of ['extracting', 'analyzing', 'standardizing'] as any[]) {
          updatedQueue[index] = { ...item, stage, progress: getProgressForStage(stage) };
          setProcessQueue([...updatedQueue]);
          await simulateStageProcessing(stage, item.title, addLogEntry);
        }

        addLogEntry(`Enviando para processamento com IA: ${item.title}`);
        
        // Aqui chamamos a nova função que usa a Edge Function
        const simulatedResult = await ntaiService.analyzeStudy(
          item.id,
          `Texto simulado de ${item.title}`,
          aiConfigs.nutraceuticals_prompt,
          aiConfigs.conditions_prompt
        );
        
        setAnalysisResult(simulatedResult);

        // Salvar dados no Supabase
        const { data: savedCard, error } = await supabase
          .from('processed_studies')
          .upsert({
            study_id: item.id,
            analysis_data: simulatedResult,
            kanban_status: 'new',
            processed_by: 'ntai'
          })
          .select();

        const cardId = savedCard ? savedCard[0]?.id : `card-${Date.now()}-${item.id}`;
        
        if (error) {
          addLogEntry(`[AVISO] Falha ao salvar no banco de dados: ${error.message}`);
        } else {
          addLogEntry(`Card gerado com ID: ${cardId}`);
          addLogEntry(`Card adicionado ao kanban na coluna "Novos Estudos"`);
        }

        updatedQueue[index] = { ...updatedQueue[index], stage: 'complete' as any, progress: 100 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`Processamento NTAI concluído para: ${item.title}`);

      } catch (error: any) {
        addLogEntry(`[ERRO] Falha no processamento para: ${item.title} - ${error.message || error}`);
        updatedQueue[index] = { 
          ...updatedQueue[index], 
          stage: 'error' as any, 
          progress: 50,
          error: `Erro: ${error.message || 'Erro desconhecido'}`
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
    toggleItemSelection,
    handleSelectAll,
    addToQueue,
    clearCompleted,
    retryFailed,
    startProcessing,
  };
};

export default useNtaiProcessing;
