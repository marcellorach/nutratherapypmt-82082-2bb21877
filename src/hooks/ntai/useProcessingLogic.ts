
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

        // ETAPA 1: EXTRAÇÃO COM GEMINI (6 sub-etapas com retry automático)
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 10 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`📥 [1/6] Baixando PDF do storage: ${item.title}`);
        
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 20 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`📤 [2/6] Enviando para Gemini File API...`);
        
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 35 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`⏳ [3/6] Aguardando processamento (pode levar até 2min)...`);
        
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 50 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`🗄️ [4/6] Configurando File Search Store...`);
        
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 65 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`📚 [5/6] Vetorizando documento (embedding)...`);
        
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 80 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`🔍 [6/6] Extraindo dados científicos com AI...`);
        
        const { data: geminiData, error: geminiError } = await supabase.functions.invoke('gemini-file-search', {
          body: { 
            studyId: item.id,
            fileUrl: studyData.storage_path,
            fileName: studyData.original_filename
          }
        });
        
        if (geminiError) {
          const errorMsg = geminiError.message || String(geminiError);
          addLogEntry(`❌ [ERRO] Gemini File Search falhou: ${errorMsg}`);
          
          // Mensagens contextuais de erro
          if (errorMsg.includes('timeout')) {
            addLogEntry(`💡 Dica: PDF muito grande ou rede lenta. Tente novamente.`);
          } else if (errorMsg.includes('quota') || errorMsg.includes('rate')) {
            addLogEntry(`💡 Dica: Limite de API atingido. Aguarde alguns minutos.`);
          } else if (errorMsg.includes('Extração falhou')) {
            addLogEntry(`💡 Dica: PDF pode estar corrompido ou sem texto extraível.`);
          }
          
          updatedQueue[index] = { 
            ...item, 
            stage: 'error', 
            progress: 0, 
            error: `Gemini File Search falhou: ${errorMsg}. A função já tentou 3x automaticamente.`
          };
          setProcessQueue([...updatedQueue]);
          processNextItem(index + 1);
          return;
        }
        
        if (!geminiData || !geminiData.success) {
          const errorMsg = geminiData?.error || 'Google Gemini retornou dados inválidos';
          addLogEntry(`❌ [ERRO] Resposta inválida do Gemini: ${errorMsg}`);
          updatedQueue[index] = { ...item, stage: 'error', progress: 0, error: errorMsg };
          setProcessQueue([...updatedQueue]);
          processNextItem(index + 1);
          return;
        }
        
        addLogEntry(`✅ [SUCESSO] Gemini concluído: ${geminiData.nutraceuticalsCount || 0} nutracêuticos, ${geminiData.conditionsCount || 0} condições`);
        addLogEntry(`📊 [INFO] ${geminiData.metadata?.retries_used || 'Retry automático ativo'}`);
        
        // VETORIZAÇÃO AUTOMÁTICA: Gerar embeddings para RAG
        addLogEntry(`🔢 [AUTO-VETORIZAÇÃO] Iniciando vetorização para RAG...`);
        try {
          const { data: vectorData, error: vectorError } = await supabase.functions.invoke('vectorize-study', {
            body: { studyId: item.id }
          });
          
          if (vectorError) {
            addLogEntry(`⚠️ [ALERTA] Vetorização falhou: ${vectorError.message} (estudo ainda pode ser usado sem busca semântica)`);
          } else {
            addLogEntry(`✅ [VETORIZAÇÃO] ${vectorData.chunksProcessed || 0} embeddings criados para busca semântica`);
          }
        } catch (vectorErr: any) {
          addLogEntry(`⚠️ [ALERTA] Erro na vetorização: ${vectorErr.message} (não crítico)`);
        }
        
        // VALIDAÇÃO CRÍTICA: Verificar se analysis_data foi salvo corretamente
        addLogEntry(`🔍 [VALIDAÇÃO] Verificando integridade dos dados salvos...`);
        const { data: validationData, error: validationError } = await supabase
          .from('processed_studies')
          .select('analysis_data, title')
          .eq('id', item.id)
          .single();
        
        if (validationError || !validationData?.analysis_data) {
          const errorMsg = 'CRITICAL: Gemini File Search não salvou dados em analysis_data (NULL detectado após processamento).';
          addLogEntry(`❌ [ERRO CRÍTICO] ${errorMsg}`);
          addLogEntry(`💡 [RECOMENDAÇÃO] Use "Resetar e Reprocessar" - o erro pode ser temporário`);
          
          updatedQueue[index] = { 
            ...item, 
            stage: 'error', 
            progress: 0, 
            error: errorMsg 
          };
          setProcessQueue([...updatedQueue]);
          processNextItem(index + 1);
          return;
        }
        
        const dataSize = JSON.stringify(validationData.analysis_data).length;
        addLogEntry(`✅ [VALIDAÇÃO APROVADA] analysis_data confirmado (${(dataSize / 1024).toFixed(1)} KB)`);

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

        // Extração em 3 stages
        const stages = extractData?.extractionStages || [];
        addLogEntry(`✅ Extração completa: ${stages.length} stages executados`);
        addLogEntry(`📊 Stage 1: ${extractData?.extractedNutraceuticals?.length || 0} nutracêuticos, ${extractData?.extractedConditions?.length || 0} condições`);
        
        if (extractData?.molecularMechanisms || extractData?.synergies) {
          addLogEntry(`🧬 Stage 2: ${extractData?.molecularMechanisms?.length || 0} mecanismos, ${extractData?.synergies?.length || 0} sinergias`);
        }
        
        if (extractData?.dosages || extractData?.detailedSideEffects) {
          addLogEntry(`💊 Stage 3: ${extractData?.dosages?.length || 0} dosagens, ${extractData?.detailedSideEffects?.length || 0} efeitos colaterais`);
        }
        
        console.log('🔍 DEBUG - Extração 3 stages completa:', {
          stage1: `${extractData?.extractedNutraceuticals?.length || 0} nutracêuticos`,
          stage2: `${extractData?.molecularMechanisms?.length || 0} mecanismos`,
          stage3: `${extractData?.dosages?.length || 0} dosagens`
        });

        // ETAPA 3: SALVAMENTO
        updatedQueue[index] = { ...item, stage: 'standardizing', progress: 90 };
        setProcessQueue([...updatedQueue]);

        const result = {
          studyId: item.id,
          qualityScore: extractData?.qualityScore || 0,
          relevanceScore: extractData?.relevanceScore || 0,
          // Stage 1
          extractedNutraceuticals: extractData?.extractedNutraceuticals || [],
          extractedConditions: extractData?.extractedConditions || [],
          extractedInteractions: extractData?.extractedInteractions || [],
          extractedSideEffects: extractData?.extractedSideEffects || [],
          // Stage 2
          molecularMechanisms: extractData?.molecularMechanisms || [],
          synergies: extractData?.synergies || [],
          hierarchicalRelations: extractData?.hierarchicalRelations || [],
          // Stage 3
          dosages: extractData?.dosages || [],
          detailedSideEffects: extractData?.detailedSideEffects || [],
          contraindications: extractData?.contraindications || [],
          clinicalOutcomes: extractData?.clinicalOutcomes || [],
          studyAssessment: extractData?.studyAssessment || {},
          // Metadata
          extractionStages: extractData?.extractionStages || []
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
