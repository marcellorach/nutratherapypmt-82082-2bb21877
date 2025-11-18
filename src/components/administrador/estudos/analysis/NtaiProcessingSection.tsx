
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ArrowRight, Settings, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNtaiProcessing } from '@/hooks/useNtaiProcessing';
import NtaiProcessCard from './NtaiProcessCard';
import NtaiProcessingLog from './NtaiProcessingLog';
import NtaiAnalysisResults from './NtaiAnalysisResults';
import NtaiStudySelectionTable from './NtaiStudySelectionTable';
import NtaiQueueControls from './NtaiQueueControls';
import NtaiPipelineVisualization from './NtaiPipelineVisualization';
import ParsedDataViewer from './ParsedDataViewer';
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
  } = useNtaiProcessing();

  type PipelineStageStatus = 'pending' | 'processing' | 'complete' | 'error';
  
  interface PipelineStage {
    name: string;
    status: PipelineStageStatus;
    description: string;
  }
  
  const [logVisible, setLogVisible] = React.useState(false);
  const [processingStudy, setProcessingStudy] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { name: '📤 Upload PDF', status: 'pending', description: 'Arquivo enviado para storage' },
    { name: '🔍 Parse (Unstructured)', status: 'pending', description: 'Extração de texto e estrutura' },
    { name: '🧠 AI Analysis (LLM)', status: 'pending', description: 'Identificação de entidades' },
    { name: '✓ Quality Check', status: 'pending', description: 'Validação de qualidade' },
    { name: '📋 Ready', status: 'pending', description: 'Aguardando revisão' },
  ]);
  const { toast } = useToast();
  
  const toggleLogVisibility = () => setLogVisible(!logVisible);

  const handleProcessWithAI = async (studyId: string, storagePath: string) => {
    setProcessingStudy(studyId);
    
    // Reset pipeline
    setPipelineStages(stages => stages.map(s => ({ ...s, status: 'pending' as const })));

    try {
      // Stage 1: Upload (already done, mark complete)
      setPipelineStages(stages => stages.map((s, i) => 
        i === 0 ? { ...s, status: 'complete' as const } : s
      ));

      // Stage 2: Parse with Unstructured
      setPipelineStages(stages => stages.map((s, i) => 
        i === 1 ? { ...s, status: 'processing' as const } : s
      ));

      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-study', {
        body: { studyId, storagePath }
      });

      if (parseError) throw new Error(`Parse failed: ${parseError.message}`);
      
      // Armazenar dados do parsing
      if (parseData?.parsedData) {
        setParsedData(parseData.parsedData);
      }
      
      setPipelineStages(stages => stages.map((s, i) => 
        i === 1 ? { ...s, status: 'complete' as const } : s
      ));

      // Stage 3: Extract with AI
      setPipelineStages(stages => stages.map((s, i) => 
        i === 2 ? { ...s, status: 'processing' as const } : s
      ));

      const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-study-entities', {
        body: { studyId }
      });

      if (extractError) throw new Error(`Extraction failed: ${extractError.message}`);

      setPipelineStages(stages => stages.map((s, i) => 
        i === 2 ? { ...s, status: 'complete' as const } : 
        i === 3 ? { ...s, status: 'complete' as const } : 
        i === 4 ? { ...s, status: 'complete' as const } : s
      ));

      toast({
        title: 'Processing Complete',
        description: `Extracted ${extractData.counts.nutraceuticals} nutraceuticals, ${extractData.counts.conditions} conditions`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      setPipelineStages(stages => stages.map((s, i) => 
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

  return (
    <Card id="ntai-processing-section" className="transition-all">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-medium">{t('studies.rag.processing')}</h3>
            <Badge className="ml-2 bg-purple-100 text-purple-800" variant="outline">
              {aiConfigs.modelName || 'GPT-4o'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleLogVisibility}>
              {logVisible ? t('studies.ntai.hideLog') : t('studies.ntai.showLog')}
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span>{t('studies.ntai.settings')}</span>
            </Button>
          </div>
        </div>
        
        {/* Mostra informações sobre o processamento atual */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h4 className="text-sm font-medium mb-2">{t('studies.ntai.infoTitle')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">{t('studies.ntai.model')}:</span> {aiConfigs.modelName || 'GPT-4o'}
            </div>
            <div>
              <span className="text-gray-500">{t('studies.ntai.temperature')}:</span> {aiConfigs.temperature || '0.7'}
            </div>
            <div>
              <span className="text-gray-500">{t('studies.ntai.status')}:</span> {processingActive ? t('studies.ntai.active') : t('studies.ntai.inactive')}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {t('studies.ntai.promptsInfo')}
          </div>
        </div>
        
        {logVisible && <NtaiProcessingLog entries={logEntries} />}
        
        {processingStudy && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Processing Pipeline</h4>
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
            onStartProcessing={startProcessing}
          />
          
          {processQueue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processQueue.map((item, index) => (
                <NtaiProcessCard 
                  key={`${item.id}-${index}`} 
                  item={item} 
                  isActive={index === activeItemIndex}
                />
              ))}
            </div>
          ) : (
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
