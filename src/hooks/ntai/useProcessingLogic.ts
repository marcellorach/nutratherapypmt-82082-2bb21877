
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
        title: "No items in queue",
        description: "Add studies to the queue before starting processing.",
        variant: "destructive",
      });
      return;
    }
    
    if (processQueue.some(item => 
      item.stage === 'extracting' || item.stage === 'analyzing' || item.stage === 'standardizing')) {
      toast({
        title: "Processing in progress",
        description: "Please wait for the current processing to complete.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingActive(true);
    const updatedQueue = [...processQueue];
    setAnalysisResult(null);
    
    addLogEntry('Starting processing with configurations:');
    addLogEntry(`🤖 Model: ${aiConfigs.modelName || 'gemini-3-pro-preview'}, Temperature: ${aiConfigs.temperature || '0.7'}`);
    
    const processNextItem = async (index: number) => {
      if (index >= updatedQueue.length) {
        setProcessingActive(false);
        setActiveItemIndex(-1);
        toast({
          title: "Processing complete",
          description: "All studies have been processed successfully.",
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
          throw new Error(`Error fetching study data: ${studyError.message}`);
        }
        
        if (!studyData) {
          throw new Error(`Study not found in database: ${item.id}`);
        }

        // CRITICAL VALIDATION: Check if study has PDF
        if (!studyData.storage_path || studyData.storage_path.trim() === '') {
          addLogEntry(`❌ Study without PDF file: ${item.title}`);
          updatedQueue[index] = { 
            ...item, 
            stage: 'error', 
            progress: 0,
            error: 'PDF file not found in storage'
          };
          setProcessQueue([...updatedQueue]);
          processNextItem(index + 1);
          return;
        }

        // PREVENT RE-PROCESSING: Check if already processed
        if (studyData.kanban_status === 'processed' && studyData.analysis_data) {
          addLogEntry(`⚠️ Study already processed: ${item.title}`);
          updatedQueue[index] = { 
            ...item, 
            stage: 'complete', 
            progress: 100 
          };
          setProcessQueue([...updatedQueue]);
          
          toast({
            title: "Study already processed",
            description: `'${item.title}' already has analysis. Use "Reset" to reprocess.`,
            variant: "default",
          });
          
          processNextItem(index + 1);
          return;
        }

        // STAGE 1: EXTRACTION WITH GEMINI (6 sub-stages with auto retry)
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 10 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`📥 [1/6] Downloading PDF from storage: ${item.title}`);
        
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 20 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`📤 [2/6] Sending to Gemini File API...`);
        
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 35 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`⏳ [3/6] Waiting for processing (may take up to 2min)...`);
        
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 50 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`🗄️ [4/6] Configuring File Search Store...`);
        
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 65 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`📚 [5/6] Vectorizing document (embedding)...`);
        
        updatedQueue[index] = { ...item, stage: 'extracting', progress: 80 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`🔍 [6/6] Extracting scientific data with AI...`);
        
        const { data: geminiData, error: geminiError } = await supabase.functions.invoke('gemini-file-search', {
          body: { 
            studyId: item.id,
            fileUrl: studyData.storage_path,
            fileName: studyData.original_filename
          }
        });
        
        if (geminiError) {
          const errorMsg = geminiError.message || String(geminiError);
          addLogEntry(`❌ [ERROR] Gemini File Search failed: ${errorMsg}`);
          
          // Contextual error messages
          if (errorMsg.includes('timeout')) {
            addLogEntry(`💡 Tip: PDF too large or slow network. Try again.`);
          } else if (errorMsg.includes('quota') || errorMsg.includes('rate')) {
            addLogEntry(`💡 Tip: API limit reached. Wait a few minutes.`);
          } else if (errorMsg.includes('Extração falhou')) {
            addLogEntry(`💡 Tip: PDF may be corrupted or without extractable text.`);
          }
          
          updatedQueue[index] = { 
            ...item, 
            stage: 'error', 
            progress: 0, 
            error: `Gemini File Search failed: ${errorMsg}. Function already retried 3x automatically.`
          };
          setProcessQueue([...updatedQueue]);
          processNextItem(index + 1);
          return;
        }
        
        if (!geminiData || !geminiData.success) {
          const errorMsg = geminiData?.error || 'Google Gemini returned invalid data';
          addLogEntry(`❌ [ERROR] Invalid Gemini response: ${errorMsg}`);
          updatedQueue[index] = { ...item, stage: 'error', progress: 0, error: errorMsg };
          setProcessQueue([...updatedQueue]);
          processNextItem(index + 1);
          return;
        }
        
        addLogEntry(`✅ [SUCCESS] Gemini completed: ${geminiData.nutraceuticalsCount || 0} nutraceuticals, ${geminiData.conditionsCount || 0} conditions`);
        addLogEntry(`📊 [INFO] ${geminiData.metadata?.retries_used || 'Auto retry active'}`);
        
        // AUTO-VECTORIZATION: Generate embeddings for RAG
        addLogEntry(`🔢 [AUTO-VECTORIZATION] Starting vectorization for RAG...`);
        try {
          const { data: vectorData, error: vectorError } = await supabase.functions.invoke('vectorize-study', {
            body: { studyId: item.id }
          });
          
          if (vectorError) {
            addLogEntry(`⚠️ [WARNING] Vectorization failed: ${vectorError.message} (study can still be used without semantic search)`);
          } else {
            addLogEntry(`✅ [VECTORIZATION] ${vectorData.chunksProcessed || 0} embeddings created for semantic search`);
          }
        } catch (vectorErr: any) {
          addLogEntry(`⚠️ [WARNING] Vectorization error: ${vectorErr.message} (not critical)`);
        }
        
        // CRITICAL VALIDATION: Check if analysis_data was saved correctly
        addLogEntry(`🔍 [VALIDATION] Checking saved data integrity...`);
        const { data: validationData, error: validationError } = await supabase
          .from('processed_studies')
          .select('analysis_data, title')
          .eq('id', item.id)
          .single();
        
        if (validationError || !validationData?.analysis_data) {
          const errorMsg = 'CRITICAL: Gemini File Search did not save data to analysis_data (NULL detected after processing).';
          addLogEntry(`❌ [CRITICAL ERROR] ${errorMsg}`);
          addLogEntry(`💡 [RECOMMENDATION] Use "Reset and Reprocess" - the error may be temporary`);
          
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
        addLogEntry(`✅ [VALIDATION PASSED] analysis_data confirmed (${(dataSize / 1024).toFixed(1)} KB}`);

        // STAGE 2: ANALYSIS
        updatedQueue[index] = { ...item, stage: 'analyzing', progress: 60 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`🧠 Analyzing: ${item.title}`);
        
        const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-study-entities', {
          body: { studyId: item.id }
        });

        if (extractError) {
          throw new Error(`Extraction error: ${extractError.message}`);
        }

        // 3-stage extraction
        const stages = extractData?.extractionStages || [];
        addLogEntry(`✅ Extraction complete: ${stages.length} stages executed`);
        addLogEntry(`📊 Stage 1: ${extractData?.extractedNutraceuticals?.length || 0} nutraceuticals, ${extractData?.extractedConditions?.length || 0} conditions`);
        
        if (extractData?.molecularMechanisms || extractData?.synergies) {
          addLogEntry(`🧬 Stage 2: ${extractData?.molecularMechanisms?.length || 0} mechanisms, ${extractData?.synergies?.length || 0} synergies`);
        }
        
        if (extractData?.dosages || extractData?.detailedSideEffects) {
          addLogEntry(`💊 Stage 3: ${extractData?.dosages?.length || 0} dosages, ${extractData?.detailedSideEffects?.length || 0} side effects`);
        }
        
        console.log('🔍 DEBUG - Extração 3 stages completa:', {
          stage1: `${extractData?.extractedNutraceuticals?.length || 0} nutracêuticos`,
          stage2: `${extractData?.molecularMechanisms?.length || 0} mecanismos`,
          stage3: `${extractData?.dosages?.length || 0} dosagens`
        });

        // STAGE 3: SAVING
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
        addLogEntry(`✅ Completed: ${item.title}`);
        
        toast({
          title: "Analysis completed",
          description: `'${item.title}' processed.`,
          variant: "default",
        });

      } catch (error: any) {
        addLogEntry(`[ERROR] ${item.title}: ${error.message}`);
        updatedQueue[index] = { 
          ...updatedQueue[index], 
          stage: 'error' as ProcessingStage, 
          progress: 50,
          error: error.message
        };
        setProcessQueue([...updatedQueue]);
        
        toast({
          title: "Error",
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
