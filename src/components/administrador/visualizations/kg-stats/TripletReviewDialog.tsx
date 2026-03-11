import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, CheckCircle2, XCircle, Loader2, FileText, AlertTriangle, MessageCircle, Info, Undo2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import TripletInlineChat from '@/components/administrador/estudos/curation/TripletInlineChat';

export interface TripletData {
  id: string;
  subject_name: string;
  subject_type: string;
  subject_layer?: string | null;
  predicate: string;
  object_name: string;
  object_type: string;
  object_layer?: string | null;
  extraction_confidence: number | null;
  confidence_rationale?: string | null;
  evidence_level?: string | null;
  species_context?: string[] | null;
  study_id?: string | null;
  intensity?: number | null;
  direction?: string | null;
  mechanism_path?: string[] | null;
  dose_range?: any | null;
  hallucination_flag?: boolean | null;
  curation_status?: string | null;
  review_notes?: string | null;
  kg_match_score?: number | null;
  llm_confidence?: number | null;
  relationship_category?: string | null;
  study_title?: string | null;
}

interface TripletReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triplet: TripletData | null;
  onReviewed: (tripletId: string, newStatus: string) => void;
}

const TripletReviewDialog: React.FC<TripletReviewDialogProps> = ({
  open,
  onOpenChange,
  triplet,
  onReviewed,
}) => {
  const { t } = useTranslation();
  const [reviewNotes, setReviewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [sourceChunks, setSourceChunks] = useState<any[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [studyTitle, setStudyTitle] = useState<string | null>(null);

  // Load source chunks and study title when dialog opens
  useEffect(() => {
    if (!open || !triplet) return;
    setReviewNotes(triplet.review_notes || '');
    setActiveTab('details');
    setSourceChunks([]);
    setStudyTitle(triplet.study_title || null);

    // Fetch study title if not available
    if (triplet.study_id && !triplet.study_title) {
      supabase
        .from('processed_studies')
        .select('title')
        .eq('id', triplet.study_id)
        .single()
        .then(({ data }) => {
          if (data?.title) setStudyTitle(data.title);
        });
    }

    // Fetch source chunks
    if (triplet.study_id) {
      setLoadingChunks(true);
      supabase
        .from('study_embeddings')
        .select('chunk_text, chunk_index')
        .eq('study_id', triplet.study_id)
        .or(`chunk_text.ilike.%${triplet.subject_name}%,chunk_text.ilike.%${triplet.object_name}%`)
        .order('chunk_index', { ascending: true })
        .limit(3)
        .then(({ data, error }) => {
          if (!error && data) setSourceChunks(data);
          setLoadingChunks(false);
        });
    }
  }, [open, triplet?.id]);

  const handleAction = async (status: 'approved' | 'rejected' | 'pending') => {
    if (!triplet) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('triplet_extractions')
        .update({
          curation_status: status,
          review_notes: reviewNotes || null,
          review_date: new Date().toISOString(),
        })
        .eq('id', triplet.id);

      if (error) throw error;

      const toastMessages: Record<string, string> = {
        approved: t('knowledgeGraph.tripletReview.approved', 'Triplet aprovado'),
        rejected: t('knowledgeGraph.tripletReview.rejected', 'Triplet rejeitado'),
        pending: t('knowledgeGraph.tripletReview.reverted', 'Triplet revertido para pendente'),
      };

      toast({ title: toastMessages[status] });
      onReviewed(triplet.id, status);
      setReviewNotes('');
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating triplet:', err);
      toast({
        title: t('common.error', 'Erro'),
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!triplet) return null;

  const confidence = triplet.extraction_confidence;
  const confPercent = confidence ? Math.round(confidence * 100) : null;
  const confColor = confidence && confidence >= 0.8
    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
    : confidence && confidence >= 0.5
      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';

  const canRevert = triplet.curation_status === 'approved' || triplet.curation_status === 'rejected';
  const canApproveReject = triplet.curation_status !== 'approved';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('knowledgeGraph.tripletReview.title', 'Revisão de Triplet')}
            {triplet.hallucination_flag && (
              <Badge variant="destructive" className="text-[10px]">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {t('knowledgeGraph.tripletReview.hallucination', 'Possível alucinação')}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {t('knowledgeGraph.tripletReview.description', 'Revise o triplet com contexto completo antes de decidir.')}
          </DialogDescription>
        </DialogHeader>

        {/* Triplet chain - always visible */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-2 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-center">
              {triplet.subject_layer && (
                <Badge variant="outline" className="text-[9px] mb-0.5 block">{triplet.subject_layer}</Badge>
              )}
              <Badge variant="outline" className="text-[10px] mb-0.5">{triplet.subject_type}</Badge>
              <div className="font-semibold text-sm text-primary">{triplet.subject_name}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="text-center">
              <Badge className="bg-accent text-accent-foreground">{triplet.predicate}</Badge>
              {triplet.direction && (
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {triplet.direction === 'improves' ? '↑' : triplet.direction === 'worsens' ? '↓' : '↔'}
                </div>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="text-center">
              {triplet.object_layer && (
                <Badge variant="outline" className="text-[9px] mb-0.5 block">{triplet.object_layer}</Badge>
              )}
              <Badge variant="outline" className="text-[10px] mb-0.5">{triplet.object_type}</Badge>
              <div className="font-semibold text-sm">{triplet.object_name}</div>
            </div>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-1.5 pt-1 border-t">
            {confPercent !== null && (
              <Badge className={confColor}>{confPercent}% {t('knowledgeGraph.tripletReview.confidence', 'confiança')}</Badge>
            )}
            {triplet.evidence_level && (
              <Badge variant="outline">{triplet.evidence_level}</Badge>
            )}
            {triplet.intensity !== null && triplet.intensity !== undefined && (
              <Badge variant="outline">{t('knowledgeGraph.tripletReview.intensity', 'Intensidade')}: {(triplet.intensity * 100).toFixed(0)}%</Badge>
            )}
            {triplet.species_context && triplet.species_context.length > 0 && (
              <Badge variant="secondary">🐾 {triplet.species_context.join(', ')}</Badge>
            )}
            {triplet.curation_status && (
              <Badge variant={triplet.curation_status === 'approved' ? 'default' : triplet.curation_status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                {triplet.curation_status}
              </Badge>
            )}
          </div>
        </div>

        {/* Tabbed content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="w-full justify-start flex-shrink-0">
            <TabsTrigger value="details" className="text-xs gap-1">
              <Info className="h-3 w-3" />
              {t('knowledgeGraph.tripletReview.tabDetails', 'Detalhes')}
            </TabsTrigger>
            <TabsTrigger value="source" className="text-xs gap-1">
              <FileText className="h-3 w-3" />
              {t('knowledgeGraph.tripletReview.tabSource', 'Fonte')}
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-xs gap-1">
              <MessageCircle className="h-3 w-3" />
              {t('knowledgeGraph.tripletReview.tabChat', 'Chat')}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0">
            {/* Details Tab */}
            <TabsContent value="details" className="mt-0 p-3 space-y-3">
              {/* Confidence Rationale */}
              {triplet.confidence_rationale && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-1.5 font-medium text-xs text-foreground mb-1">
                    <Info className="h-3.5 w-3.5" />
                    {t('knowledgeGraph.tripletReview.confidenceRationale', 'Racional da Confiança')}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{triplet.confidence_rationale}</p>
                </div>
              )}

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">{t('knowledgeGraph.tripletReview.evidenceLevel', 'Nível de Evidência')}</span>
                  <div><Badge variant={triplet.evidence_level ? 'outline' : 'secondary'}>{triplet.evidence_level || 'N/A'}</Badge></div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">{t('knowledgeGraph.tripletReview.intensity', 'Intensidade')}</span>
                  <div>{triplet.intensity !== null && triplet.intensity !== undefined ? `${(triplet.intensity * 100).toFixed(0)}%` : 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">{t('knowledgeGraph.tripletReview.kgMatch', 'KG Match')}</span>
                  <div>{triplet.kg_match_score !== null && triplet.kg_match_score !== undefined ? `${(triplet.kg_match_score * 100).toFixed(0)}%` : 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">{t('knowledgeGraph.tripletReview.llmConfidence', 'LLM Confidence')}</span>
                  <div>{triplet.llm_confidence !== null && triplet.llm_confidence !== undefined ? `${(triplet.llm_confidence * 100).toFixed(0)}%` : 'N/A'}</div>
                </div>
              </div>

              {/* Dose Range */}
              {triplet.dose_range && (
                <div className="text-xs space-y-1">
                  <span className="text-muted-foreground font-medium">{t('knowledgeGraph.tripletReview.doseRange', 'Dose')}</span>
                  <div>{triplet.dose_range.min}-{triplet.dose_range.max} {triplet.dose_range.unit}</div>
                </div>
              )}

              {/* Mechanism Path */}
              {triplet.mechanism_path && triplet.mechanism_path.length > 0 && (
                <div className="text-xs space-y-1">
                  <span className="text-muted-foreground font-medium">{t('knowledgeGraph.tripletReview.mechanismPath', 'Caminho do Mecanismo')}</span>
                  <div className="bg-muted/50 p-2 rounded text-[11px]">
                    {triplet.mechanism_path.join(' → ')}
                  </div>
                </div>
              )}

              {/* Study info */}
              {studyTitle && (
                <div className="text-xs space-y-1 pt-2 border-t">
                  <span className="text-muted-foreground font-medium">{t('knowledgeGraph.tripletReview.sourceStudy', 'Estudo de Origem')}</span>
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{studyTitle}</span>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Source Tab */}
            <TabsContent value="source" className="mt-0 p-3 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-medium mb-2">
                <FileText className="h-3.5 w-3.5" />
                {t('knowledgeGraph.tripletReview.sourceExcerpts', 'Trechos do Estudo Original')}
                <Badge variant="outline" className="text-[9px] ml-1">📄 {t('knowledgeGraph.tripletReview.internalSource', 'Fonte interna')}</Badge>
              </div>

              {loadingChunks ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('knowledgeGraph.tripletReview.loadingSource', 'Buscando trechos do estudo...')}
                </div>
              ) : sourceChunks.length > 0 ? (
                <div className="space-y-2">
                  {sourceChunks.map((chunk, idx) => (
                    <div key={idx} className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-[11px] leading-relaxed italic text-muted-foreground">
                        "{chunk.chunk_text.length > 500 ? chunk.chunk_text.substring(0, 500) + '...' : chunk.chunk_text}"
                      </p>
                      <span className="block text-[9px] mt-1 not-italic opacity-60">— chunk #{chunk.chunk_index}</span>
                    </div>
                  ))}
                  {studyTitle && (
                    <p className="text-[10px] text-muted-foreground">
                      {t('knowledgeGraph.tripletReview.from', 'De')}: <span className="font-medium">{studyTitle}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">{t('knowledgeGraph.tripletReview.noSource', 'Texto original não disponível (estudo não vetorizado)')}</p>
                </div>
              )}
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="mt-0 p-3 space-y-3">
              <div className="flex items-center gap-2 text-xs mb-2">
                <Badge variant="outline" className="text-[9px]">📄 {t('knowledgeGraph.tripletReview.internalSource', 'Fonte interna')}</Badge>
                <span className="text-muted-foreground">+</span>
                <Badge variant="outline" className="text-[9px] border-amber-300 bg-amber-50 dark:bg-amber-900/20">⚠️ {t('knowledgeGraph.tripletReview.externalSource', 'Conhecimento externo IA')}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                {t('knowledgeGraph.tripletReview.chatDisclaimer', 'O chat pode trazer informações do estudo e de conhecimento geral da IA. Verifique a fonte antes de decidir.')}
              </p>
              {triplet.study_id ? (
                <TripletInlineChat
                  studyId={triplet.study_id}
                  studyTitle={studyTitle || undefined}
                  subject={triplet.subject_name}
                  predicate={triplet.predicate}
                  object={triplet.object_name}
                  initialQuestion={`Explain the scientific evidence for the relationship between "${triplet.subject_name}" and "${triplet.object_name}" (${triplet.predicate}). What does the study say? Is this well-supported?`}
                />
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <MessageCircle className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">{t('knowledgeGraph.tripletReview.noChatNoStudy', 'Chat não disponível: triplet sem estudo associado')}</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Review notes */}
        <div className="space-y-1.5 flex-shrink-0">
          <Label className="text-xs">{t('knowledgeGraph.tripletReview.notes', 'Notas de Revisão (opcional)')}</Label>
          <Textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder={t('knowledgeGraph.tripletReview.notesPlaceholder', 'Adicione notas sobre sua decisão...')}
            rows={2}
            className="text-xs"
          />
        </div>

        <DialogFooter className="gap-2 flex-shrink-0">
          {canRevert && (
            <Button
              variant="outline"
              onClick={() => handleAction('pending')}
              disabled={saving}
              className="mr-auto"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
              {t('knowledgeGraph.tripletReview.revert', 'Reverter para Pendente')}
            </Button>
          )}
          {canApproveReject && (
            <Button
              variant="destructive"
              onClick={() => handleAction('rejected')}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              {t('knowledgeGraph.tripletReview.reject', 'Rejeitar')}
            </Button>
          )}
          {canApproveReject && (
            <Button
              onClick={() => handleAction('approved')}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {t('knowledgeGraph.tripletReview.approve', 'Aprovar')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TripletReviewDialog;
