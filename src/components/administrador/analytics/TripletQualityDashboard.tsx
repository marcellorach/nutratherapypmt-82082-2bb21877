import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CheckCircle2, AlertTriangle, XCircle, FileSearch, Database, TrendingUp, Filter, RefreshCw, Trash2, Eye, Ghost } from 'lucide-react';
import { assessTripletQuality, normalizeScore } from '@/utils/score-normalization';
import { toast } from 'sonner';

const COLORS = {
  high: 'hsl(var(--chart-1))',
  medium: 'hsl(var(--chart-2))',
  low: 'hsl(var(--chart-3))',
  insufficient: 'hsl(var(--chart-4))',
};

const EVIDENCE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface TripletRow {
  id: string;
  study_id: string | null;
  subject_name: string;
  subject_type: string;
  predicate: string;
  object_name: string;
  object_type: string;
  species_context: string[] | null;
  evidence_level: string | null;
  dose_range: Record<string, unknown> | null;
  subject_layer: string | null;
  object_layer: string | null;
  extraction_confidence: number | null;
  hallucination_flag: boolean | null;
  curation_status: string | null;
  created_at: string | null;
}

const TripletQualityDashboard = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [studyFilter, setStudyFilter] = useState<string>('all');
  const [predicateFilter, setPredicateFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedTriplets, setSelectedTriplets] = useState<Set<string>>(new Set());
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Fetch all triplets
  const { data: triplets, isLoading: tripletsLoading, refetch: refetchTriplets } = useQuery({
    queryKey: ['triplet-quality-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('triplet_extractions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as TripletRow[];
    }
  });

  // Fetch studies for filter
  const { data: studies } = useQuery({
    queryKey: ['studies-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processed_studies')
        .select('id, title')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Filter triplets
  const filteredTriplets = useMemo(() => {
    if (!triplets) return [];
    
    return triplets.filter(t => {
      if (studyFilter !== 'all' && t.study_id !== studyFilter) return false;
      if (predicateFilter !== 'all' && t.predicate !== predicateFilter) return false;
      return true;
    });
  }, [triplets, studyFilter, predicateFilter]);

  // Calculate quality metrics
  const qualityMetrics = useMemo(() => {
    if (!filteredTriplets.length) return null;

    const assessments = filteredTriplets.map(t => assessTripletQuality({
      species_context: t.species_context as string[] | null,
      evidence_level: t.evidence_level,
      dose_range: t.dose_range as Record<string, unknown> | null,
      subject_layer: t.subject_layer,
      object_layer: t.object_layer,
      extraction_confidence: t.extraction_confidence
    }));

    const total = assessments.length;
    const withSpecies = assessments.filter(a => a.hasSpeciesContext).length;
    const withEvidence = assessments.filter(a => a.hasEvidenceLevel).length;
    const withDose = assessments.filter(a => a.hasDoseRange).length;
    const withLayers = assessments.filter(a => a.hasCorrectLayers).length;
    
    const confidenceLevels = {
      high: assessments.filter(a => a.confidenceLevel === 'high').length,
      medium: assessments.filter(a => a.confidenceLevel === 'medium').length,
      low: assessments.filter(a => a.confidenceLevel === 'low').length,
    };

    const avgConfidence = filteredTriplets.reduce((acc, t) => 
      acc + normalizeScore(t.extraction_confidence), 0) / total;

    const hallucinationCount = filteredTriplets.filter(t => t.hallucination_flag).length;

    return {
      total,
      speciesPercent: (withSpecies / total) * 100,
      evidencePercent: (withEvidence / total) * 100,
      dosePercent: (withDose / total) * 100,
      layersPercent: (withLayers / total) * 100,
      avgConfidence,
      confidenceLevels,
      completenessScore: ((withSpecies + withEvidence + withDose + withLayers) / (total * 4)) * 100,
      hallucinationCount,
      hallucinationPercent: (hallucinationCount / total) * 100
    };
  }, [filteredTriplets]);

  // Triplets with missing data
  const missingDataTriplets = useMemo(() => {
    if (!filteredTriplets.length) return { noSpecies: [], noEvidence: [], noDose: [] };

    return {
      noSpecies: filteredTriplets.filter(t => !t.species_context || t.species_context.length === 0),
      noEvidence: filteredTriplets.filter(t => !t.evidence_level),
      noDose: filteredTriplets.filter(t => !t.dose_range)
    };
  }, [filteredTriplets]);

  // Hallucinated triplets
  const hallucinatedTriplets = useMemo(() => {
    return filteredTriplets.filter(t => t.hallucination_flag);
  }, [filteredTriplets]);

  // Evidence distribution
  const evidenceDistribution = useMemo(() => {
    if (!filteredTriplets.length) return [];

    const counts: Record<string, number> = {};
    filteredTriplets.forEach(t => {
      const level = t.evidence_level || 'unknown';
      counts[level] = (counts[level] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTriplets]);

  // Predicate distribution
  const predicateDistribution = useMemo(() => {
    if (!filteredTriplets.length) return [];

    const counts: Record<string, number> = {};
    filteredTriplets.forEach(t => {
      const pred = t.predicate || 'unknown';
      counts[pred] = (counts[pred] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredTriplets]);

  // Get unique predicates for filter
  const uniquePredicates = useMemo(() => {
    if (!triplets) return [];
    const predicates = new Set(triplets.map(t => t.predicate).filter(Boolean));
    return Array.from(predicates).sort();
  }, [triplets]);

  // Low confidence triplets for review
  const lowConfidenceTriplets = useMemo(() => {
    if (!filteredTriplets.length) return [];
    
    return filteredTriplets
      .filter(t => normalizeScore(t.extraction_confidence) < 0.4)
      .slice(0, 10);
  }, [filteredTriplets]);

  // Get unique study IDs from selected triplets
  const selectedStudyIds = useMemo(() => {
    const studyIds = new Set<string>();
    selectedTriplets.forEach(tripletId => {
      const triplet = triplets?.find(t => t.id === tripletId);
      if (triplet?.study_id) {
        studyIds.add(triplet.study_id);
      }
    });
    return Array.from(studyIds);
  }, [selectedTriplets, triplets]);

  // Handle triplet selection
  const toggleTripletSelection = (tripletId: string) => {
    const newSelected = new Set(selectedTriplets);
    if (newSelected.has(tripletId)) {
      newSelected.delete(tripletId);
    } else {
      newSelected.add(tripletId);
    }
    setSelectedTriplets(newSelected);
  };

  // Handle select all in current view
  const toggleSelectAll = (tripletList: TripletRow[]) => {
    const allSelected = tripletList.every(t => selectedTriplets.has(t.id));
    const newSelected = new Set(selectedTriplets);
    
    if (allSelected) {
      tripletList.forEach(t => newSelected.delete(t.id));
    } else {
      tripletList.forEach(t => newSelected.add(t.id));
    }
    setSelectedTriplets(newSelected);
  };

  // Handle batch reprocess
  const handleBatchReprocess = async () => {
    if (selectedStudyIds.length === 0) {
      toast.error(t('tripletQuality.actions.noStudiesSelected', 'No studies selected for reprocessing'));
      return;
    }

    setIsReprocessing(true);
    try {
      const response = await supabase.functions.invoke('batch-reprocess-triplets', {
        body: { studyIds: selectedStudyIds, deleteExisting: true }
      });

      if (response.error) throw response.error;

      const result = response.data;
      toast.success(
        t('tripletQuality.actions.reprocessSuccess', 'Reprocessed {{count}} studies, generated {{triplets}} triplets', {
          count: result.summary.success,
          triplets: result.summary.totalNewTriplets
        })
      );

      // Refresh data
      setSelectedTriplets(new Set());
      await refetchTriplets();
      queryClient.invalidateQueries({ queryKey: ['triplet-quality-all'] });

    } catch (error: any) {
      console.error('Batch reprocess error:', error);
      toast.error(t('tripletQuality.actions.reprocessError', 'Error reprocessing: {{error}}', { error: error.message }));
    } finally {
      setIsReprocessing(false);
    }
  };

  // Handle delete selected triplets
  const handleDeleteSelected = async () => {
    if (selectedTriplets.size === 0) return;

    try {
      const { error } = await supabase
        .from('triplet_extractions')
        .delete()
        .in('id', Array.from(selectedTriplets));

      if (error) throw error;

      toast.success(t('tripletQuality.actions.deleteSuccess', 'Deleted {{count}} triplets', { count: selectedTriplets.size }));
      setSelectedTriplets(new Set());
      await refetchTriplets();
    } catch (error: any) {
      toast.error(t('tripletQuality.actions.deleteError', 'Error deleting triplets'));
    }
  };

  // Handle approve triplet (remove hallucination flag)
  const handleApproveTriplet = async (tripletId: string) => {
    try {
      const { error } = await supabase
        .from('triplet_extractions')
        .update({ hallucination_flag: false, curation_status: 'approved' })
        .eq('id', tripletId);

      if (error) throw error;

      toast.success(t('tripletQuality.actions.approved', 'Triplet approved'));
      await refetchTriplets();
    } catch (error: any) {
      toast.error(t('tripletQuality.actions.approveError', 'Error approving triplet'));
    }
  };

  if (tripletsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!triplets?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">{t('tripletQuality.noData', 'No triplets extracted yet')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('tripletQuality.noDataDesc', 'Process studies to generate triplets and see quality metrics here.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            {t('tripletQuality.title', 'Triplet Quality Dashboard')}
          </h2>
          <p className="text-muted-foreground">
            {t('tripletQuality.description', 'Monitor completeness and quality of extracted triplets')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={studyFilter} onValueChange={setStudyFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('tripletQuality.filters.byStudy', 'By Study')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('tripletQuality.filters.allStudies', 'All Studies')}</SelectItem>
              {studies?.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {(s.title || 'Untitled').slice(0, 40)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={predicateFilter} onValueChange={setPredicateFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('tripletQuality.filters.byPredicate', 'By Predicate')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('tripletQuality.filters.allPredicates', 'All Predicates')}</SelectItem>
              {uniquePredicates.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            {t('tripletQuality.tabs.overview', 'Overview')}
          </TabsTrigger>
          <TabsTrigger value="missingData" className="flex items-center gap-1">
            {t('tripletQuality.tabs.missingData', 'Missing Data')}
            {qualityMetrics && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {missingDataTriplets.noSpecies.length + missingDataTriplets.noEvidence.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hallucinations" className="flex items-center gap-1">
            <Ghost className="h-4 w-4" />
            {t('tripletQuality.tabs.hallucinations', 'Hallucinations')}
            {qualityMetrics && qualityMetrics.hallucinationCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {qualityMetrics.hallucinationCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {qualityMetrics && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('tripletQuality.metrics.total', 'Total Triplets')}
                    </CardTitle>
                    <FileSearch className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{qualityMetrics.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {filteredTriplets.length !== triplets?.length && 
                        `${t('tripletQuality.filtered', 'Filtered from')} ${triplets?.length}`
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('tripletQuality.metrics.avgConfidence', 'Average Confidence')}
                    </CardTitle>
                    {qualityMetrics.avgConfidence >= 0.7 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : qualityMetrics.avgConfidence >= 0.4 ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(qualityMetrics.avgConfidence * 100).toFixed(1)}%</div>
                    <Progress value={qualityMetrics.avgConfidence * 100} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('tripletQuality.metrics.completeness', 'Completeness Score')}
                    </CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{qualityMetrics.completenessScore.toFixed(1)}%</div>
                    <Progress value={qualityMetrics.completenessScore} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('tripletQuality.metrics.hallucinations', 'Potential Hallucinations')}
                    </CardTitle>
                    <Ghost className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-500">{qualityMetrics.hallucinationCount}</div>
                    <p className="text-xs text-muted-foreground">
                      {qualityMetrics.hallucinationPercent.toFixed(1)}% {t('tripletQuality.metrics.ofTotal', 'of total')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Field Completeness */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('tripletQuality.completeness.title', 'Field Completeness')}</CardTitle>
                  <CardDescription>
                    {t('tripletQuality.completeness.description', 'Percentage of triplets with each mandatory field filled')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('tripletQuality.fields.speciesContext', 'Species Context')}</span>
                        <span className="font-medium">{qualityMetrics.speciesPercent.toFixed(1)}%</span>
                      </div>
                      <Progress value={qualityMetrics.speciesPercent} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('tripletQuality.fields.evidenceLevel', 'Evidence Level')}</span>
                        <span className="font-medium">{qualityMetrics.evidencePercent.toFixed(1)}%</span>
                      </div>
                      <Progress value={qualityMetrics.evidencePercent} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('tripletQuality.fields.doseRange', 'Dose Range')}</span>
                        <span className="font-medium">{qualityMetrics.dosePercent.toFixed(1)}%</span>
                      </div>
                      <Progress value={qualityMetrics.dosePercent} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('tripletQuality.fields.correctLayers', 'Correct Layers')}</span>
                        <span className="font-medium">{qualityMetrics.layersPercent.toFixed(1)}%</span>
                      </div>
                      <Progress value={qualityMetrics.layersPercent} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('tripletQuality.charts.evidenceDistribution', 'Evidence Level Distribution')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={evidenceDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {evidenceDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={EVIDENCE_COLORS[index % EVIDENCE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('tripletQuality.charts.predicateDistribution', 'Top Predicates')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={predicateDistribution} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" className="text-xs" />
                          <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Low confidence triplets for review */}
              {lowConfidenceTriplets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      {t('tripletQuality.lowConfidence.title', 'Triplets Needing Review')}
                    </CardTitle>
                    <CardDescription>
                      {t('tripletQuality.lowConfidence.description', 'Low confidence triplets that may need manual verification')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {lowConfidenceTriplets.map((triplet) => (
                        <div key={triplet.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              <span className="text-primary">{triplet.subject_name}</span>
                              <span className="mx-2 text-muted-foreground">→</span>
                              <span className="text-orange-500">{triplet.predicate}</span>
                              <span className="mx-2 text-muted-foreground">→</span>
                              <span className="text-green-600">{triplet.object_name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {t('tripletQuality.confidence', 'Confidence')}: {(normalizeScore(triplet.extraction_confidence) * 100).toFixed(0)}%
                              {triplet.hallucination_flag && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  <Ghost className="h-3 w-3 mr-1" />
                                  {t('tripletQuality.hallucination', 'Hallucination')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Missing Data Tab */}
        <TabsContent value="missingData" className="space-y-6">
          {/* Action Bar */}
          {selectedTriplets.size > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="flex items-center justify-between py-3">
                <span className="text-sm">
                  {t('tripletQuality.selected', '{{count}} selected', { count: selectedTriplets.size })}
                  {selectedStudyIds.length > 0 && (
                    <span className="text-muted-foreground ml-2">
                      ({t('tripletQuality.fromStudies', 'from {{count}} studies', { count: selectedStudyIds.length })})
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchReprocess}
                    disabled={isReprocessing || selectedStudyIds.length === 0}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isReprocessing ? 'animate-spin' : ''}`} />
                    {t('tripletQuality.actions.reprocessStudies', 'Reprocess Studies')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={selectedTriplets.size === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('tripletQuality.actions.delete', 'Delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missing Species Context */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('tripletQuality.missingData.noSpecies', 'Missing Species Context')}</span>
                <Badge variant="secondary">{missingDataTriplets.noSpecies.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {missingDataTriplets.noSpecies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('tripletQuality.missingData.allComplete', 'All triplets have this field')}
                </p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={missingDataTriplets.noSpecies.every(t => selectedTriplets.has(t.id))}
                            onCheckedChange={() => toggleSelectAll(missingDataTriplets.noSpecies)}
                          />
                        </TableHead>
                        <TableHead>{t('tripletQuality.table.subject', 'Subject')}</TableHead>
                        <TableHead>{t('tripletQuality.table.predicate', 'Predicate')}</TableHead>
                        <TableHead>{t('tripletQuality.table.object', 'Object')}</TableHead>
                        <TableHead>{t('tripletQuality.table.confidence', 'Confidence')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {missingDataTriplets.noSpecies.slice(0, 20).map((triplet) => (
                        <TableRow key={triplet.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTriplets.has(triplet.id)}
                              onCheckedChange={() => toggleTripletSelection(triplet.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{triplet.subject_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{triplet.predicate}</Badge>
                          </TableCell>
                          <TableCell>{triplet.object_name}</TableCell>
                          <TableCell>
                            {(normalizeScore(triplet.extraction_confidence) * 100).toFixed(0)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {missingDataTriplets.noSpecies.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {t('tripletQuality.missingData.showingFirst', 'Showing first 20 of {{count}}', { count: missingDataTriplets.noSpecies.length })}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Missing Evidence Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('tripletQuality.missingData.noEvidence', 'Missing Evidence Level')}</span>
                <Badge variant="secondary">{missingDataTriplets.noEvidence.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {missingDataTriplets.noEvidence.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('tripletQuality.missingData.allComplete', 'All triplets have this field')}
                </p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={missingDataTriplets.noEvidence.every(t => selectedTriplets.has(t.id))}
                            onCheckedChange={() => toggleSelectAll(missingDataTriplets.noEvidence)}
                          />
                        </TableHead>
                        <TableHead>{t('tripletQuality.table.subject', 'Subject')}</TableHead>
                        <TableHead>{t('tripletQuality.table.predicate', 'Predicate')}</TableHead>
                        <TableHead>{t('tripletQuality.table.object', 'Object')}</TableHead>
                        <TableHead>{t('tripletQuality.table.confidence', 'Confidence')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {missingDataTriplets.noEvidence.slice(0, 20).map((triplet) => (
                        <TableRow key={triplet.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTriplets.has(triplet.id)}
                              onCheckedChange={() => toggleTripletSelection(triplet.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{triplet.subject_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{triplet.predicate}</Badge>
                          </TableCell>
                          <TableCell>{triplet.object_name}</TableCell>
                          <TableCell>
                            {(normalizeScore(triplet.extraction_confidence) * 100).toFixed(0)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hallucinations Tab */}
        <TabsContent value="hallucinations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ghost className="h-5 w-5 text-orange-500" />
                {t('tripletQuality.hallucinations.title', 'Potential Hallucinations Review')}
              </CardTitle>
              <CardDescription>
                {t('tripletQuality.hallucinations.description', 'Triplets where entity names were not found in the original study text. Review and approve valid ones or delete false positives.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hallucinatedTriplets.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">
                    {t('tripletQuality.hallucinations.none', 'No hallucinations detected')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('tripletQuality.hallucinations.noneDesc', 'All entity names were found in the study text')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hallucinatedTriplets.slice(0, 30).map((triplet) => (
                    <div key={triplet.id} className="flex items-center justify-between p-4 rounded-lg border border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/30">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          <span className="text-primary">{triplet.subject_name}</span>
                          <span className="mx-2 text-muted-foreground">→</span>
                          <Badge variant="outline" className="mx-1">{triplet.predicate}</Badge>
                          <span className="mx-2 text-muted-foreground">→</span>
                          <span className="text-green-600">{triplet.object_name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-3">
                          <span>{t('tripletQuality.confidence', 'Confidence')}: {(normalizeScore(triplet.extraction_confidence) * 100).toFixed(0)}%</span>
                          <span>•</span>
                          <span>{triplet.evidence_level || 'No evidence level'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveTriplet(triplet.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {t('tripletQuality.actions.approve', 'Approve')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedTriplets(new Set([triplet.id]));
                            handleDeleteSelected();
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t('tripletQuality.actions.delete', 'Delete')}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {hallucinatedTriplets.length > 30 && (
                    <p className="text-sm text-muted-foreground text-center">
                      {t('tripletQuality.hallucinations.showingFirst', 'Showing first 30 of {{count}} hallucinations', { count: hallucinatedTriplets.length })}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TripletQualityDashboard;
