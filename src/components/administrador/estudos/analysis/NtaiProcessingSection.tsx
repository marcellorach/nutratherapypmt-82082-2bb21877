
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ArrowRight, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNtaiProcessing } from '@/hooks/useNtaiProcessing';
import { useAvailableStudies } from '@/hooks/ntai/useAvailableStudies';
import NtaiProcessCard from './NtaiProcessCard';
import NtaiActiveProcessingCard from './NtaiActiveProcessingCard';
import NtaiAnalysisResults from './NtaiAnalysisResults';
import NtaiStudySelectionTable from './NtaiStudySelectionTable';
import NtaiQueueControls from './NtaiQueueControls';
import NtaiPipelineVisualization from './NtaiPipelineVisualization';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const NtaiProcessingSection: React.FC = () => {
  const { t } = useTranslation();
  
  const {
    processQueue,
    selectedItems,
    processingActive,
    logEntries,
    clearLogs,
    exportLogs,
    activeItemIndex,
    analysisResult,
    aiConfigs,
    calculatedProgress,
    toggleItemSelection,
    handleSelectAll,
    addToQueue,
    clearCompleted,
    retryFailed,
    clearFailed,
    removeFromQueue,
    startProcessing,
  } = useNtaiProcessing();

  const { availableStudies, refreshAvailableStudies } = useAvailableStudies();
  
  useEffect(() => {
    refreshAvailableStudies();
  }, []);

  type PipelineStageStatus = 'pending' | 'processing' | 'complete' | 'error';
  
  interface PipelineStage {
    name: string;
    status: PipelineStageStatus;
    description: string;
  }
  
  const [processingStudy, setProcessingStudy] = useState<string | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { name: '📤 Upload', status: 'pending', description: 'File in Supabase storage' },
    { name: '🤖 Gemini AI', status: 'pending', description: 'Entity extraction with AI' },
    { name: '🔗 Triplets', status: 'pending', description: 'VetGraphRAG triplet generation' },
    { name: '✅ Complete', status: 'pending', description: 'Data extracted and saved' },
  ]);
  const { toast } = useToast();

  const handleDeleteStudies = async () => {
    try {
      // Deletar estudos e suas relações
      const { error } = await supabase
        .from('processed_studies')
        .delete()
        .in('id', selectedItems);

      if (error) throw error;

      toast({
        title: t('studies.ntai.deleteSuccess'),
        description: t('studies.ntai.deleteSuccessDescription', { count: selectedItems.length }),
      });

      // Recarregar lista de estudos
      await refreshAvailableStudies();
    } catch (error) {
      console.error('Error deleting studies:', error);
      toast({
        title: t('studies.ntai.deleteError'),
        description: t('studies.ntai.deleteErrorDescription'),
        variant: "destructive",
      });
    }
  };

  const handleProcessWithAI = async (studyId: string, storagePath: string) => {
    setProcessingStudy(studyId);
    
    // Reset pipeline
    setPipelineStages(stages => stages.map(s => ({ ...s, status: 'pending' as const })));

    try {
      // Stage 1: Upload (already done, mark complete)
      setPipelineStages(stages => stages.map((s, i) => 
        i === 0 ? { ...s, status: 'complete' as const } : s
      ));

      // Stage 2: Parse with AI
      setPipelineStages(stages => stages.map((s, i) => 
        i === 1 ? { ...s, status: 'processing' as const } : s
      ));

      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-study', {
        body: { studyId, storagePath }
      });

      if (parseError) throw new Error(`Parse failed: ${parseError.message}`);
      
      // Stage 2 complete, start entity extraction
      setPipelineStages(stages => stages.map((s, i) =>
        i === 1 ? { ...s, status: 'complete' as const } : s
      ));

      const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-study-entities', {
        body: { studyId }
      });

      if (extractError) throw new Error(`Extraction failed: ${extractError.message}`);

      // Stage 3: Generate VetGraphRAG Triplets
      setPipelineStages(stages => stages.map((s, i) => 
        i === 2 ? { ...s, status: 'processing' as const } : s
      ));

      const { data: tripletData, error: tripletError } = await supabase.functions.invoke('generate-triplets', {
        body: { studyId }
      });

      if (tripletError) {
        console.warn('Triplet generation warning:', tripletError.message);
        // Continue even if triplet generation fails
        setPipelineStages(stages => stages.map((s, i) => 
          i === 2 ? { ...s, status: 'error' as const } : s
        ));
      } else {
        setPipelineStages(stages => stages.map((s, i) => 
          i === 2 ? { ...s, status: 'complete' as const } : s
        ));
      }

      // Stage 4: Complete
      setPipelineStages(stages => stages.map((s, i) => 
        i === 3 ? { ...s, status: 'complete' as const } : s
      ));

      const tripletCount = tripletData?.tripletsGenerated || 0;
      toast({
        title: 'Processing Complete',
        description: `Extracted ${extractData.counts?.nutraceuticals || 0} nutraceuticals, ${extractData.counts?.conditions || 0} conditions, ${tripletCount} VetGraphRAG triplets`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      setPipelineStages(stages => stages.map((s) => 
        s.status === 'processing' ? { ...s, status: 'error' as const } : s
      ));
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setProcessingStudy(null);
    }
  };

  const handleRegenerateVetGraphRAG = async (studyId: string) => {
    try {
      toast({
        title: 'Regenerating Triplets',
        description: 'Starting VetGraphRAG triplet generation...',
      });

      const { data, error } = await supabase.functions.invoke('generate-triplets', {
        body: { studyId }
      });

      if (error) throw error;

      toast({
        title: 'Triplets Generated',
        description: `Generated ${data.tripletsGenerated} hierarchical triplets (${data.autoApprovedCount} auto-approved)`,
      });
    } catch (error) {
      console.error('Regenerate error:', error);
      toast({
        title: 'Regeneration Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card id="ntai-processing-section" className="transition-all">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium">{t('studies.ntai.processing.title')}</h3>
            <Badge className="ml-2 bg-blue-50 text-blue-700 border-blue-200" variant="outline">
              🤖 Gemini 3 Pro Preview
            </Badge>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span>{t('studies.ntai.settings')}</span>
          </Button>
        </div>
        
        {/* Processing info */}
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <h4 className="text-sm font-medium mb-2 text-blue-900">{t('studies.ntai.processing.info')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">{t('studies.ntai.processing.model')}:</span> <span className="text-blue-900">Google Gemini 3 Pro Preview</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{t('studies.ntai.processing.status')}:</span> <span className="text-blue-900">{processingActive ? t('studies.ntai.processing.statusProcessing') : t('studies.ntai.processing.statusIdle')}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-700">
            {t('studies.ntai.processing.description')}
          </div>
        </div>
        
        {processingStudy && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">{t('studies.ntai.processing.pipeline')}</h4>
            <NtaiPipelineVisualization stages={pipelineStages} />
          </div>
        )}
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium">{t('studies.ntai.availableStudies')}</h4>
          <NtaiStudySelectionTable 
            estudos={availableStudies}
            selectedItems={selectedItems}
            onToggleSelection={toggleItemSelection}
            onSelectAll={() => handleSelectAll(availableStudies)}
            onAddToQueue={addToQueue}
            onDelete={handleDeleteStudies}
            onRegenerateVetGraphRAG={handleRegenerateVetGraphRAG}
          />
        </div>
        
        <div className="space-y-4">
        <NtaiQueueControls 
          queueLength={processQueue.length}
          processingActive={processingActive}
          hasCompletedItems={processQueue.some(item => item.stage === 'complete')}
          hasFailedItems={processQueue.some(item => item.stage === 'error')}
          onClearCompleted={clearCompleted}
          onRetryFailed={retryFailed}
          onClearFailed={clearFailed}
          onStartProcessing={startProcessing}
        />
          
          {/* Active Processing Card - Full Width with Integrated Log */}
          {processingActive && activeItemIndex >= 0 && processQueue[activeItemIndex] && (
            <NtaiActiveProcessingCard
              item={processQueue[activeItemIndex]}
              logEntries={logEntries}
              calculatedProgress={calculatedProgress}
              onClearLog={clearLogs}
              onExportLog={exportLogs}
            />
          )}

          {/* Queue cards for non-active items */}
          {processQueue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processQueue
                .filter((_, index) => !(processingActive && index === activeItemIndex))
                .map((item, index) => (
                  <NtaiProcessCard 
                    key={`${item.id}-${index}`} 
                    item={item} 
                    isActive={false}
                    onRemove={removeFromQueue}
                  />
                ))}
            </div>
          ) : !processingActive && (
            <div className="border rounded-md p-8 text-center text-gray-500">
              {t('studies.ntai.queueEmpty')}
            </div>
          )}
        </div>
        
        {/* Resultados da análise */}
        {analysisResult && (
          <div className="mt-8 border-t pt-4">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-medium">{t('studies.ntai.analysisResults')}</h3>
              <ArrowRight className="mx-2 h-4 w-4 text-gray-400" />
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {t('studies.ntai.cardGenerated')}
              </Badge>
            </div>
            <NtaiAnalysisResults result={analysisResult} />
            
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="text-sm font-medium text-green-800 mb-2">{t('studies.ntai.cardAdded')}</h4>
              <p className="text-xs text-green-700">
                {t('studies.ntai.cardAddedDesc')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NtaiProcessingSection;
