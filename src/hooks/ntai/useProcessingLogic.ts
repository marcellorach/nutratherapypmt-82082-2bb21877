
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
    addLogEntry(`🤖 Modelo: ${aiConfigs.modelName || 'gemini-2.5-flash'}, Temperature: ${aiConfigs.temperature || '0.7'}`);
    
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

        // VALIDAÇÃO CRÍTICA: Verificar se o estudo tem PDF
        if (!studyData.storage_path || studyData.storage_path.trim() === '') {
          addLogEntry(`❌ Estudo sem arquivo PDF: ${item.title}`);
          updatedQueue[index] = { 
            ...item, 
            stage: 'error', 
            progress: 0,
            error: 'Arquivo PDF não encontrado no storage'
          };
          setProcessQueue([...updatedQueue]);
          processNextItem(index + 1);
          return;
        }

        // PREVENIR RE-PROCESSAMENTO: Verificar se já foi processado
        if (studyData.kanban_status === 'processed' && studyData.analysis_data) {
          addLogEntry(`⚠️ Estudo já processado: ${item.title}`);
          updatedQueue[index] = { 
            ...item, 
            stage: 'complete', 
            progress: 100 
          };
          setProcessQueue([...updatedQueue]);
          
          toast({
            title: "Estudo já processado",
            description: `'${item.title}' já possui análise. Use "Resetar" para reprocessar.`,
            variant: "default",
          });
          
          processNextItem(index + 1);
          return;
        }

        // ETAPA 1: EXTRAÇÃO COM GEMINI
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 30 };
        setProcessQueue([...updatedQueue]);
        
        addLogEntry(`📤 Upload para Google Gemini File API: ${item.title}`);
        addLogEntry(`⏳ Aguardando processamento do PDF...`);
        addLogEntry(`🗄️ Criando/verificando corpus vetorizado (File Search Store)...`);
        addLogEntry(`📚 Adicionando documento ao índice semântico...`);
        addLogEntry(`⏳ Vetorização em andamento (embedding automático)...`);
        
        const { data: geminiData, error: geminiError } = await supabase.functions.invoke('gemini-file-search', {
          body: { 
            studyId: item.id,
            fileUrl: studyData.storage_path,
            fileName: studyData.original_filename
          }
        });
        
        if (geminiError) {
          const errorMsg = geminiError.message || String(geminiError);
          addLogEntry(`❌ Erro Google Gemini: ${errorMsg}`);
          updatedQueue[index] = { ...item, stage: 'error', progress: 0, error: errorMsg };
          setProcessQueue([...updatedQueue]);
          processNextItem(index + 1);
          return;
        }
        
        if (!geminiData || !geminiData.success) {
          const errorMsg = 'Google Gemini retornou dados inválidos';
          addLogEntry(`❌ ${errorMsg}`);
          updatedQueue[index] = { ...item, stage: 'error', progress: 0, error: errorMsg };
          setProcessQueue([...updatedQueue]);
          processNextItem(index + 1);
          return;
        }
        
        addLogEntry(`🔍 Query 1/3: Metadados básicos extraídos`);
        addLogEntry(`🔍 Query 2/3: Busca semântica de nutracêuticos (${geminiData.nutraceuticalsCount || 0} encontrados)`);
        addLogEntry(`🔍 Query 3/3: Busca semântica de condições (${geminiData.conditionsCount || 0} encontradas)`);
        addLogEntry(`✅ Extração File Search concluída: ${geminiData.nutraceuticalsCount || 0} nutracêuticos, ${geminiData.conditionsCount || 0} condições`);
        addLogEntry(`💾 Dados salvos no banco de dados`);
        addLogEntry(`✅ Arquivo mantido em corpus vetorizado para consultas futuras`);

        // VALIDAÇÃO CRÍTICA: Verificar se gemini-file-search populou analysis_data
        const { data: updatedStudyData, error: checkError } = await supabase
          .from('processed_studies')
          .select('analysis_data')
          .eq('id', item.id)
          .single();
        
        if (checkError || !updatedStudyData?.analysis_data) {
          const errorMsg = 'Gemini File Search não salvou dados no analysis_data';
          addLogEntry(`❌ ${errorMsg}`);
          updatedQueue[index] = { ...item, stage: 'error', progress: 0, error: errorMsg };
          setProcessQueue([...updatedQueue]);
          processNextItem(index + 1);
          return;
        }

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
