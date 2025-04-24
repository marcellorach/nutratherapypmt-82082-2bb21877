
import { useState, useEffect } from 'react';
import { NtaiAnalysisResult, ProcessingItem } from '@/types/ntai';
import { useNtaiQueue } from './ntai/useNtaiQueue';
import { useNtaiLogs } from './ntai/useNtaiLogs';
import { useNtaiConfig } from './ntai/useNtaiConfig';
import ntaiService from '@/services/ntai-service';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Helper function para simular o processamento de etapas
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

// Helper function para mensagens de etapa
const getStageMessage = (stage: string): string => {
  switch (stage) {
    case 'extracting': return 'Extraindo texto';
    case 'analyzing': return 'Analisando conteúdo';
    case 'standardizing': return 'Padronizando dados';
    default: return 'Processando';
  }
};

// Helper function para progresso de etapa
const getProgressForStage = (stage: string): number => {
  switch (stage) {
    case 'extracting': return 30;
    case 'analyzing': return 60;
    case 'standardizing': return 90;
    default: return 0;
  }
};

// Função para transformar dados de scispace_imports em formato compatível com estudos
const transformImportToStudy = (importData: any) => {
  return {
    id: importData.id,
    title: importData.meta_summary_filename || 'Estudo importado',
    description: importData.notes || 'Importado via SciSpace',
    journal: 'SciSpace Import',
    kanban_status: importData.scispace_status || 'new',
    import_type: importData.import_type || 'manual',
    created_at: importData.imported_at
  };
};

export const useNtaiProcessing = () => {
  const [analysisResult, setAnalysisResult] = useState<NtaiAnalysisResult | null>(null);
  const [availableStudies, setAvailableStudies] = useState<any[]>([]);
  const { aiConfigs } = useNtaiConfig();
  const { logEntries, addLogEntry } = useNtaiLogs();
  const { toast } = useToast();
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

  // Carregar estudos disponíveis
  useEffect(() => {
    const loadStudies = async () => {
      // Carregar estudos processados
      const { data: processedData, error: processedError } = await supabase
        .from('processed_studies')
        .select(`
          id,
          title,
          description,
          journal,
          kanban_status,
          import_type,
          created_at
        `)
        .order('created_at', { ascending: false });

      // Carregar importações do SciSpace
      const { data: importData, error: importError } = await supabase
        .from('scispace_imports')
        .select('*')
        .eq('is_deleted', false)
        .order('imported_at', { ascending: false });

      if (processedError) {
        console.error('Erro ao carregar estudos processados:', processedError);
        toast({
          title: "Erro ao carregar estudos",
          description: "Não foi possível carregar os estudos processados.",
          variant: "destructive",
        });
      }

      if (importError) {
        console.error('Erro ao carregar importações:', importError);
        toast({
          title: "Erro ao carregar importações",
          description: "Não foi possível carregar as importações do SciSpace.",
          variant: "destructive",
        });
      }

      // Transformar importações em formato de estudo
      const importStudies = importData ? importData.map(transformImportToStudy) : [];
      
      // Mesclar os dois conjuntos de dados (evitando duplicatas por ID)
      const processedStudies = processedData || [];
      const allStudies = [...processedStudies];
      
      // Adicionar apenas importações que não existem como estudos processados
      importStudies.forEach(importStudy => {
        if (!allStudies.some(study => study.id === importStudy.id)) {
          allStudies.push(importStudy);
        }
      });

      setAvailableStudies(allStudies);
    };

    loadStudies();

    // Configurar realtime subscription para processed_studies
    const processedChannel = supabase
      .channel('processed_studies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processed_studies'
        },
        () => {
          loadStudies(); // Recarregar estudos quando houver mudanças
        }
      )
      .subscribe();

    // Configurar realtime subscription para scispace_imports
    const importsChannel = supabase
      .channel('scispace_imports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scispace_imports'
        },
        () => {
          loadStudies(); // Recarregar estudos quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(processedChannel);
      supabase.removeChannel(importsChannel);
    };
  }, [toast]);

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
        
        const simulatedResult = await ntaiService.analyzeStudy(
          item.id,
          `Texto simulado de ${item.title}`,
          aiConfigs.nutraceuticals_prompt,
          aiConfigs.conditions_prompt
        );
        
        setAnalysisResult(simulatedResult);

        // Converter o resultado da análise para um objeto JSON simples para compatibilidade com Supabase
        const jsonAnalysisData = JSON.parse(JSON.stringify(simulatedResult));
        
        const { data: savedAnalysis, error: insertError } = await supabase
          .from('processed_studies')
          .insert({
            study_id: item.id,
            analysis_data: jsonAnalysisData,
            kanban_status: 'new',
            processed_by: 'ntai',
            title: item.title,
            description: `Análise NTAI: ${item.title}`,
            journal: item.sourceFile || 'NTAI'
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(`Erro ao salvar análise: ${insertError.message}`);
        }

        const cardId = savedAnalysis?.id;
        addLogEntry(`Card gerado com ID: ${cardId}`);
        addLogEntry(`Card adicionado ao kanban na coluna "Novos Estudos"`);

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
