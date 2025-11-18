
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
        // ============================================
        // ORDEM CORRETA: Unstructured → LLM → Salvar
        // ============================================
        
        // Buscar dados do estudo no banco
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

        // ETAPA 1: EXTRAÇÃO DE TEXTO (Unstructured.io)
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 30 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`🔍 Extraindo texto com Unstructured.io: ${item.title}`);
        
        const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-study', {
          body: { 
            studyId: item.id, 
            storagePath: studyData.storage_path 
          }
        });

        if (parseError) {
          const errorMsg = parseError.message || String(parseError);
          const isDnsError = errorMsg.includes('dns error') || 
                             errorMsg.includes('Name or service not known') ||
                             errorMsg.includes('DNS_RESOLUTION_FAILURE');
          
          addLogEntry(`[ERRO] Parsing: ${errorMsg}`);
          
          if (isDnsError) {
            addLogEntry('[INFO] ⚠️ Erro de DNS detectado - Este é um problema temporário de infraestrutura');
            addLogEntry('[INFO] 💡 Use "Tentar Novamente" em alguns minutos ou aguarde estabilização');
          }
          
          updatedQueue[index] = { ...item, stage: 'error', progress: 0, error: errorMsg };
          setProcessQueue([...updatedQueue]);
          processNextItem(index + 1);
          return;
        }

        if (!parseData) {
          throw new Error('Serviço de parsing não retornou resposta');
        }

        if (parseData.error) {
          throw new Error(`Erro no parsing: ${parseData.error} - ${parseData.details || ''}`);
        }

        if (!parseData.parsedData && !parseData.success) {
          throw new Error('Parsing não retornou dados estruturados');
        }

        addLogEntry(`✅ Parsing concluído: ${parseData.sectionsCount || 0} seções, ${parseData.tablesCount || 0} tabelas`);

        // ETAPA 2: ANÁLISE COM LLM (extract-study-entities)
        updatedQueue[index] = { ...item, stage: 'analyzing', progress: 60 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`🧠 Analisando entidades com IA: ${item.title}`);
        
        const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-study-entities', {
          body: { 
            studyId: item.id
          }
        });

        if (extractError) {
          throw new Error(`Erro na extração de entidades: ${extractError.message}`);
        }

        addLogEntry(`✅ Entidades extraídas: ${extractData?.nutraceuticals?.length || 0} nutracêuticos, ${extractData?.conditions?.length || 0} condições`);

        // ETAPA 3: PADRONIZAÇÃO E SALVAMENTO
        updatedQueue[index] = { ...item, stage: 'standardizing', progress: 90 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`📊 Padronizando dados: ${item.title}`);

        // Criar resultado consolidado (usando dados do extract-study-entities)
        const result = {
          studyId: item.id,
          qualityScore: extractData?.qualityScore || 0,
          relevanceScore: 0, // Não temos relevance score ainda
          extractedNutraceuticals: extractData?.nutraceuticals || [],
          extractedConditions: extractData?.conditions || [],
          extractedInteractions: [], // extract-study-entities não retorna interactions
          extractedSideEffects: [] // extract-study-entities não retorna sideEffects
        };
        
        setAnalysisResult(result);
        
        // Salvar análise completa no banco
        const updateSuccess = await updateProcessedStudy(item.id, result);
        if (!updateSuccess) {
          addLogEntry(`[AVISO] Análise concluída, mas houve erro ao salvar: ${item.title}`);
        }
        
        updatedQueue[index] = { ...updatedQueue[index], stage: 'complete' as ProcessingStage, progress: 100 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`✅ Processamento NTAI concluído para: ${item.title}`);
        
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
