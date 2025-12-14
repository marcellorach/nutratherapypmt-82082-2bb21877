import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CheckCircle2, AlertTriangle, XCircle, FileSearch, Database, TrendingUp, Filter } from 'lucide-react';
import { assessTripletQuality, calculateRecommendationScore, normalizeScore } from '@/utils/score-normalization';

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

const TripletQualityDashboard = () => {
  const { t } = useTranslation();
  const [studyFilter, setStudyFilter] = useState<string>('all');
  const [predicateFilter, setPredicateFilter] = useState<string>('all');

  // Fetch all triplets
  const { data: triplets, isLoading: tripletsLoading } = useQuery({
    queryKey: ['triplet-quality-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('triplet_extractions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
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

    return {
      total,
      speciesPercent: (withSpecies / total) * 100,
      evidencePercent: (withEvidence / total) * 100,
      dosePercent: (withDose / total) * 100,
      layersPercent: (withLayers / total) * 100,
      avgConfidence,
      confidenceLevels,
      completenessScore: ((withSpecies + withEvidence + withDose + withLayers) / (total * 4)) * 100
    };
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
                  {t('tripletQuality.metrics.highConfidence', 'High Confidence')}
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{qualityMetrics.confidenceLevels.high}</div>
                <div className="flex gap-1 mt-2">
                  <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                    High: {qualityMetrics.confidenceLevels.high}
                  </Badge>
                  <Badge variant="default" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    Med: {qualityMetrics.confidenceLevels.medium}
                  </Badge>
                  <Badge variant="default" className="bg-red-500/10 text-red-500 border-red-500/20">
                    Low: {qualityMetrics.confidenceLevels.low}
                  </Badge>
                </div>
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
                          <span className="text-muted-foreground mx-2">→</span>
                          <span className="text-yellow-600 dark:text-yellow-400">{triplet.predicate}</span>
                          <span className="text-muted-foreground mx-2">→</span>
                          <span className="text-blue-600 dark:text-blue-400">{triplet.object_name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                          <span>{triplet.evidence_level || 'No evidence level'}</span>
                          <span>•</span>
                          <span>{(triplet.species_context as string[])?.join(', ') || 'No species'}</span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          normalizeScore(triplet.extraction_confidence) < 0.3 
                            ? 'border-red-500 text-red-500' 
                            : 'border-yellow-500 text-yellow-500'
                        }
                      >
                        {(normalizeScore(triplet.extraction_confidence) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default TripletQualityDashboard;
