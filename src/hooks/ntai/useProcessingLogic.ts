
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ntaiService from '@/services/ntai-service';
import { ProcessingItem, ProcessingStage } from '@/types/ntai';
import { simulateStageProcessing, getStageMessage, getProgressForStage } from './utils/processing';

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
    // Verificar se há itens para processar e se não há processamento ativo
    if (processQueue.length === 0) {
      toast({
        title: "Nenhum item na fila",
        description: "Adicione estudos à fila antes de iniciar o processamento.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se já há processamento em andamento
    if (processQueue.some(item => 
      item.stage === 'extracting' || item.stage === 'analyzing' || item.stage === 'standardizing')) {
      toast({
        title: "Processamento em andamento",
        description: "Aguarde a conclusão do processamento atual.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingActive(true);
    const updatedQueue = [...processQueue];
    setAnalysisResult(null);
    
    addLogEntry('Iniciando processamento com configurações:');
    addLogEntry(`Modelo: ${aiConfigs.modelName || 'padrão'}, Temperature: ${aiConfigs.temperature || '0.7'}`);
    
    const processNextItem = async (index: number) => {
      if (index >= updatedQueue.length) {
        setProcessingActive(false);
        setActiveItemIndex(-1);
        toast({
          title: "Processamento concluído",
          description: "Todos os estudos foram processados com sucesso.",
          variant: "default",
        });
        return;
      }
      
      setActiveItemIndex(index);
      const item = updatedQueue[index];
      
      if (item.stage === 'complete' || item.stage === 'error') {
        processNextItem(index + 1);
        return;
      }

      try {
        // Simular as etapas de processamento
        for (const stage of ['extracting', 'analyzing', 'standardizing'] as ProcessingStage[]) {
          updatedQueue[index] = { ...item, stage, progress: getProgressForStage(stage) };
          setProcessQueue([...updatedQueue]);
          await simulateStageProcessing(stage, item.title, addLogEntry);
        }

        addLogEntry(`Enviando para processamento com IA: ${item.title}`);
        
        const result = await ntaiService.analyzeStudy(
          item.id,
          `Texto simulado de ${item.title} para análise de nutracêuticos veterinários.`,
          aiConfigs.nutraceuticals_prompt,
          aiConfigs.conditions_prompt
        );
        
        setAnalysisResult(result);
        
        updatedQueue[index] = { ...updatedQueue[index], stage: 'complete' as ProcessingStage, progress: 100 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`Processamento NTAI concluído para: ${item.title}`);
        
        toast({
          title: "Análise concluída",
          description: `Processamento de '${item.title}' finalizado com sucesso.`,
          variant: "default",
        });

      } catch (error: any) {
        addLogEntry(`[ERRO] Falha no processamento para: ${item.title} - ${error.message}`);
        updatedQueue[index] = { 
          ...updatedQueue[index], 
          stage: 'error' as ProcessingStage, 
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

      // Aguardar um momento antes de processar o próximo item
      setTimeout(() => processNextItem(index + 1), 1000);
    };
    
    // Iniciar o processamento pelo primeiro item
    processNextItem(0);
  };

  return { startProcessing };
};
