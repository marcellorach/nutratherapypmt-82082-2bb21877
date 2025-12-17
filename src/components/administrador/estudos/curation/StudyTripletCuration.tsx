import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  X
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
}

interface StudyTripletCurationProps {
  studyId: string;
  studyTitle?: string;
  onTripletsUpdated?: () => void;
}

const StudyTripletCuration: React.FC<StudyTripletCurationProps> = ({
  studyId,
  studyTitle,
  onTripletsUpdated
}) => {
  const { t } = useTranslation();
  const [triplets, setTriplets] = useState<Triplet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTriplet, setExpandedTriplet] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

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

  const handleBulkApprove = async (minConfidence: number = 0.85) => {
    const pendingHighConfidence = triplets.filter(
      t => t.curation_status === 'pending' && t.extraction_confidence >= minConfidence
    );

    if (pendingHighConfidence.length === 0) {
      toast.info(t('tripletCuration.noHighConfidence', 'Nenhum triplet de alta confiança pendente'));
      return;
    }

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
      
      toast.success(t('tripletCuration.bulkApproved', `${ids.length} triplets aprovados automaticamente`));
      onTripletsUpdated?.();
    } catch (error: any) {
      console.error('Error bulk approving:', error);
      toast.error(t('tripletCuration.errorBulkApproving', 'Erro ao aprovar em lote'));
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
  const stats = {
    total: triplets.length,
    pending: triplets.filter(t => t.curation_status === 'pending').length,
    approved: triplets.filter(t => t.curation_status === 'approved').length,
    rejected: triplets.filter(t => t.curation_status === 'rejected').length,
    synced: triplets.filter(t => t.synced_to_neo4j).length
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
    if (confidence >= 0.85) return 'bg-green-500';
    if (confidence >= 0.70) return 'bg-yellow-500';
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
        
        {/* Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkApprove(0.85)}
          disabled={stats.pending === 0}
        >
          <Sparkles className="h-4 w-4 mr-1" />
          {t('tripletCuration.autoApprove', 'Auto-aprovar ≥85%')}
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
                  t={t}
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
                  t={t}
                  readonly
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
                  t={t}
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
  t: any;
  readonly?: boolean;
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
  t,
  readonly = false
}) => {
  const showActions = triplet.curation_status !== 'approved' || !readonly;
  
  return (
    <Card className={cn(
      "transition-all",
      isExpanded && "ring-1 ring-primary/50"
    )}>
      <CardContent className="p-3 space-y-2">
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
            {triplet.evidence_level && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t('tripletCuration.evidenceLevel', 'Nível de Evidência')}:</span>
                <Badge variant="outline">{triplet.evidence_level}</Badge>
              </div>
            )}
            
            {triplet.intensity !== null && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t('tripletCuration.intensity', 'Intensidade')}:</span>
                <span>{(triplet.intensity * 100).toFixed(0)}%</span>
              </div>
            )}
            
            {triplet.species_context && triplet.species_context.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t('tripletCuration.species', 'Espécies')}:</span>
                <div className="flex gap-1 flex-wrap">
                  {triplet.species_context.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-[9px]">🐾 {s}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {triplet.mechanism_path && Array.isArray(triplet.mechanism_path) && triplet.mechanism_path.length > 0 && (
              <div className="space-y-1">
                <span className="text-muted-foreground">{t('tripletCuration.mechanismPath', 'Caminho do Mecanismo')}:</span>
                <div className="bg-muted/50 p-2 rounded text-[10px]">
                  {triplet.mechanism_path.join(' → ')}
                </div>
              </div>
            )}
            
            {triplet.kg_match_score !== null && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t('tripletCuration.kgMatch', 'KG Match')}:</span>
                <span>{(triplet.kg_match_score * 100).toFixed(0)}%</span>
              </div>
            )}
            
            {triplet.llm_confidence !== null && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t('tripletCuration.llmConfidence', 'LLM Confidence')}:</span>
                <span>{(triplet.llm_confidence * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyTripletCuration;
