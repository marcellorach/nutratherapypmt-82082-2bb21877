import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronRight,
  ArrowRight, 
  Sparkles, 
  Search,
  RefreshCw,
  Loader2,
  Eye,
  AlertTriangle,
  Check,
  X,
  ThumbsDown,
  Settings2,
  FileText,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Triplet {
  id: string;
  study_id: string;
  subject_type: string;
  subject_name: string;
  subject_layer: string | null;
  predicate: string;
  object_type: string;
  object_name: string;
  object_layer: string | null;
  extraction_confidence: number;
  kg_match_score: number | null;
  llm_confidence: number | null;
  curation_status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  auto_approved: boolean;
  synced_to_neo4j: boolean;
  created_at: string;
  evidence_level: string | null;
  intensity: number | null;
  mechanism_path: any;
  relationship_category: string | null;
  species_context: string[] | null;
  review_notes: string | null;
  confidence_rationale: string | null;
  hallucination_flag: boolean | null;
  dose_range: any;
  direction: string | null;
}

interface StudyTripletCurationProps {
  studyId: string;
  studyTitle?: string;
  onTripletsUpdated?: () => void;
  onNavigateToChat?: (question?: string) => void;
}

const StudyTripletCuration: React.FC<StudyTripletCurationProps> = ({
  studyId,
  studyTitle,
  onTripletsUpdated,
  onNavigateToChat
}) => {
  const { t } = useTranslation();
  const [triplets, setTriplets] = useState<Triplet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTriplet, setExpandedTriplet] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const sourceChunkCache = useRef<Record<string, { chunks: any[]; loaded: boolean }>>({});
  
  // Editable threshold state
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [showThresholdSettings, setShowThresholdSettings] = useState(false);

  const fetchTriplets = useCallback(async () => {
    if (!studyId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('triplet_extractions')
        .select('*')
        .eq('study_id', studyId)
        .order('extraction_confidence', { ascending: false });

      if (error) throw error;
      setTriplets((data || []) as Triplet[]);
    } catch (error: any) {
      console.error('Error fetching triplets:', error);
      toast.error(t('tripletCuration.errorFetching', 'Erro ao carregar triplets'));
    } finally {
      setLoading(false);
    }
  }, [studyId, t]);

  useEffect(() => {
    fetchTriplets();
  }, [fetchTriplets]);

  const updateTripletStatus = async (tripletId: string, status: 'approved' | 'rejected') => {
    setProcessingIds(prev => new Set(prev).add(tripletId));
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from('triplet_extractions')
        .update({
          curation_status: status,
          reviewed_by: userId,
          review_date: new Date().toISOString()
        })
        .eq('id', tripletId);

      if (error) throw error;

      setTriplets(prev => 
        prev.map(t => t.id === tripletId ? { ...t, curation_status: status } : t)
      );
      
      toast.success(
        status === 'approved' 
          ? t('tripletCuration.approved', 'Triplet aprovado')
          : t('tripletCuration.rejected', 'Triplet rejeitado')
      );
      
      onTripletsUpdated?.();
    } catch (error: any) {
      console.error('Error updating triplet:', error);
      toast.error(t('tripletCuration.errorUpdating', 'Erro ao atualizar triplet'));
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(tripletId);
        return next;
      });
    }
  };

  // Bulk approve with dynamic threshold
  const handleBulkApprove = async () => {
    const threshold = confidenceThreshold / 100;
    const pendingHighConfidence = triplets.filter(
      t => t.curation_status === 'pending' && t.extraction_confidence >= threshold
    );

    if (pendingHighConfidence.length === 0) {
      toast.info(t('tripletCuration.noHighConfidence', `Nenhum triplet pendente com confiança ≥${confidenceThreshold}%`));
      return;
    }

    setBulkProcessing(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const ids = pendingHighConfidence.map(t => t.id);
      
      const { error } = await supabase
        .from('triplet_extractions')
        .update({
          curation_status: 'approved',
          reviewed_by: userId,
          review_date: new Date().toISOString(),
          auto_approved: true
        })
        .in('id', ids);

      if (error) throw error;

      setTriplets(prev => 
        prev.map(t => ids.includes(t.id) ? { ...t, curation_status: 'approved', auto_approved: true } : t)
      );
      
      toast.success(t('tripletCuration.bulkApproved', `${ids.length} triplets aprovados`));
      onTripletsUpdated?.();
    } catch (error: any) {
      console.error('Error bulk approving:', error);
      toast.error(t('tripletCuration.errorBulkApproving', 'Erro ao aprovar em lote'));
    } finally {
      setBulkProcessing(false);
    }
  };

  // Bulk reject below threshold
  const handleBulkReject = async () => {
    const threshold = confidenceThreshold / 100;
    const pendingLowConfidence = triplets.filter(
      t => t.curation_status === 'pending' && t.extraction_confidence < threshold
    );

    if (pendingLowConfidence.length === 0) {
      toast.info(t('tripletCuration.noLowConfidence', `Nenhum triplet pendente com confiança <${confidenceThreshold}%`));
      return;
    }

    setBulkProcessing(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const ids = pendingLowConfidence.map(t => t.id);
      
      const { error } = await supabase
        .from('triplet_extractions')
        .update({
          curation_status: 'rejected',
          reviewed_by: userId,
          review_date: new Date().toISOString()
        })
        .in('id', ids);

      if (error) throw error;

      setTriplets(prev => 
        prev.map(t => ids.includes(t.id) ? { ...t, curation_status: 'rejected' } : t)
      );
      
      toast.success(t('tripletCuration.bulkRejected', `${ids.length} triplets rejeitados`));
      onTripletsUpdated?.();
    } catch (error: any) {
      console.error('Error bulk rejecting:', error);
      toast.error(t('tripletCuration.errorBulkRejecting', 'Erro ao rejeitar em lote'));
    } finally {
      setBulkProcessing(false);
    }
  };

  const syncToNeo4j = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-approved-triplets', {
        body: { studyId }
      });
      
      if (error) throw error;
      
      toast.success(t('tripletCuration.syncSuccess', `${data?.results?.synced || 0} triplets sincronizados`));
      fetchTriplets();
    } catch (error: any) {
      console.error('Neo4j sync error:', error);
      toast.error(t('tripletCuration.syncError', 'Erro ao sincronizar com Neo4j'));
    }
  };

  // Stats
  const threshold = confidenceThreshold / 100;
  const stats = {
    total: triplets.length,
    pending: triplets.filter(t => t.curation_status === 'pending').length,
    approved: triplets.filter(t => t.curation_status === 'approved').length,
    rejected: triplets.filter(t => t.curation_status === 'rejected').length,
    synced: triplets.filter(t => t.synced_to_neo4j).length,
    aboveThreshold: triplets.filter(t => t.curation_status === 'pending' && t.extraction_confidence >= threshold).length,
    belowThreshold: triplets.filter(t => t.curation_status === 'pending' && t.extraction_confidence < threshold).length
  };

  // Filtered triplets
  const filteredTriplets = triplets.filter(t => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      t.subject_name.toLowerCase().includes(search) ||
      t.object_name.toLowerCase().includes(search) ||
      t.predicate.toLowerCase().includes(search)
    );
  });

  // Group by status
  const groupedTriplets = {
    pending: filteredTriplets.filter(t => t.curation_status === 'pending'),
    reviewing: filteredTriplets.filter(t => t.curation_status === 'reviewing'),
    approved: filteredTriplets.filter(t => t.curation_status === 'approved'),
    rejected: filteredTriplets.filter(t => t.curation_status === 'rejected')
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= threshold) return 'bg-green-500';
    if (confidence >= threshold - 0.15) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLayerLabel = (layer: string | null) => {
    if (!layer) return null;
    const labels: Record<string, string> = {
      'layer_0_compound': 'L0',
      'layer_1_target': 'L1',
      'layer_2_mechanism': 'L2',
      'layer_3_effect': 'L3',
      'layer_4_outcome': 'L4',
    };
    return labels[layer] || layer;
  };

  const getLayerColor = (layer: string | null) => {
    if (!layer) return 'bg-muted';
    const colors: Record<string, string> = {
      'layer_0_compound': 'bg-purple-500',
      'layer_1_target': 'bg-blue-500',
      'layer_2_mechanism': 'bg-cyan-500',
      'layer_3_effect': 'bg-orange-500',
      'layer_4_outcome': 'bg-green-500',
    };
    return colors[layer] || 'bg-muted';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (triplets.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">{t('tripletCuration.noTriplets', 'Nenhum triplet encontrado')}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('tripletCuration.noTripletsDesc', 'Este estudo ainda não foi processado ou não gerou triplets.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{stats.total}</span>
          <span className="text-sm text-muted-foreground">{t('tripletCuration.total', 'Total')}</span>
        </div>
        <div className="h-6 w-px bg-border" />
        <Badge variant="outline" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {stats.pending} {t('tripletCuration.pending', 'Pendentes')}
        </Badge>
        <Badge className="bg-green-500 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {stats.approved} {t('tripletCuration.approvedLabel', 'Aprovados')}
        </Badge>
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          {stats.rejected} {t('tripletCuration.rejectedLabel', 'Rejeitados')}
        </Badge>
        
        <div className="flex-1" />
        
        {/* Settings toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowThresholdSettings(!showThresholdSettings)}
          className="gap-1"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={syncToNeo4j}
          disabled={stats.approved === 0}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {t('tripletCuration.sync', 'Sync Neo4j')}
        </Button>
      </div>

      {/* Threshold Settings Panel */}
      {showThresholdSettings && (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{t('tripletCuration.confidenceThreshold', 'Nota de Corte')}</h4>
                <p className="text-xs text-muted-foreground">
                  {t('tripletCuration.thresholdDesc', 'Triplets com confiança ≥ este valor serão aprovados em massa')}
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">{confidenceThreshold}%</div>
            </div>
            
            <Slider
              value={[confidenceThreshold]}
              onValueChange={(value) => setConfidenceThreshold(value[0])}
              min={50}
              max={99}
              step={1}
              className="w-full"
            />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>50%</span>
              <span className="text-center">
                {stats.aboveThreshold} triplets ≥{confidenceThreshold}% | {stats.belowThreshold} triplets &lt;{confidenceThreshold}%
              </span>
              <span>99%</span>
            </div>
            
            {/* Bulk Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkApprove}
                disabled={stats.aboveThreshold === 0 || bulkProcessing}
                className="flex-1 gap-1"
              >
                {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {t('tripletCuration.approveAbove', `Aprovar ${stats.aboveThreshold} ≥${confidenceThreshold}%`)}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkReject}
                disabled={stats.belowThreshold === 0 || bulkProcessing}
                className="flex-1 gap-1"
              >
                {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                {t('tripletCuration.rejectBelow', `Rejeitar ${stats.belowThreshold} <${confidenceThreshold}%`)}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Always visible */}
      {!showThresholdSettings && stats.pending > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkApprove}
            disabled={stats.aboveThreshold === 0 || bulkProcessing}
            className="gap-1"
          >
            {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {t('tripletCuration.autoApprove', `Auto-aprovar ≥${confidenceThreshold}%`)} ({stats.aboveThreshold})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkReject}
            disabled={stats.belowThreshold === 0 || bulkProcessing}
            className="gap-1 text-destructive hover:text-destructive"
          >
            {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
            {t('tripletCuration.rejectLow', `Rejeitar <${confidenceThreshold}%`)} ({stats.belowThreshold})
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('tripletCuration.searchPlaceholder', 'Buscar triplets...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Triplets List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {/* Pending Section */}
          {groupedTriplets.pending.length > 0 && (
            <TripletSection
              title={t('tripletCuration.pendingSection', 'Pendentes de Revisão')}
              count={groupedTriplets.pending.length}
              variant="warning"
            >
              {groupedTriplets.pending.map(triplet => (
                <TripletCard
                  key={triplet.id}
                  triplet={triplet}
                  isExpanded={expandedTriplet === triplet.id}
                  isProcessing={processingIds.has(triplet.id)}
                  onToggleExpand={() => setExpandedTriplet(
                    expandedTriplet === triplet.id ? null : triplet.id
                  )}
                  onApprove={() => updateTripletStatus(triplet.id, 'approved')}
                  onReject={() => updateTripletStatus(triplet.id, 'rejected')}
                  getConfidenceColor={getConfidenceColor}
                  getLayerLabel={getLayerLabel}
                  getLayerColor={getLayerColor}
                  threshold={threshold}
                  t={t}
                  studyTitle={studyTitle}
                  onNavigateToChat={onNavigateToChat}
                  sourceChunkCache={sourceChunkCache}
                />
              ))}
            </TripletSection>
          )}

          {/* Approved Section */}
          {groupedTriplets.approved.length > 0 && (
            <TripletSection
              title={t('tripletCuration.approvedSection', 'Aprovados')}
              count={groupedTriplets.approved.length}
              variant="success"
              defaultOpen={false}
            >
              {groupedTriplets.approved.map(triplet => (
                <TripletCard
                  key={triplet.id}
                  triplet={triplet}
                  isExpanded={expandedTriplet === triplet.id}
                  isProcessing={processingIds.has(triplet.id)}
                  onToggleExpand={() => setExpandedTriplet(
                    expandedTriplet === triplet.id ? null : triplet.id
                  )}
                  onApprove={() => updateTripletStatus(triplet.id, 'approved')}
                  onReject={() => updateTripletStatus(triplet.id, 'rejected')}
                  getConfidenceColor={getConfidenceColor}
                  getLayerLabel={getLayerLabel}
                  getLayerColor={getLayerColor}
                  threshold={threshold}
                  t={t}
                  readonly
                  studyTitle={studyTitle}
                  onNavigateToChat={onNavigateToChat}
                  sourceChunkCache={sourceChunkCache}
                />
              ))}
            </TripletSection>
          )}

          {/* Rejected Section */}
          {groupedTriplets.rejected.length > 0 && (
            <TripletSection
              title={t('tripletCuration.rejectedSection', 'Rejeitados')}
              count={groupedTriplets.rejected.length}
              variant="destructive"
              defaultOpen={false}
            >
              {groupedTriplets.rejected.map(triplet => (
                <TripletCard
                  key={triplet.id}
                  triplet={triplet}
                  isExpanded={expandedTriplet === triplet.id}
                  isProcessing={processingIds.has(triplet.id)}
                  onToggleExpand={() => setExpandedTriplet(
                    expandedTriplet === triplet.id ? null : triplet.id
                  )}
                  onApprove={() => updateTripletStatus(triplet.id, 'approved')}
                  onReject={() => updateTripletStatus(triplet.id, 'rejected')}
                  getConfidenceColor={getConfidenceColor}
                  getLayerLabel={getLayerLabel}
                  getLayerColor={getLayerColor}
                  threshold={threshold}
                  t={t}
                  studyTitle={studyTitle}
                  onNavigateToChat={onNavigateToChat}
                  sourceChunkCache={sourceChunkCache}
                />
              ))}
            </TripletSection>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Section Component
interface TripletSectionProps {
  title: string;
  count: number;
  variant: 'warning' | 'success' | 'destructive';
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const TripletSection: React.FC<TripletSectionProps> = ({
  title,
  count,
  variant,
  defaultOpen = true,
  children
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const variantStyles = {
    warning: 'border-amber-500/30 bg-amber-500/5',
    success: 'border-green-500/30 bg-green-500/5',
    destructive: 'border-red-500/30 bg-red-500/5'
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className={cn(
          "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted/50 border",
          variantStyles[variant]
        )}>
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium text-sm">{title}</span>
            <Badge variant="secondary" className="text-xs">{count}</Badge>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

// Triplet Card Component
interface TripletCardProps {
  triplet: Triplet;
  isExpanded: boolean;
  isProcessing: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
  getConfidenceColor: (c: number) => string;
  getLayerLabel: (l: string | null) => string | null;
  getLayerColor: (l: string | null) => string;
  threshold: number;
  t: any;
  readonly?: boolean;
  studyTitle?: string;
  onNavigateToChat?: (question?: string) => void;
  sourceChunkCache: React.MutableRefObject<Record<string, { chunks: any[]; loaded: boolean }>>;
}

const TripletCard: React.FC<TripletCardProps> = ({
  triplet,
  isExpanded,
  isProcessing,
  onToggleExpand,
  onApprove,
  onReject,
  getConfidenceColor,
  getLayerLabel,
  getLayerColor,
  threshold,
  t,
  readonly = false,
  studyTitle,
  onNavigateToChat,
  sourceChunkCache
}) => {
  const showActions = triplet.curation_status !== 'approved' || !readonly;
  const isAboveThreshold = triplet.extraction_confidence >= threshold;
  
  const [sourceChunks, setSourceChunks] = useState<any[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [chunksLoaded, setChunksLoaded] = useState(false);
  
  // Fetch source chunks when expanded
  useEffect(() => {
    if (!isExpanded || chunksLoaded) return;
    
    const cacheKey = triplet.id;
    const cached = sourceChunkCache.current[cacheKey];
    if (cached) {
      setSourceChunks(cached.chunks);
      setChunksLoaded(true);
      return;
    }
    
    const fetchChunks = async () => {
      setLoadingChunks(true);
      try {
        const { data, error } = await supabase
          .from('study_embeddings')
          .select('chunk_text, chunk_index')
          .eq('study_id', triplet.study_id)
          .or(`chunk_text.ilike.%${triplet.subject_name}%,chunk_text.ilike.%${triplet.object_name}%`)
          .order('chunk_index', { ascending: true })
          .limit(2);
        
        if (error) throw error;
        const chunks = data || [];
        setSourceChunks(chunks);
        sourceChunkCache.current[cacheKey] = { chunks, loaded: true };
      } catch (err) {
        console.error('Error fetching source chunks:', err);
      } finally {
        setLoadingChunks(false);
        setChunksLoaded(true);
      }
    };
    
    fetchChunks();
  }, [isExpanded, chunksLoaded, triplet.id, triplet.study_id, triplet.subject_name, triplet.object_name, sourceChunkCache]);
  
  return (
    <Card className={cn(
      "transition-all",
      isExpanded && "ring-1 ring-primary/50",
      triplet.hallucination_flag && "border-red-300 bg-red-50/30"
    )}>
      <CardContent className="p-3 space-y-2">
        {/* Hallucination warning */}
        {triplet.hallucination_flag && (
          <div className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
            <AlertTriangle className="h-3 w-3" />
            {t('tripletCuration.hallucinationWarning', 'Possível alucinação detectada')}
          </div>
        )}
        
        {/* Main triplet info */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1 min-w-0">
            {/* Subject */}
            <div className="flex items-center gap-1 text-xs">
              {triplet.subject_layer && (
                <Badge className={cn("text-[9px] px-1 text-white", getLayerColor(triplet.subject_layer))}>
                  {getLayerLabel(triplet.subject_layer)}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] shrink-0">
                {triplet.subject_type}
              </Badge>
              <span className="font-semibold truncate">{triplet.subject_name}</span>
            </div>
            
            {/* Predicate */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
              <ArrowRight className="h-3 w-3 shrink-0" />
              <Badge className="text-[10px]">{triplet.predicate}</Badge>
              {triplet.relationship_category && (
                <span className="text-[9px]">({triplet.relationship_category})</span>
              )}
              {triplet.direction && (
                <Badge variant="outline" className="text-[9px]">
                  {triplet.direction === 'improves' ? '↑' : triplet.direction === 'worsens' ? '↓' : '↔'}
                </Badge>
              )}
            </div>
            
            {/* Object */}
            <div className="flex items-center gap-1 text-xs">
              {triplet.object_layer && (
                <Badge className={cn("text-[9px] px-1 text-white", getLayerColor(triplet.object_layer))}>
                  {getLayerLabel(triplet.object_layer)}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] shrink-0">
                {triplet.object_type}
              </Badge>
              <span className="font-semibold truncate">{triplet.object_name}</span>
            </div>
          </div>

          {/* Confidence & Actions */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge className={cn("text-white text-[10px]", getConfidenceColor(triplet.extraction_confidence))}>
              {(triplet.extraction_confidence * 100).toFixed(0)}%
            </Badge>
            
            {triplet.auto_approved && (
              <Badge variant="secondary" className="text-[9px]">Auto</Badge>
            )}
            
            {triplet.synced_to_neo4j && (
              <Badge variant="outline" className="text-[9px] text-green-600">Synced</Badge>
            )}
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-1 border-t border-dashed">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onToggleExpand}
          >
            <Eye className="h-3 w-3 mr-1" />
            {isExpanded ? t('tripletCuration.hideDetails', 'Ocultar') : t('tripletCuration.showDetails', 'Detalhes')}
          </Button>
          
          {showActions && triplet.curation_status !== 'approved' && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={onApprove}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                {t('tripletCuration.approve', 'Aprovar')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={onReject}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
                {t('tripletCuration.reject', 'Rejeitar')}
              </Button>
            </div>
          )}
          
          {triplet.curation_status === 'approved' && (
            <Badge className="bg-green-500 text-white text-[10px]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {t('tripletCuration.approvedStatus', 'Aprovado')}
            </Badge>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-2 border-t space-y-2 text-xs">
            {/* Source Excerpt - Most important for reviewer */}
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg space-y-2 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <FileText className="h-3.5 w-3.5" />
                {t('tripletCuration.sourceExcerpt', 'Trecho de Origem')}
              </div>
              
              {loadingChunks ? (
                <div className="flex items-center gap-2 text-muted-foreground py-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('tripletCuration.loadingSource', 'Buscando trecho do estudo...')}
                </div>
              ) : sourceChunks.length > 0 ? (
                <div className="space-y-2">
                  {sourceChunks.map((chunk, idx) => (
                    <div key={idx} className="bg-background/80 p-2 rounded border text-[11px] leading-relaxed italic text-muted-foreground">
                      "{chunk.chunk_text.length > 400 ? chunk.chunk_text.substring(0, 400) + '...' : chunk.chunk_text}"
                      <span className="block text-[9px] mt-1 not-italic opacity-60">— chunk #{chunk.chunk_index}</span>
                    </div>
                  ))}
                  {studyTitle && (
                    <p className="text-[10px] text-muted-foreground">
                      {t('tripletCuration.sourceStudy', 'Fonte')}: <span className="font-medium">{studyTitle}</span>
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    {onNavigateToChat && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-1"
                        onClick={() => onNavigateToChat(
                          `Explain the relationship between "${triplet.subject_name}" and "${triplet.object_name}" (${triplet.predicate}) based on this study.`
                        )}
                      >
                        <MessageCircle className="h-3 w-3" />
                        {t('tripletCuration.askAI', 'Perguntar à IA')}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">
                  {t('tripletCuration.noSourceAvailable', 'Texto original não disponível (estudo não vetorizado)')}
                </p>
              )}
            </div>
            
            {/* Confidence Rationale - Most important for decision */}
            {triplet.confidence_rationale && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded space-y-1">
                <span className="text-muted-foreground font-medium">{t('tripletCuration.confidenceRationale', 'Racional da Nota')}:</span>
                <p className="text-[11px] font-mono">{triplet.confidence_rationale}</p>
              </div>
            )}
            
            {/* Evidence Level - Always show */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('tripletCuration.evidenceLevel', 'Nível de Evidência')}:</span>
              <Badge variant={triplet.evidence_level ? 'outline' : 'secondary'}>
                {triplet.evidence_level || 'N/A'}
              </Badge>
            </div>
            
            {/* Intensity - Always show */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('tripletCuration.intensity', 'Intensidade')}:</span>
              <span>{triplet.intensity !== null ? `${(triplet.intensity * 100).toFixed(0)}%` : 'N/A'}</span>
            </div>
            
            {/* Species - Always show */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('tripletCuration.species', 'Espécies')}:</span>
              <div className="flex gap-1 flex-wrap">
                {triplet.species_context && triplet.species_context.length > 0 ? (
                  triplet.species_context.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-[9px]">🐾 {s}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
            </div>
            
            {/* Dose Range */}
            {triplet.dose_range && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t('tripletCuration.doseRange', 'Dose')}:</span>
                <span>
                  {triplet.dose_range.min}-{triplet.dose_range.max} {triplet.dose_range.unit}
                </span>
              </div>
            )}
            
            {/* Mechanism Path */}
            {triplet.mechanism_path && Array.isArray(triplet.mechanism_path) && triplet.mechanism_path.length > 0 && (
              <div className="space-y-1">
                <span className="text-muted-foreground">{t('tripletCuration.mechanismPath', 'Caminho do Mecanismo')}:</span>
                <div className="bg-muted/50 p-2 rounded text-[10px]">
                  {triplet.mechanism_path.join(' → ')}
                </div>
              </div>
            )}
            
            {/* Scores breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t('tripletCuration.kgMatch', 'KG Match')}:</span>
                <span>{triplet.kg_match_score !== null ? `${(triplet.kg_match_score * 100).toFixed(0)}%` : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t('tripletCuration.llmConfidence', 'LLM Confidence')}:</span>
                <span>{triplet.llm_confidence !== null ? `${(triplet.llm_confidence * 100).toFixed(0)}%` : 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyTripletCuration;
