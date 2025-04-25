
import { useState } from 'react';
import { NtaiAnalysisResult, ProcessingStage } from '@/types/ntai';
import { supabase } from '@/integrations/supabase/client';
import ntaiService from '@/services/ntai-service';
import { AvailableStudy } from './types/processing';
import { ProcessingItem } from './types';

// Função auxiliar para determinar o progresso baseado no estágio
const getProgressForStage = (stage: ProcessingStage): number => {
  switch (stage) {
    case 'extracting': return 30;
    case 'analyzing': return 60;
    case 'standardizing': return 90;
    default: return 0;
  }
};

export const useNtaiProcessing = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<NtaiAnalysisResult | null>(null);
  const [processingActive, setProcessingActive] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(-1);
  const [processQueue, setProcessQueue] = useState<ProcessingItem[]>([]);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [availableStudies, setAvailableStudies] = useState<AvailableStudy[]>([
    {
      id: "1",
      title: "Efeitos de Glucosamina na Saúde Articular",
      description: "Estudo randomizado sobre glucosamina",
      journal: "Journal of Veterinary Medicine",
      kanban_status: "new",
      import_type: "manual",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Ômega 3 e Saúde Cardiovascular em Cães",
      description: "Meta-análise de estudos sobre ômega 3",
      journal: "Animal Health Research",
      kanban_status: "especial",
      import_type: "scispace",
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      title: "Curcumina como Anti-inflamatório Natural",
      description: "Revisão sistemática sobre curcumina",
      journal: "Nutraceutical Research",
      kanban_status: "new",
      import_type: "scispace",
      created_at: new Date().toISOString(),
    }
  ]);
  
  const [aiConfigs, setAiConfigs] = useState({
    modelName: "GPT-4o",
    temperature: "0.7",
    nutraceuticals_prompt: "Extrair todos os nutracêuticos mencionados no estudo e suas aplicações.",
    conditions_prompt: "Identificar todas as condições de saúde abordadas no estudo."
  });

  const addLogEntry = (message: string) => {
    setLogEntries(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Gerenciamento de seleção
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (estudos: AvailableStudy[]) => {
    if (selectedItems.length === estudos.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(estudos.map(estudo => estudo.id));
    }
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Funções de fila
  const addToQueue = (estudos: AvailableStudy[], selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      // Aqui poderia exibir uma mensagem de erro
      return;
    }

    // Filtrar apenas os estudos que estão selecionados
    const estudosSelecionados = estudos.filter(estudo => selectedIds.includes(estudo.id));
    
    if (estudosSelecionados.length === 0) {
      // Aqui poderia exibir uma mensagem de erro
      return;
    }

    const newItems: ProcessingItem[] = estudosSelecionados.map(estudo => {
      return {
        id: estudo.id,
        title: estudo.title || `Estudo ${estudo.id.substring(0, 8)}`,
        stage: 'idle' as ProcessingStage,
        progress: 0,
        sourceFile: estudo.journal || 'Desconhecido',
        originalFormat: estudo.title?.split('.').pop()?.toUpperCase() || 'PDF'
      };
    });

    setProcessQueue(prev => [...prev, ...newItems]);
  };

  const clearCompleted = () => {
    setProcessQueue(prev => prev.filter(item => item.stage !== 'complete'));
  };

  const retryFailed = () => {
    setProcessQueue(prev => prev.map(item => 
      item.stage === 'error' 
        ? { ...item, stage: 'idle' as ProcessingStage, progress: 0, error: undefined }
        : item
    ));
  };

  // Processamento
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
        for (const stage of ['extracting', 'analyzing', 'standardizing'] as const) {
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

// Função auxiliar para simular o processamento de um estágio
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
