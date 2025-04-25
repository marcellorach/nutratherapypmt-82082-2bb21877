
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ntaiService from '@/services/ntai-service';
import { ProcessingItem } from '@/types/ntai';
import { simulateStageProcessing, getStageMessage } from './utils/processing';

export const useProcessingLogic = (
  processQueue: ProcessingItem[],
  setProcessQueue: (queue: ProcessingItem[]) => void,
  addLogEntry: (message: string) => void,
  setAnalysisResult: any,
  aiConfigs: Record<string, string>,
  setProcessingActive: (active: boolean) => void,
  setActiveItemIndex: (index: number) => void
) => {
  const { toast } = useToast();

  const startProcessing = async () => {
    // Corrigindo a verificação de tipo: verifica se algum item está no estágio intermediário ("extracting", "analyzing", "standardizing")
    if (processQueue.length === 0 || processQueue.some(item => 
      item.stage === 'extracting' || item.stage === 'analyzing' || item.stage === 'standardizing')) return;
    
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

        addLogEntry(`Enviando para processamento com IA: ${item.title}`);
        
        const simulatedResult = await ntaiService.analyzeStudy(
          item.id,
          `Texto simulado de ${item.title}`,
          aiConfigs.nutraceuticals_prompt,
          aiConfigs.conditions_prompt
        );
        
        setAnalysisResult(simulatedResult);

        const jsonAnalysisData = JSON.parse(JSON.stringify(simulatedResult));
        
        const { error: insertError } = await supabase
          .from('processed_studies')
          .insert({
            study_id: item.id,
            analysis_data: jsonAnalysisData,
            kanban_status: 'new',
            processed_by: 'ntai',
            title: item.title,
            description: `Análise NTAI: ${item.title}`,
            journal: item.sourceFile || 'NTAI'
          });

        if (insertError) {
          throw new Error(`Erro ao salvar análise: ${insertError.message}`);
        }

        addLogEntry(`Card adicionado ao kanban na coluna "Novos Estudos"`);

        updatedQueue[index] = { ...updatedQueue[index], stage: 'complete', progress: 100 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`Processamento NTAI concluído para: ${item.title}`);
        
        // Corrigindo o tipo do variant para "default" em vez de "success"
        toast({
          title: "Análise concluída",
          description: `Processamento de '${item.title}' finalizado com sucesso.`,
          variant: "default", // Alterado de "success" para "default"
        });

      } catch (error: any) {
        addLogEntry(`[ERRO] Falha no processamento para: ${item.title} - ${error.message}`);
        updatedQueue[index] = { 
          ...updatedQueue[index], 
          stage: 'error', 
          progress: 50,
          error: `Erro: ${error.message}`
        };
        setProcessQueue([...updatedQueue]);
        
        toast({
          title: "Erro no processamento",
          description: `Falha ao processar '${item.title}': ${error.message}`,
          variant: "destructive",
        });
      }

      setTimeout(() => processNextItem(index + 1), 1000);
    };
    
    processNextItem(0);
  };

  return { startProcessing };
};

const getProgressForStage = (stage: string): number => {
  switch (stage) {
    case 'extracting': return 30;
    case 'analyzing': return 60;
    case 'standardizing': return 90;
    default: return 0;
  }
};
