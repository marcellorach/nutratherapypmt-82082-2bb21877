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
  const [processQueue, setProcessQueue] = useState<ProcessingItem[]>([
    // Pré-preencher com dois estudos já processados para simulação - usando UUIDs válidos
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479", // UUID válido
      title: "The effects of sulforaphane on canine osteosarcoma proliferation and invasion",
      stage: 'complete' as ProcessingStage,
      progress: 100,
      sourceFile: "PubMed",
      originalFormat: "PDF"
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440000", // UUID válido
      title: "Senescent cells as a target for anti-aging interventions",
      stage: 'complete' as ProcessingStage,
      progress: 100,
      sourceFile: "National Institute of Health",
      originalFormat: "PDF"
    },
    {
      id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", // UUID válido adicional
      title: "Effect of dietary supplements in reducing probability of death for uremic crises in dogs",
      stage: 'complete' as ProcessingStage,
      progress: 100,
      sourceFile: "Veterinary Research",
      originalFormat: "PDF"
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174000", // UUID válido adicional
      title: "Impact of green tea extract on oxidative stress in companion animals",
      stage: 'complete' as ProcessingStage,
      progress: 100,
      sourceFile: "Journal of Veterinary Science",
      originalFormat: "PDF"
    },
    {
      id: "9ed9e1c2-2e5a-4b77-857a-9c1d10f7afe5", // UUID válido adicional
      title: "Vitamin supplements and cognitive function in aging dogs",
      stage: 'complete' as ProcessingStage,
      progress: 100,
      sourceFile: "Canine Health Research",
      originalFormat: "PDF"
    }
  ]);
  const [logEntries, setLogEntries] = useState<string[]>([
    // Log entries para mostrar histórico de processamento
    "[10:25:30] Iniciando processamento com configurações:",
    "[10:25:30] Modelo: GPT-4o, Temperature: 0.7",
    "[10:25:31] Extraindo texto para: The effects of sulforaphane on canine osteosarcoma proliferation and invasion",
    "[10:25:33] Extraindo texto de documento PDF: The effects of sulforaphane on canine osteosarcoma proliferation and invasion",
    "[10:25:36] Analisando conteúdo para: The effects of sulforaphane on canine osteosarcoma proliferation and invasion",
    "[10:25:38] Analisando conteúdo com prompt especializado para nutracêuticos",
    "[10:25:42] Padronizando dados para: The effects of sulforaphane on canine osteosarcoma proliferation and invasion",
    "[10:25:45] Padronizando dados para integração com o kanban",
    "[10:25:48] Processamento NTAI concluído para: The effects of sulforaphane on canine osteosarcoma proliferation and invasion",
    "[10:25:50] Iniciando processamento para o próximo estudo...",
    "[10:25:51] Extraindo texto para: Senescent cells as a target for anti-aging interventions",
    "[10:25:54] Extraindo texto de documento PDF: Senescent cells as a target for anti-aging interventions",
    "[10:25:57] Analisando conteúdo para: Senescent cells as a target for anti-aging interventions",
    "[10:25:59] Analisando conteúdo com prompt especializado para nutracêuticos",
    "[10:26:03] Padronizando dados para: Senescent cells as a target for anti-aging interventions",
    "[10:26:05] Padronizando dados para integração com o kanban",
    "[10:26:08] Processamento NTAI concluído para: Senescent cells as a target for anti-aging interventions",
    "[10:26:10] Iniciando processamento para o próximo estudo...",
    "[10:26:11] Extraindo texto para: Effect of dietary supplements in reducing probability of death for uremic crises in dogs",
    "[10:26:14] Extraindo texto de documento PDF: Effect of dietary supplements in reducing probability of death for uremic crises in dogs",
    "[10:26:17] Analisando conteúdo para: Effect of dietary supplements in reducing probability of death for uremic crises in dogs",
    "[10:26:20] Analisando conteúdo com prompt especializado para nutracêuticos",
    "[10:26:23] Padronizando dados para: Effect of dietary supplements in reducing probability of death for uremic crises in dogs",
    "[10:26:25] Processamento NTAI concluído para: Effect of dietary supplements in reducing probability of death for uremic crises in dogs"
  ]);
  const [availableStudies, setAvailableStudies] = useState<AvailableStudy[]>([
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479", // UUID válido
      title: "The effects of sulforaphane on canine osteosarcoma proliferation and invasion",
      description: "Sulforafano reduz invasão tumoral e protege células contra toxicidade da doxorrubicina em osteossarcoma canino",
      journal: "PubMed",
      kanban_status: "processed", // Marcado como processado
      import_type: "manual",
      created_at: new Date().toISOString(),
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440000", // UUID válido
      title: "Senescent cells as a target for anti-aging interventions",
      description: "Células senescentes impulsionam doenças do envelhecimento. Senoterapias visam eliminá-las, prometendo ampliar a saúde e longevidade",
      journal: "National Institute of Health",
      kanban_status: "processed", // Marcado como processado
      import_type: "scispace",
      created_at: new Date().toISOString(),
    },
    {
      id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", // UUID válido
      title: "Effect of dietary supplements in reducing probability of death for uremic crises in dogs",
      description: "Estudo sobre suplementos dietéticos e seu efeito na redução da mortalidade em cães com doença renal crônica",
      journal: "Veterinary Research",
      kanban_status: "processed", // Modificado para processado
      import_type: "scispace",
      created_at: new Date().toISOString(),
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174000", // UUID válido adicional
      title: "Impact of green tea extract on oxidative stress in companion animals",
      description: "Avaliação dos efeitos antioxidantes do extrato de chá verde em cães e gatos com estresse oxidativo",
      journal: "Journal of Veterinary Science",
      kanban_status: "processed",
      import_type: "manual",
      created_at: new Date().toISOString(),
    },
    {
      id: "9ed9e1c2-2e5a-4b77-857a-9c1d10f7afe5", // UUID válido adicional
      title: "Vitamin supplements and cognitive function in aging dogs",
      description: "Pesquisa sobre o impacto de suplementos vitamínicos na função cognitiva de cães idosos",
      journal: "Canine Health Research",
      kanban_status: "processed",
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

        // Usar o ID do estudo diretamente, que agora é um UUID válido
        const simulatedResult = await ntaiService.analyzeStudy(
          item.id,
          `Texto simulado de ${item.title}`,
          aiConfigs.nutraceuticals_prompt,
          aiConfigs.conditions_prompt
        );
        
        setAnalysisResult(simulatedResult);

        // Marcar como concluído
        updatedQueue[index] = { ...updatedQueue[index], stage: 'complete', progress: 100 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`Processamento NTAI concluído para: ${item.title}`);
        
        // Atualizar a lista de estudos disponíveis
        setAvailableStudies(prev => 
          prev.map(estudo => 
            estudo.id === item.id 
              ? { ...estudo, kanban_status: "processed" }
              : estudo
          )
        );
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
    clearSelection,
    addLogEntry
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
