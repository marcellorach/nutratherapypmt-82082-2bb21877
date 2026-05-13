
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Settings, FileText, Microscope, GitBranch, Database, ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNtaiProcessing } from '@/hooks/useNtaiProcessing';
import { useAvailableStudies } from '@/hooks/ntai/useAvailableStudies';
import { useStudyDeletion } from '@/hooks/useStudyDeletion';
import NtaiProcessCard from './NtaiProcessCard';
import NtaiActiveProcessingCard from './NtaiActiveProcessingCard';
import NtaiAnalysisResults from './NtaiAnalysisResults';
import NtaiStudySelectionTable from './NtaiStudySelectionTable';
import NtaiQueueControls from './NtaiQueueControls';
import NtaiPipelineVisualization from './NtaiPipelineVisualization';
import BulkDeleteConfirmDialog from '../BulkDeleteConfirmDialog';
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
  const { softDeleteMultiple, previewDeletion, isDeleting } = useStudyDeletion();
  
  // State para modal de confirmação de delete em massa
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studiesToDelete, setStudiesToDelete] = useState<Array<{ id: string; title: string; kanban_status: string }>>([]);
  
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
    { name: '🔗 Triplets', status: 'pending', description: 'Senex AI triplet generation' },
    { name: '✅ Complete', status: 'pending', description: 'Data extracted and saved' },
  ]);
  const { toast } = useToast();

  // Handler para iniciar o processo de delete (abre modal de confirmação)
  const handleDeleteStudiesClick = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: t('studies.vetgraphrag.noStudiesSelected'),
        variant: "destructive",
      });
      return;
    }

    // Buscar preview dos estudos que serão deletados
    const preview = await previewDeletion(selectedItems);
    setStudiesToDelete(preview);
    setShowDeleteConfirm(true);
  };

  // Handler de confirmação final do delete
  const handleConfirmDelete = async () => {
    const result = await softDeleteMultiple(selectedItems, undefined, { allowApproved: false });
    
    if (result.success) {
      setShowDeleteConfirm(false);
      setStudiesToDelete([]);
      // Limpar seleção e recarregar
      await refreshAvailableStudies();
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

      // Stage 3: Generate Senex AI Triplets
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
        description: `Extracted ${extractData.counts?.nutraceuticals || 0} nutraceuticals, ${extractData.counts?.conditions || 0} conditions, ${tripletCount} Senex AI triplets`,
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
        description: 'Starting Senex AI triplet generation...',
      });

      // Step 1: Generate triplets
      const { data, error } = await supabase.functions.invoke('generate-triplets', {
        body: { studyId }
      });

      if (error) throw error;

      const tripletsGenerated = data?.tripletsGenerated || 0;
      
      toast({
        title: 'Triplets Generated',
        description: `Generated ${tripletsGenerated} hierarchical triplets (${data?.autoApprovedCount || 0} auto-approved)`,
      });

      // Step 2: Sync to Neo4J immediately
      if (tripletsGenerated > 0) {
        toast({
          title: 'Syncing to Neo4J',
          description: 'Sending triplets to knowledge graph...',
        });

        const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-study-to-neo4j', {
          body: { studyId }
        });

        if (syncError) {
          console.error('Neo4J sync error:', syncError);
          toast({
            title: 'Neo4J Sync Warning',
            description: `Triplets generated but sync failed: ${syncError.message}`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Neo4J Sync Complete',
            description: `${syncData?.synced || 0} triplets synchronized to knowledge graph`,
          });
        }
      }
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
            <h3 className="text-lg font-medium">{t('studies.vetgraphrag.processing.title')}</h3>
            <Badge className="ml-2 bg-blue-50 text-blue-700 border-blue-200" variant="outline">
              🤖 Gemini 3 Pro Preview
            </Badge>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span>{t('studies.vetgraphrag.settings')}</span>
          </Button>
        </div>
        
        {/* Processing Pipeline - Compact Vertical */}
        <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-4 rounded-lg border border-blue-200/60">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-blue-900">🧬 VetGraphRAG Digestion Pipeline</h4>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-blue-500">Gemini 3 Pro Preview</span>
              <span className={processingActive ? "text-green-600 font-medium" : "text-gray-400"}>{processingActive ? '● Processing' : '● Idle'}</span>
            </div>
          </div>
          
          <div className="space-y-0">
            {([
              { step: 1, Icon: FileText, iconBg: 'bg-sky-100', iconColor: 'text-sky-600', borderColor: 'border-sky-200' },
              { step: 2, Icon: Microscope, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', borderColor: 'border-amber-200' },
              { step: 3, Icon: GitBranch, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', borderColor: 'border-emerald-200' },
              { step: 4, Icon: Database, iconBg: 'bg-rose-100', iconColor: 'text-rose-600', borderColor: 'border-rose-200' },
            ] as const).map(({ step, Icon, iconBg, iconColor, borderColor }, index) => (
              <Collapsible key={step}>
                <div className="flex items-start gap-3 py-2">
                  {/* Vertical connector line + icon */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-md ${iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                    </div>
                    {index < 3 && <div className="w-px h-3 bg-gray-200 mt-1" />}
                  </div>
                  
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <CollapsibleTrigger className="flex items-center gap-2 w-full group cursor-pointer">
                      <span className="text-[10px] font-bold text-gray-300">0{step}</span>
                      <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                        {t(`studies.vetgraphrag.processing.step${step}Title`)}
                      </span>
                      <span className="text-[10px] text-gray-400 hidden sm:inline">—</span>
                      <span className="text-[10px] text-gray-500 truncate hidden sm:inline">
                        {t(`studies.vetgraphrag.processing.step${step}Badge`)}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-1 group-data-[state=open]:hidden">{t('studies.vetgraphrag.processing.expand', '(expandir)')}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-gray-600 ml-auto transition-transform group-data-[state=open]:rotate-180 flex-shrink-0`} />
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-1.5">
                      <p className={`text-[11px] leading-relaxed text-gray-600 pl-5 border-l-2 ${borderColor} ml-1`}>
                        {t(`studies.vetgraphrag.processing.step${step}Desc`)}
                      </p>
                    </CollapsibleContent>
                  </div>
                </div>
              </Collapsible>
            ))}
          </div>
        </div>
        
        {processingStudy && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">{t('studies.vetgraphrag.processing.pipeline')}</h4>
            <NtaiPipelineVisualization stages={pipelineStages} />
          </div>
        )}
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium">{t('studies.vetgraphrag.availableStudies')}</h4>
          <NtaiStudySelectionTable 
            estudos={availableStudies}
            selectedItems={selectedItems}
            onToggleSelection={toggleItemSelection}
            onSelectAll={() => handleSelectAll(availableStudies)}
            onAddToQueue={addToQueue}
            onDelete={handleDeleteStudiesClick}
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
              {t('studies.vetgraphrag.queueEmpty')}
            </div>
          )}
        </div>
        
        {/* Resultados da análise */}
        {analysisResult && (
          <div className="mt-8 border-t pt-4">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-medium">{t('studies.vetgraphrag.analysisResults')}</h3>
            </div>
            <NtaiAnalysisResults result={analysisResult} />
            
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <h4 className="text-sm font-medium text-amber-800 mb-2">{t('studies.vetgraphrag.curationWarningTitle')}</h4>
              <p className="text-xs text-amber-700">
                {t('studies.vetgraphrag.curationWarning')}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal de confirmação de delete em massa */}
      <BulkDeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        studies={studiesToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </Card>
  );
};

export default NtaiProcessingSection;
