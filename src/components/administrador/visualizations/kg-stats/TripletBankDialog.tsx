import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Database,
} from 'lucide-react';
import TripletReviewDialog, { type TripletData } from './TripletReviewDialog';

interface TripletBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'pending' | 'approved' | 'rejected';
}

export const TripletBankDialog: React.FC<TripletBankDialogProps> = ({
  open,
  onOpenChange,
  initialTab = 'pending',
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [triplets, setTriplets] = useState<TripletData[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [reviewingTriplet, setReviewingTriplet] = useState<TripletData | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      loadCounts();
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (open) {
      loadTriplets(activeTab);
    }
  }, [open, activeTab]);

  const loadCounts = async () => {
    const statuses = ['pending', 'approved', 'rejected'] as const;
    const results = await Promise.all(
      statuses.map(status =>
        supabase
          .from('triplet_extractions')
          .select('id', { count: 'exact', head: true })
          .eq('curation_status', status)
      )
    );
    setCounts({
      pending: results[0].count || 0,
      approved: results[1].count || 0,
      rejected: results[2].count || 0,
    });
  };

  const loadTriplets = async (status: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('triplet_extractions')
        .select(`
          id, subject_name, subject_type, subject_layer, predicate,
          object_name, object_type, object_layer,
          extraction_confidence, confidence_rationale, evidence_level,
          species_context, study_id, intensity, direction,
          mechanism_path, dose_range, hallucination_flag,
          curation_status, review_notes, kg_match_score, llm_confidence,
          relationship_category,
          processed_studies(title)
        `)
        .eq('curation_status', status)
        .order('extraction_confidence', { ascending: false })
        .limit(500);

      const mapped = (data || []).map((item: any) => ({
        ...item,
        study_title: item.processed_studies?.title || null,
      }));
      setTriplets(mapped);
    } catch (err) {
      console.error('Error loading triplets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTripletReviewed = useCallback((tripletId: string, newStatus: string) => {
    setTriplets(prev => prev.filter(t => t.id !== tripletId));
    // Update counts
    setCounts(prev => {
      const oldStatus = activeTab;
      return {
        ...prev,
        [oldStatus]: Math.max(0, prev[oldStatus as keyof typeof prev] - 1),
        [newStatus]: prev[newStatus as keyof typeof prev] + 1,
      };
    });
  }, [activeTab]);

  const filtered = triplets.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.subject_name.toLowerCase().includes(q) ||
      item.object_name.toLowerCase().includes(q) ||
      item.predicate.toLowerCase().includes(q) ||
      (item.study_title && item.study_title.toLowerCase().includes(q))
    );
  });

  const confColor = (c: number | null) => {
    if (!c) return '';
    if (c >= 0.8) return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
    if (c >= 0.5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
  };

  const tabConfig = [
    { value: 'pending', icon: Clock, label: t('knowledgeGraph.tripletBank.pending', 'Pendentes'), count: counts.pending, color: 'text-yellow-600' },
    { value: 'approved', icon: CheckCircle2, label: t('knowledgeGraph.tripletBank.approved', 'Aprovados'), count: counts.approved, color: 'text-green-600' },
    { value: 'rejected', icon: XCircle, label: t('knowledgeGraph.tripletBank.rejected', 'Rejeitados'), count: counts.rejected, color: 'text-red-600' },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {t('knowledgeGraph.tripletBank.title', 'Banco de Triplets')}
              <Badge variant="secondary" className="ml-2">
                {counts.pending + counts.approved + counts.rejected}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {t('knowledgeGraph.tripletBank.description', 'Gerencie todos os triplets extraídos: revise, aprove, rejeite ou reverta decisões.')}
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('knowledgeGraph.tripletBank.searchPlaceholder', 'Buscar por entidade, predicado ou estudo...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 min-h-0 flex flex-col">
            <TabsList className="w-full justify-start flex-shrink-0">
              {tabConfig.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${tab.color}`} />
                    {tab.label}
                    <Badge variant="secondary" className="text-[10px] ml-1">{tab.count}</Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <ScrollArea className="flex-1 min-h-0 mt-2">
              {loading ? (
                <div className="space-y-2 p-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('common.noResults', 'Nenhum resultado encontrado')}</p>
                </div>
              ) : (
                <div className="space-y-1.5 p-1">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${
                        item.hallucination_flag ? 'border-red-300 dark:border-red-800' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[9px]">{item.subject_type}</Badge>
                            <span className="font-medium text-sm text-primary truncate">{item.subject_name}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <Badge className="text-[10px] bg-accent text-accent-foreground">{item.predicate}</Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <Badge variant="outline" className="text-[9px]">{item.object_type}</Badge>
                            <span className="font-medium text-sm truncate">{item.object_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {item.extraction_confidence !== null && (
                              <Badge className={`text-[10px] ${confColor(item.extraction_confidence)}`}>
                                {Math.round(item.extraction_confidence * 100)}%
                              </Badge>
                            )}
                            {item.evidence_level && (
                              <Badge variant="outline" className="text-[9px]">{item.evidence_level}</Badge>
                            )}
                            {item.study_title && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                📄 {item.study_title}
                              </span>
                            )}
                            {item.hallucination_flag && (
                              <Badge variant="destructive" className="text-[9px]">⚠️ Halluc.</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2 flex-shrink-0"
                          onClick={() => {
                            setReviewingTriplet(item);
                            setReviewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {t('knowledgeGraph.tripletBank.review', 'Revisar')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      <TripletReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        triplet={reviewingTriplet}
        onReviewed={handleTripletReviewed}
      />
    </>
  );
};

export default TripletBankDialog;
