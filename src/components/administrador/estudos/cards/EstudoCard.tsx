import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowRight, ArrowLeft, Sparkles, Loader2, CheckCircle2, AlertCircle, Trash2, Clock, Database, FileText, Brain } from 'lucide-react';
import EvidenceTag from '../../tags/EvidenceTag';
import NutraceuticalTag from '../../tags/NutraceuticalTag';
import OutcomeTag from '../../tags/OutcomeTag';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from 'react-i18next';
import { useGeminiProcessing } from '@/hooks/useGeminiProcessing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EstudoCardProps {
  estudo: any;
  onView: (estudo: any) => void;
  buttonLabel?: string;
  getNutraceuticalScore: (name: string) => number;
  onDelete?: (estudoId: string) => void;
}

const EstudoCard: React.FC<EstudoCardProps> = ({ 
  estudo, 
  onView, 
  buttonLabel,
  getNutraceuticalScore,
  onDelete 
}) => {
  const { t } = useTranslation();
  const { processStudy, processing, progress } = useGeminiProcessing();
  const [localEstudo, setLocalEstudo] = useState(estudo);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [isDeleting, setIsDeleting] = useState(false);
  const [embeddingsCount, setEmbeddingsCount] = useState<number | null>(null);
  const [checkingEmbeddings, setCheckingEmbeddings] = useState(false);
  const [tripletCount, setTripletCount] = useState<number | null>(null);

  // Update local estudo when prop changes
  useEffect(() => {
    setLocalEstudo(estudo);
    checkVectorizationStatus();
    loadTripletCount();
  }, [estudo]);

  const checkVectorizationStatus = async () => {
    if (!localEstudo.id) return;
    setCheckingEmbeddings(true);
    try {
      const { count, error } = await supabase
        .from('study_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('study_id', localEstudo.id);
      
      if (!error) {
        setEmbeddingsCount(count || 0);
      }
    } catch (error) {
      console.error('Error checking embeddings:', error);
    } finally {
      setCheckingEmbeddings(false);
    }
  };

  const loadTripletCount = async () => {
    if (!localEstudo.id) return;
    try {
      const { count, error } = await supabase
        .from('triplet_extractions')
        .select('*', { count: 'exact', head: true })
        .eq('study_id', localEstudo.id);
      if (!error) setTripletCount(count || 0);
    } catch (error) {
      console.error('Error loading triplet count:', error);
    }
  };

  const handleVectorize = async () => {
    try {
      toast.loading(t('studies.card.vectorizing'), { id: 'vectorize' });
      const { data, error } = await supabase.functions.invoke('vectorize-study', {
        body: { studyId: localEstudo.id }
      });
      
      if (error) throw error;
      
      toast.success(t('studies.card.embeddingsCreated', { count: data.chunksProcessed }), { id: 'vectorize' });
      await checkVectorizationStatus();
    } catch (error: any) {
      console.error('Error vectorizing:', error);
      toast.error(t('studies.card.vectorizeError'), { id: 'vectorize' });
    }
  };

  // Check if study needs processing (uploaded but not processed)
  const needsProcessing = localEstudo.kanban_status === 'new' && !localEstudo.analysis_data;
  const isProcessing = processing[localEstudo.id] || false;
  const currentProgress = progress[localEstudo.id] || 0;

  const handleGeminiProcess = async () => {
    setProcessingStatus('processing');
    try {
      await processStudy(localEstudo.id, localEstudo.storage_path, localEstudo.original_filename);
      
      // Fetch updated study data
      const { data: updatedStudy, error } = await supabase
        .from('processed_studies')
        .select('*')
        .eq('id', localEstudo.id)
        .single();

      if (!error && updatedStudy) {
        setLocalEstudo(updatedStudy);
        setProcessingStatus('success');
      }
    } catch (error) {
      console.error('Error processing study:', error);
      setProcessingStatus('error');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete from study_extractions first (if exists)
      await supabase
        .from('study_extractions')
        .delete()
        .eq('study_id', localEstudo.id);

      // Delete the study
      const { error } = await supabase
        .from('processed_studies')
        .delete()
        .eq('id', localEstudo.id);

      if (error) throw error;

      toast.success(t('studies.card.deleteSuccess'));
      
      // Notify parent component if callback provided
      if (onDelete) {
        onDelete(localEstudo.id);
      }
    } catch (error) {
      console.error('Error deleting study:', error);
      toast.error(t('studies.card.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Extract data from Gemini analysis or use defaults
  const analysisData = localEstudo.analysis_data as any;
  const nutraceuticals = analysisData?.extractedNutraceuticals || [];
  const conditions = analysisData?.extractedConditions || [];
  const interactions = analysisData?.extractedInteractions || [];
  const sideEffects = analysisData?.extractedSideEffects || [];
  const mechanisms = analysisData?.molecularMechanisms || [];
  const clinicalOutcomes = analysisData?.clinicalOutcomes || [];
  const hasAnalysisData = !!analysisData && (nutraceuticals.length > 0 || conditions.length > 0);

  // Summary text - try multiple sources in priority order
  const getSummaryText = (): string => {
    // 1. From study_summary (new extraction format)
    if (analysisData?.study_summary?.summary) return analysisData.study_summary.summary;
    if (analysisData?.study_summary?.main_findings) return analysisData.study_summary.main_findings;
    if (analysisData?.studySummary?.summary) return analysisData.studySummary.summary;
    
    // 2. From description if it's not the default placeholder
    const desc = localEstudo.description;
    if (desc && desc !== 'Awaiting processing' && desc !== 'Aguardando processamento' && desc.length > 20) {
      return desc;
    }
    
    // 3. Extract first meaningful sentences from full_text_content
    if (localEstudo.full_text_content) {
      const text = localEstudo.full_text_content as string;
      // Skip markdown headers and metadata lines
      const lines = text.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 30 && 
               !trimmed.startsWith('#') && 
               !trimmed.startsWith('**Authors') && 
               !trimmed.startsWith('**Year') && 
               !trimmed.startsWith('**Journal') &&
               !trimmed.startsWith('**DOI');
      });
      if (lines.length > 0) {
        // Take first 2-3 sentences (up to ~300 chars)
        const excerpt = lines.slice(0, 3).join(' ').substring(0, 300);
        return excerpt.endsWith('.') ? excerpt : excerpt + '...';
      }
    }
    
    return '';
  };
  const summaryText = getSummaryText();

  // Processing time calculation
  const processingTime = localEstudo.created_at && localEstudo.updated_at && localEstudo.kanban_status !== 'new'
    ? Math.round((new Date(localEstudo.updated_at).getTime() - new Date(localEstudo.created_at).getTime()) / 1000 / 60)
    : null;

  // Total entities count
  const totalEntities = nutraceuticals.length + conditions.length;

  return (
    <Card className={needsProcessing && !isProcessing ? 'border-2 border-yellow-500 bg-yellow-50/30' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <CardTitle className="text-base">{localEstudo.title || localEstudo.original_filename}</CardTitle>
            {localEstudo.qualityScore && (
              <EvidenceTag score={localEstudo.qualityScore} showLabel={false} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('studies.card.deleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('studies.card.deleteDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {needsProcessing && !isProcessing && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {t('studies.card.awaitingAI')}
              </Badge>
            )}
            {isProcessing && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('studies.card.processingStatus')}
              </Badge>
            )}
            {processingStatus === 'success' && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t('studies.card.completed')}
              </Badge>
            )}
            {processingStatus === 'error' && (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {t('studies.card.errorStatus')}
              </Badge>
            )}
            {/* Vectorization Status Badge */}
            {embeddingsCount !== null && embeddingsCount > 0 && (
              <Badge 
                variant="outline" 
                className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1 cursor-help"
                title={t('studies.card.vectorizedChunks', { count: embeddingsCount })}
              >
                <CheckCircle2 className="h-3 w-3" />
                RAG: {embeddingsCount}
              </Badge>
            )}
            {embeddingsCount === 0 && localEstudo.kanban_status === 'processed' && (
              <Badge 
                variant="outline" 
                className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1 cursor-pointer hover:bg-amber-200"
                onClick={handleVectorize}
                title={t('studies.card.clickToVectorize')}
              >
                <AlertCircle className="h-3 w-3" />
                {t('studies.card.noRag')}
              </Badge>
            )}
          </div>
        </div>
        {/* Abstract / Summary - max 3 lines */}
        {summaryText && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {t('studies.card.abstract')}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {summaryText}
            </p>
          </div>
        )}
        {!summaryText && (
          <CardDescription>{t('studies.card.importedStudy')}</CardDescription>
        )}

        {/* Digestion Stats */}
        {hasAnalysisData && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1" title={t('studies.card.entities')}>
              <Database className="h-3 w-3" />
              <span>{totalEntities} {t('studies.card.entities')}</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1" title={t('studies.card.triplets')}>
              <FileText className="h-3 w-3" />
              <span>{tripletCount !== null ? tripletCount : '...'} {t('studies.card.triplets')}</span>
            </div>
            {mechanisms.length > 0 && (
              <>
                <span className="text-border">•</span>
                <div className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  <span>{mechanisms.length} {t('studies.card.mechanisms')}</span>
                </div>
              </>
            )}
            {embeddingsCount !== null && embeddingsCount > 0 && (
              <>
                <span className="text-border">•</span>
                <span>{embeddingsCount} {t('studies.card.embeddings')}</span>
              </>
            )}
            {processingTime !== null && processingTime > 0 && (
              <>
                <span className="text-border">•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{processingTime}min</span>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Progress Bar durante processamento */}
        {isProcessing && (
          <div className="mt-3 space-y-2">
            <Progress value={currentProgress} className="h-2" />
            <p className="text-xs text-blue-600">
              {t('studies.card.geminiAnalyzing', { progress: currentProgress })}
            </p>
          </div>
        )}
        
        {/* Alert de necessidade de processamento */}
        {needsProcessing && !isProcessing && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t('studies.card.needsProcessing')}
            </p>
            <Button
              onClick={handleGeminiProcess}
              size="sm"
              className="mt-2 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t('studies.card.processWithGemini')}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Only show analysis data if study has been processed */}
        {hasAnalysisData && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-purple-700 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t('studies.card.ntaiAnalysis')}
            </h4>
            
            {/* Seção Nutraceuticos */}
            {nutraceuticals.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">{t('studies.card.nutraceuticals')}</p>
                <div className="flex flex-wrap gap-1">
                  {nutraceuticals.map((nutra: any, idx: number) => (
                    <NutraceuticalTag 
                      key={idx} 
                      name={typeof nutra === 'string' ? nutra : nutra.name} 
                      score={getNutraceuticalScore(typeof nutra === 'string' ? nutra : nutra.name)} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Seção Condições */}
            {conditions.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">{t('studies.card.conditions')}</p>
                <div className="flex flex-wrap gap-1">
                  {conditions.map((condition: any, idx: number) => (
                    <Badge 
                      key={idx}
                      variant="outline" 
                      className="bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {condition.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Seção Interações Positivas (stimulation/modulation) */}
            {(() => {
              const positiveInteractions = interactions.filter((i: any) => i.type !== 'inhibition');
              const negativeInteractions = interactions.filter((i: any) => i.type === 'inhibition');
              const getLabel = (i: any) => {
                const name = i.from || i.nutraceutical || i.name || '';
                const target = i.to || '';
                const desc = i.description || i.interaction || i.effect || '';
                if (name && target) return `${name} → ${target}`;
                if (name && desc) return `${name}: ${desc.substring(0, 30)}`;
                return desc.substring(0, 40) || name;
              };
              return (
                <>
                  {positiveInteractions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">{t('studies.card.positiveInteractions')}</p>
                      <div className="flex flex-wrap gap-1">
                        {positiveInteractions.slice(0, 3).map((interaction: any, idx: number) => (
                          <Badge 
                            key={idx}
                            variant="outline" 
                            className="bg-green-50 text-green-700 border-green-200 text-xs"
                          >
                            🟢 {getLabel(interaction)}
                          </Badge>
                        ))}
                        {positiveInteractions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{positiveInteractions.length - 3} {t('studies.card.more')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {negativeInteractions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">{t('studies.card.negativeInteractions')}</p>
                      <div className="flex flex-wrap gap-1">
                        {negativeInteractions.slice(0, 3).map((interaction: any, idx: number) => (
                          <Badge 
                            key={idx}
                            variant="outline" 
                            className="bg-red-50 text-red-700 border-red-200 text-xs"
                          >
                            🔴 {getLabel(interaction)}
                          </Badge>
                        ))}
                        {negativeInteractions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{negativeInteractions.length - 3} {t('studies.card.more')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Seção Efeitos Colaterais */}
            {sideEffects.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">{t('studies.card.sideEffectsLabel')}</p>
                <div className="flex flex-wrap gap-1">
                  {sideEffects.slice(0, 2).map((effect: any, idx: number) => (
                    <Badge 
                      key={idx}
                      variant="outline" 
                      className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                    >
                      ⚠️ {effect.name} ({effect.severity})
                    </Badge>
                  ))}
                  {sideEffects.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{sideEffects.length - 2} {t('studies.card.more')}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show metadata if available */}
        {(localEstudo.authors || localEstudo.year || localEstudo.journal) && (
          <div className="text-xs text-gray-600 space-y-1">
            {localEstudo.authors && (
              <p><strong>{t('studies.card.authors')}:</strong> {Array.isArray(localEstudo.authors) ? localEstudo.authors.join(', ') : localEstudo.authors}</p>
            )}
            {localEstudo.year && (
              <p><strong>{t('studies.card.year')}:</strong> {localEstudo.year}</p>
            )}
            {localEstudo.journal && (
              <p><strong>Journal:</strong> {localEstudo.journal}</p>
            )}
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full" 
          size="sm"
          onClick={() => onView(localEstudo)}
        >
          {buttonLabel || t('studies.kanban.viewDetails')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EstudoCard;
