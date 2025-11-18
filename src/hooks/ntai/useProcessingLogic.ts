
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
  setActiveItemIndex: (index: number) => void,
  updateProcessedStudy: (id: string, data: any) => Promise<boolean>
) => {
  const { toast } = useToast();

  const startProcessing = async () => {
    if (processQueue.length === 0) {
      toast({
        title: "Nenhum item na fila",
        description: "Adicione estudos à fila antes de iniciar o processamento.",
        variant: "destructive",
      });
      return;
    }
    
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
        const { data: studyData, error: studyError } = await supabase
          .from('processed_studies')
          .select('*')
          .eq('id', item.id)
          .maybeSingle();
          
        if (studyError) {
          throw new Error(`Erro ao buscar dados do estudo: ${studyError.message}`);
        }
        
        if (!studyData) {
          throw new Error(`Estudo não encontrado no banco de dados: ${item.id}`);
        }

        // ETAPA 1: EXTRAÇÃO (Gemini → Fallback Unstructured)
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 30 };
        setProcessQueue([...updatedQueue]);
        
        let parseData: any = null;
        let usedGemini = false;
        
        try {
          addLogEntry(`🤖 Tentando Gemini File API: ${item.title}`);
          
          const { data: geminiData, error: geminiError } = await supabase.functions.invoke('gemini-file-search', {
            body: { 
              studyId: item.id,
              fileUrl: studyData.storage_path,
              fileName: studyData.original_filename
            }
          });
          
          if (geminiError) throw geminiError;
          
          if (geminiData && geminiData.success) {
            parseData = geminiData;
            usedGemini = true;
            addLogEntry(`✅ Gemini OK: ${geminiData.nutraceuticalsCount || 0} nutracêuticos`);
          } else {
            throw new Error('Gemini sem dados válidos');
          }
        } catch (geminiErr: any) {
          addLogEntry(`⚠️ Gemini falhou: ${geminiErr.message}`);
          addLogEntry(`🔄 Fallback Unstructured.io...`);
          
          const { data: unstructuredData, error: unstructuredError } = await supabase.functions.invoke('parse-study', {
            body: { 
              studyId: item.id, 
              storagePath: studyData.storage_path 
            }
          });
          
          if (unstructuredError) {
            const errorMsg = unstructuredError.message || String(unstructuredError);
            addLogEntry(`[ERRO] Ambos falharam: ${errorMsg}`);
            updatedQueue[index] = { ...item, stage: 'error', progress: 0, error: errorMsg };
            setProcessQueue([...updatedQueue]);
            processNextItem(index + 1);
            return;
          }
          
          parseData = unstructuredData;
          addLogEntry(`✅ Unstructured OK`);
        }

        if (!parseData || parseData.error) {
          throw new Error('Parsing falhou');
        }
        
        addLogEntry(`📊 ${usedGemini ? 'Gemini ✨' : 'Unstructured'}`);

        // ETAPA 2: ANÁLISE
        updatedQueue[index] = { ...item, stage: 'analyzing', progress: 60 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`🧠 Analisando: ${item.title}`);
        
        const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-study-entities', {
          body: { studyId: item.id }
        });

        if (extractError) {
          throw new Error(`Erro extração: ${extractError.message}`);
        }

        addLogEntry(`✅ ${extractData?.nutraceuticals?.length || 0} nutracêuticos extraídos`);

        // ETAPA 3: SALVAMENTO
        updatedQueue[index] = { ...item, stage: 'standardizing', progress: 90 };
        setProcessQueue([...updatedQueue]);

        const result = {
          studyId: item.id,
          qualityScore: extractData?.qualityScore || 0,
          relevanceScore: 0,
          extractedNutraceuticals: extractData?.nutraceuticals || [],
          extractedConditions: extractData?.conditions || [],
          extractedInteractions: [],
          extractedSideEffects: []
        };
        
        setAnalysisResult(result);
        await updateProcessedStudy(item.id, result);
        
        updatedQueue[index] = { ...updatedQueue[index], stage: 'complete' as ProcessingStage, progress: 100 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`✅ Concluído: ${item.title}`);
        
        toast({
          title: "Análise concluída",
          description: `'${item.title}' processado.`,
          variant: "default",
        });

      } catch (error: any) {
        addLogEntry(`[ERRO] ${item.title}: ${error.message}`);
        updatedQueue[index] = { 
          ...updatedQueue[index], 
          stage: 'error' as ProcessingStage, 
          progress: 50,
          error: error.message
        };
        setProcessQueue([...updatedQueue]);
        
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      }

      setTimeout(() => processNextItem(index + 1), 1000);
    };
    
    processNextItem(0);
  };

  return { startProcessing };
};
