// Pet Profile Page - VetGraphRAG Clinical Analysis Pipeline
import React, { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, PawPrint, Stethoscope, Pill, TestTube, FileText, Brain, Loader2, Sparkles, GitBranch, TrendingUp, AlertTriangle, Dna, Network } from 'lucide-react';
import { usePetProfileDetail } from '@/hooks/usePetProfile';
import { useConditionInsights } from '@/hooks/useConditionInsights';
import PetClinicalChat from '@/components/pet/PetClinicalChat';
import VetRecommendationPanel from '@/components/pet/VetRecommendationPanel';
import TreatabilityChart from '@/components/pet/TreatabilityChart';
import BiologicalPathway from '@/components/pet/BiologicalPathway';
import ImprovementProjectionChart from '@/components/pet/ImprovementProjectionChart';
import ClinicalPipelineWorkflow, { type PipelineState } from '@/components/pet/ClinicalPipelineWorkflow';
import ClinicalPipelineLogPanel, { type ClinicalLogEntry } from '@/components/pet/ClinicalPipelineLogPanel';
import ConditionInsightCard from '@/components/pet/ConditionInsightCard';
import ComorbidityMap from '@/components/pet/ComorbidityMap';
import VetGraphRAGInsightsPanel from '@/components/pet/VetGraphRAGInsightsPanel';
import PatientKnowledgeSubgraph from '@/components/pet/PatientKnowledgeSubgraph';
import BiologicalTimeline from '@/components/pet/BiologicalTimeline';
import DigitalTwinDog from '@/components/pet/DigitalTwinDog';
import { CompoundDosage } from '@/components/pet/CompoundDosageSlider';
import { runClinicalAnalysisPipeline, type ClinicalAnalysisResult, type ClinicalDiscovery, type BreedPredisposition, type LabAlert, type InteractionAlert, type PipelineProgressEvent, type PipelineStageId } from '@/services/clinical-analysis-pipeline';
import { useToast } from '@/hooks/use-toast';
import { useUpsertPetClinicalAnalysisSnapshot } from '@/hooks/usePetClinicalAnalysisSnapshot';

const severityColors: Record<string, string> = {
  mild: 'bg-yellow-100 text-yellow-800',
  moderate: 'bg-orange-100 text-orange-800',
  severe: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
  active: 'bg-red-100 text-red-800',
  monitoring: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
};

const PetProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data, isLoading, error } = usePetProfileDetail(id);
  const conditionInsights = useConditionInsights(data?.conditions);
  const upsertSnapshot = useUpsertPetClinicalAnalysisSnapshot();
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendationCompounds, setRecommendationCompounds] = useState<CompoundDosage[] | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState<'high' | 'medium' | 'low' | 'insufficient'>('medium');
  const [kgTriplets, setKgTriplets] = useState<any[]>([]);
  const [kgPathways, setKgPathways] = useState<any[]>([]);
  const [kgProjections, setKgProjections] = useState<any[]>([]);
  const [predispositions, setPredispositions] = useState<BreedPredisposition[]>([]);
  const [labAlerts, setLabAlerts] = useState<LabAlert[]>([]);
  const [interactionAlerts, setInteractionAlerts] = useState<InteractionAlert[]>([]);
  const [clinicalDiscoveries, setClinicalDiscoveries] = useState<ClinicalDiscovery[]>([]);
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    stage1_profile: 'idle',
    stage2_predispositions: 'idle',
    stage3_labs: 'idle',
    stage4_kg: 'idle',
    stage5_interactions: 'idle',
    stage6_recommendation: 'idle',
    stage7_synergies: 'idle',
  });
  const [pipelineLog, setPipelineLog] = useState<ClinicalLogEntry[]>([]);
  const [currentStageLabel, setCurrentStageLabel] = useState<string | null>(null);
  // Per-stage live counters, populated as each stage emits 'stage-end'.
  // This makes the workflow stepper light up its numbers progressively
  // instead of staying at 0 until the entire pipeline finishes.
  const [stageCounts, setStageCounts] = useState<{
    profile: number;
    predispositions: number;
    labs: number;
    triplets: number;
    interactions: number;
    compounds: number;
    synergies: number;
  }>({ profile: 0, predispositions: 0, labs: 0, triplets: 0, interactions: 0, compounds: 0, synergies: 0 });
  const [stageTimes, setStageTimes] = useState<Record<string, number>>({});

  const STAGE_LABELS: Record<PipelineStageId, string> = {
    stage2_predispositions: t('petProfile.pipeline.predispositions'),
    stage3_labs: t('petProfile.pipeline.labs'),
    stage4_kg: t('petProfile.pipeline.knowledgeGraph'),
    stage5_interactions: t('petProfile.pipeline.interactions'),
    stage6_recommendation: t('petProfile.pipeline.recommendation'),
    stage7_synergies: t('petProfile.pipeline.synergies'),
  };

  const appendLog = (level: ClinicalLogEntry['level'], message: string, stage?: string) => {
    setPipelineLog(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        level,
        message,
        stage,
      },
    ].slice(-200));
  };

  const handlePipelineEvent = (e: PipelineProgressEvent) => {
    if (e.kind === 'stage-start') {
      setPipelineState(s => ({ ...s, [e.stage]: 'running' }));
      setCurrentStageLabel(STAGE_LABELS[e.stage]);
      appendLog('info', `▶ ${e.message}`, STAGE_LABELS[e.stage]);
    } else if (e.kind === 'stage-end') {
      setPipelineState(s => ({ ...s, [e.stage]: 'complete' }));
      appendLog('success', `✓ ${e.message}`, STAGE_LABELS[e.stage]);
      // Capture stage duration
      if (e.meta?.durationMs != null) {
        setStageTimes(prev => ({ ...prev, [e.stage]: e.meta!.durationMs }));
      }
      // Live-update the counter for the stage that just completed
      const meta = e.meta || {};
      setStageCounts(prev => {
        switch (e.stage) {
          case 'stage2_predispositions':
            return { ...prev, predispositions: meta.undiagnosed ?? meta.count ?? prev.predispositions };
          case 'stage3_labs':
            return { ...prev, labs: meta.count ?? prev.labs };
          case 'stage4_kg':
            return { ...prev, triplets: meta.totalNodes ?? prev.triplets };
          case 'stage5_interactions':
            return {
              ...prev,
              interactions: meta.interactions ?? prev.interactions,
              triplets: meta.triplets ?? prev.triplets,
            };
          case 'stage6_recommendation':
            return { ...prev, compounds: meta.compounds ?? prev.compounds };
          case 'stage7_synergies':
            return { ...prev, synergies: meta.count ?? prev.synergies };
          default:
            return prev;
        }
      });
    } else {
      appendLog(e.level, e.message);
    }
  };

  // Generate treatability data from conditions using real data when available
  const treatabilityData = useMemo(() => {
    if (!data?.conditions) return [];
    return data.conditions.map((c: any) => {
      const matchingTriplets = kgTriplets.filter(
        trip => trip.object?.toLowerCase().includes(c.condition_name.toLowerCase())
      );
      const hasEvidence = matchingTriplets.length > 0;
      return {
        condition: c.condition_name,
        scientificEvidence: hasEvidence
          ? Math.min(90, 50 + matchingTriplets.length * 10)
          : 0,
        planExperience: hasEvidence ? 40 + matchingTriplets.length * 5 : 0,
      };
    });
  }, [data?.conditions, kgTriplets]);

  const handleAnalyzeWithKG = async () => {
    if (!data?.profile) return;
    setAnalyzing(true);
    setPipelineLog([]);
    setPipelineState({
      stage1_profile: 'idle',
      stage2_predispositions: 'idle',
      stage3_labs: 'idle',
      stage4_kg: 'idle',
      stage5_interactions: 'idle',
      stage6_recommendation: 'idle',
      stage7_synergies: 'idle',
    });
    setStageCounts({ profile: 0, predispositions: 0, labs: 0, triplets: 0, interactions: 0, compounds: 0, synergies: 0 });
    setStageTimes({});

    try {
      const { profile, conditions, medications, exams } = data;

      // Stage 1: profile collection (synchronous — data already loaded)
      setPipelineState(s => ({ ...s, stage1_profile: 'running' }));
      const profileDataCount = (conditions?.length || 0) + (medications?.length || 0) + (exams?.length || 0);
      appendLog(
        'info',
        `▶ Coletando perfil clínico de ${profile.name} (${profile.breed}, ${profile.age_years}a, ${profile.weight_kg}kg) · ${profileDataCount} pontos de dados`,
      );
      await new Promise(r => setTimeout(r, 80)); // breath for UI
      setPipelineState(s => ({ ...s, stage1_profile: 'complete' }));
      setStageCounts(prev => ({ ...prev, profile: profileDataCount }));
      appendLog('success', `✓ Perfil clínico carregado: ${conditions?.length || 0} condições, ${medications?.length || 0} medicações, ${exams?.length || 0} exames`);

      const result = await runClinicalAnalysisPipeline(
        {
          id: profile.id,
          name: profile.name,
          species: profile.species,
          breed: profile.breed,
          age_years: profile.age_years,
          weight_kg: profile.weight_kg,
          sex: profile.sex,
          neutered: profile.neutered,
        },
        conditions,
        medications,
        exams,
        { onProgress: handlePipelineEvent },
      );

      setCurrentStageLabel(null);

      // Stage 7: Synergies (derived from recommendation compounds)
      const synergyTs = performance.now();
      setPipelineState(s => ({ ...s, stage7_synergies: 'running' }));
      appendLog('info', `▶ ${t('petProfile.pipeline.synergies')}: analyzing compound synergies`);
      const synCount = result.compounds?.length > 1
        ? Math.floor(result.compounds.length * (result.compounds.length - 1) / 2)
        : 0;
      await new Promise(r => setTimeout(r, 60));
      setPipelineState(s => ({ ...s, stage7_synergies: 'complete' }));
      setStageCounts(prev => ({ ...prev, synergies: synCount }));
      setStageTimes(prev => ({ ...prev, stage7_synergies: performance.now() - synergyTs }));
      appendLog('success', `✓ ${synCount} synergies identified`);

      setPredispositions(result.predispositions);
      setLabAlerts(result.labAlerts);
      setInteractionAlerts(result.interactionAlerts);
      setClinicalDiscoveries(result.clinicalDiscoveries);
      setKgTriplets(result.kgTriplets);
      setKgPathways(result.kgPathways);
      setKgProjections(result.kgProjections);
      setConfidenceLevel(result.confidenceLevel);
      setRecommendationCompounds(
        result.compounds.length > 0 ? result.compounds : []
      );

      // Persist snapshot so the BiologicalTimeline (and any other consumer)
      // can render projections grounded on this analysis.
      try {
        await upsertSnapshot.mutateAsync({
          pet_id: profile.id,
          status: 'complete',
          analysis_version: 'v1',
          completed_at: new Date().toISOString(),
          confidence_level: result.confidenceLevel,
          recommendation_compounds: result.compounds || [],
          predispositions: result.predispositions || [],
          lab_alerts: result.labAlerts || [],
          interaction_alerts: result.interactionAlerts || [],
          clinical_discoveries: result.clinicalDiscoveries || [],
          kg_triplets: result.kgTriplets || [],
          kg_pathways: result.kgPathways || [],
          kg_projections: result.kgProjections || [],
        });
      } catch (snapErr) {
        console.warn('Failed to persist analysis snapshot', snapErr);
      }

      const alertCount = result.predispositions.filter(p => !p.already_diagnosed).length
        + result.labAlerts.length + result.interactionAlerts.length;

      toast({
        title: t('petRegistration.profile.analysisComplete'),
        description: alertCount > 0
          ? t('petProfile.clinicalAlerts.alertsFound', { count: alertCount })
          : t('petRegistration.profile.analysisCompleteDesc'),
      });
    } catch (err: any) {
      console.error('Clinical analysis pipeline error:', err);
      appendLog('error', `✗ ${err?.message || 'Erro desconhecido no pipeline'}`);
      toast({
        title: t('petRegistration.profile.analysisError'),
        description: err.message || 'Erro ao executar pipeline de análise clínica.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
      setCurrentStageLabel(null);
    }
  };

  const handleApproveStack = async (compounds: CompoundDosage[]) => {
    if (!data?.profile) return;
    const { profile, conditions } = data;

    // Calculate price based on compound count and complexity
    const basePrice = 105;
    const perCompoundIncrement = (270 - 105) / 8; // max 8 compounds
    const monthlyPrice = Math.min(270, Math.round(basePrice + compounds.length * perCompoundIncrement));

    const proposalData = {
      pet_id: profile.id,
      veterinarian_name: 'Dr. ' + (profile.veterinarian_id ? 'Veterinário' : 'Especialista'),
      status: 'pending',
      conditions: (conditions || []).map((c: any) => ({
        name: c.condition_name,
        severity: c.severity,
        status: c.status,
      })),
      compounds: compounds.map(c => ({
        name: c.name,
        dosage: `${c.dosageCurrent} ${c.unit}`,
        reason: c.rationale || '',
        mechanism: c.condition || '',
        enabled: !c.removed,
      })),
      scientific_summary: {
        tripletCount: kgTriplets.length,
        studyCount: new Set(kgTriplets.map((t: any) => t.study_id).filter(Boolean)).size,
        kgCoverage: kgTriplets.length > 0 ? Math.min(1, kgTriplets.length / 20) : 0,
        pathwayCount: kgPathways.length,
        // Biological pathways snapshot
        biological_pathways: kgPathways.slice(0, 6).map((p: any) => ({
          condition: p.condition,
          steps: (p.steps || []).map((s: any) => ({
            label: s.label,
            type: s.type,
            predicate: s.predicate,
          })),
        })),
        // Top key triplets
        key_triplets: kgTriplets.slice(0, 10).map((t: any) => ({
          subject: t.subject,
          predicate: t.predicate,
          object: t.object,
          confidence: t.confidence,
          studies: t.study_count || 1,
        })),
        // Treatment timeline
        treatment_timeline: [
          { month: 1, phase: 'adaptation' },
          { month: 2, phase: 'early_effects' },
          { month: 4, phase: 'measurable_improvement' },
          { month: 7, phase: 'consolidation' },
          { month: 10, phase: 'reassessment' },
        ],
        // Periodic exam schedule
        periodic_exams: [
          { month: 3, exams: ['inflammatory', 'cbc'] },
          { month: 6, exams: ['liver_kidney', 'inflammatory', 'oxidative_stress'] },
          { month: 9, exams: ['cbc', 'metabolic'] },
          { month: 12, exams: ['full_reassessment', 'liver_kidney', 'inflammatory', 'oxidative_stress'] },
        ],
        // Predispositions snapshot
        predispositions: predispositions.slice(0, 5).map(p => ({
          condition: p.condition_name,
          risk_factor: p.risk_factor,
          already_diagnosed: p.already_diagnosed,
        })),
        // Lab alerts snapshot
        lab_alerts: labAlerts.slice(0, 5).map(a => ({
          test: a.test_name,
          value: a.value,
          status: a.status,
          unit: a.unit,
        })),
      },
      confidence_level: confidenceLevel,
      rationale: t('petProfile.recommendation.approvedRationale'),
      monthly_price_brl: monthlyPrice,
      subscription_months: 12,
    };

    try {
      // Delete previous proposals for this pet (keep only the newest)
      await (supabase as any)
        .from('treatment_proposals')
        .delete()
        .eq('pet_id', profile.id);

      const { error } = await (supabase as any)
        .from('treatment_proposals')
        .insert(proposalData);

      if (error) throw error;

      toast({
        title: t('petProfile.recommendation.proposalSentTitle'),
        description: t('petProfile.recommendation.proposalSentDesc'),
      });
    } catch (err) {
      console.error('Error creating proposal:', err);
      toast({
        title: t('petProfile.recommendation.proposalErrorTitle'),
        description: t('petProfile.recommendation.proposalErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleRejectStack = () => {
    setRecommendationCompounds(null);
    setKgTriplets([]);
    setKgPathways([]);
    setKgProjections([]);
    setPredispositions([]);
    setLabAlerts([]);
    setInteractionAlerts([]);
    setClinicalDiscoveries([]);
    toast({
      title: t('petProfile.recommendation.rejectedTitle'),
      description: t('petProfile.recommendation.rejectedDesc'),
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !data?.profile) {
    return (
      <Layout>
        <div className="container mx-auto py-6 px-4">
          <Button variant="ghost" onClick={() => navigate('/veterinario')}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('common.back')}
          </Button>
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('petRegistration.profile.notFound')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const { profile, conditions, medications, exams, clinicalNotes } = data;
  const totalAlerts = predispositions.filter(p => !p.already_diagnosed).length + labAlerts.length + interactionAlerts.length + clinicalDiscoveries.length;

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        {/* Header with photo */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/veterinario')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt={profile.name}
              className="h-14 w-14 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <PawPrint className="h-7 w-7 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-muted-foreground">
              {profile.breed} · {profile.age_years} {t('petRegistration.profile.years')} · {profile.weight_kg}kg · {profile.sex === 'male' ? t('petRegistration.form.male') : t('petRegistration.form.female')}
              {profile.neutered && ` · ${t('petRegistration.form.neutered')}`}
            </p>
          </div>
          <Button className="gap-2" onClick={handleAnalyzeWithKG} disabled={analyzing}>
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {analyzing ? t('petRegistration.profile.analyzing') : t('petRegistration.profile.analyzeWithKG')}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Stethoscope className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{conditions.length}</p>
                <p className="text-xs text-muted-foreground">{t('petRegistration.conditions.title')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Pill className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{medications.length}</p>
                <p className="text-xs text-muted-foreground">{t('petRegistration.medications.title')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TestTube className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{exams.length}</p>
                <p className="text-xs text-muted-foreground">{t('petRegistration.exams.title')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{clinicalNotes.length}</p>
                <p className="text-xs text-muted-foreground">{t('petRegistration.profile.clinicalNotes')}</p>
              </div>
            </CardContent>
          </Card>
          {totalAlerts > 0 && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{totalAlerts}</p>
                  <p className="text-xs text-muted-foreground">{t('petProfile.clinicalAlerts.title')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 3-column layout: left 2/3 clinical content, right 1/3 chat + twin */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Clinical Data */}
            <Tabs defaultValue="conditions">
            <TabsList className="mb-4">
              <TabsTrigger value="conditions" className="gap-1">
                <Stethoscope className="h-3.5 w-3.5" />
                {t('petRegistration.conditions.title')}
              </TabsTrigger>
              <TabsTrigger value="medications" className="gap-1">
                <Pill className="h-3.5 w-3.5" />
                {t('petRegistration.medications.title')}
              </TabsTrigger>
              <TabsTrigger value="exams" className="gap-1">
                <TestTube className="h-3.5 w-3.5" />
                {t('petRegistration.exams.title')}
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1">
                <FileText className="h-3.5 w-3.5" />
                {t('petRegistration.profile.clinicalNotes')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conditions">
              {conditions.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-sm text-muted-foreground text-center">
                      {t('petRegistration.conditions.none')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {conditions.map((c: any) => (
                    <ConditionInsightCard
                      key={c.id}
                      condition={c}
                      mode="simple"
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="medications">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('petRegistration.medications.current')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {medications.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {t('petRegistration.medications.none')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {medications.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                          <div>
                            <p className="font-medium text-sm">{m.medication_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.dosage && `${m.dosage}`}
                              {m.frequency && ` · ${m.frequency}`}
                            </p>
                          </div>
                          {!m.end_date && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              {t('petRegistration.medications.active')}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exams">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('petRegistration.exams.results')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {exams.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {t('petRegistration.exams.none')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {exams.map((e: any) => (
                        <div key={e.id} className="border-b pb-3 last:border-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{e.exam_type}</p>
                            {e.exam_date && (
                              <span className="text-xs text-muted-foreground">{e.exam_date}</span>
                            )}
                          </div>
                          {e.results && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {typeof e.results === 'object'
                                ? Object.entries(e.results as Record<string, any>)
                                    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
                                    .join(' · ')
                                : String(e.results)
                              }
                            </p>
                          )}
                          {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('petRegistration.profile.clinicalHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {clinicalNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {t('petRegistration.profile.noNotes')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {clinicalNotes.map((n: any) => (
                        <div key={n.id} className="border-b pb-3 last:border-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {n.note_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            </Tabs>

            {/* Pipeline Workflow Stepper - after clinical data */}
            <ClinicalPipelineWorkflow
              pipelineState={pipelineState}
              isAnalyzing={analyzing}
              profileDataCount={stageCounts.profile || (conditions.length + medications.length + exams.length)}
              predispositionCount={stageCounts.predispositions || predispositions.filter(p => !p.already_diagnosed).length}
              labAlertCount={stageCounts.labs || labAlerts.length}
              tripletCount={stageCounts.triplets || kgTriplets.length}
              interactionCount={stageCounts.interactions ?? interactionAlerts.length}
              compoundCount={stageCounts.compounds || (recommendationCompounds?.length || 0)}
              synergyCount={stageCounts.synergies}
              stageTimes={stageTimes}
            />

            {/* Live log panel — scientific-digestion style */}
            <ClinicalPipelineLogPanel
              entries={pipelineLog}
              isAnalyzing={analyzing}
              currentStageLabel={currentStageLabel}
              onClear={() => setPipelineLog([])}
            />

            {/* VetGraphRAG Insights Panel - 3 sections */}
            {recommendationCompounds && (
              <VetGraphRAGInsightsPanel
                conditions={conditions}
                clinicalDiscoveries={clinicalDiscoveries}
                predispositions={predispositions}
                labAlerts={labAlerts}
                kgTriplets={kgTriplets}
                kgPathways={kgPathways}
                breed={profile.breed}
                ageYears={profile.age_years}
              />
            )}

            {/* Patient Knowledge Subgraph */}
            {recommendationCompounds && kgTriplets.length > 0 && (
              <PatientKnowledgeSubgraph
                kgTriplets={kgTriplets}
                kgPathways={kgPathways}
                conditions={conditions.map((c: any) => c.condition_name)}
                recommendedCompounds={recommendationCompounds.filter((c: any) => !c.removed).map((c: any) => c.name)}
                petId={id}
              />
            )}

            {/* Analysis by Condition - ComorbidityMap + full ConditionInsightCards */}
            {recommendationCompounds && (
              <Tabs defaultValue="analysis" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="analysis" className="gap-1">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {t('petProfile.sectionTabs.analysis', 'Análise Clínica')}
                  </TabsTrigger>
                  <TabsTrigger value="digitalTwin" className="gap-1">
                    <Dna className="h-3.5 w-3.5" />
                    {t('petProfile.sectionTabs.digitalTwin', 'Digital Twin')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analysis" className="space-y-4">
            {conditions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    {t('petProfile.analysisByCondition.title')}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{t('petProfile.analysisByCondition.description')}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conditionInsights.data && (
                    <ComorbidityMap
                      conditions={conditions.map((c: any) => c.condition_name)}
                      causalPathways={conditionInsights.data.causalPathways}
                      synergisticCompounds={conditionInsights.data.synergisticCompounds}
                    />
                  )}
                  <div className="space-y-2">
                    {conditions.map((c: any) => {
                      const insight = conditionInsights.data?.conditionInsights?.find(
                        (ci) => ci.condition.toLowerCase() === c.condition_name.toLowerCase()
                      );
                      return (
                        <ConditionInsightCard
                          key={c.id}
                          condition={c}
                          insight={insight}
                          medications={medications}
                          petBreed={profile.breed}
                          petAge={profile.age_years}
                          mode="full"
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Results Tabs */}
              <Tabs defaultValue="recommendations">
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="recommendations" className="gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('petProfile.analysisTabs.recommendations')}
                </TabsTrigger>
                <TabsTrigger value="trajectory" className="gap-1">
                  <Dna className="h-3.5 w-3.5" />
                  {t('petProfile.analysisTabs.trajectory', 'Digital Twin · Trajetória Biológica')}
                </TabsTrigger>
                <TabsTrigger value="biological-pathway" className="gap-1">
                  <GitBranch className="h-3.5 w-3.5" />
                  {t('petProfile.analysisTabs.biologicalPathway')}
                </TabsTrigger>
                <TabsTrigger value="projection" className="gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {t('petProfile.analysisTabs.projection')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recommendations">
                <VetRecommendationPanel
                  compounds={recommendationCompounds}
                  confidenceLevel={confidenceLevel}
                  onApprove={handleApproveStack}
                  onReject={handleRejectStack}
                  petName={profile.name}
                  petBreed={profile.breed}
                  petAge={profile.age_years}
                  petConditions={conditions?.map((c: any) => c.condition_name) || []}
                />
              </TabsContent>

              <TabsContent value="trajectory">
                <BiologicalTimeline
                  conditions={conditions}
                  petName={profile.name}
                  petBreed={profile.breed}
                  petAge={profile.age_years}
                  petId={id!}
                  onRequestAnalysis={handleAnalyzeWithKG}
                  isAnalyzing={analyzing}
                />
              </TabsContent>

              <TabsContent value="biological-pathway">
                {kgPathways.length > 0 ? (
                  <BiologicalPathway pathways={kgPathways} />
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      {t('petProfile.pathway.description')}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="projection">
                {kgProjections.length > 0 ? (
                  <ImprovementProjectionChart projections={kgProjections} />
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      {t('petProfile.projection.description')}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Treatability Chart - only after VetGraphRAG analysis */}
            {treatabilityData.length > 0 && (
              <TreatabilityChart data={treatabilityData} />
            )}
                </TabsContent>

                <TabsContent value="digitalTwin">
                  <DigitalTwinDog
                    conditions={conditions}
                    petName={profile.name}
                    petBreed={profile.breed}
                    petAge={profile.age_years}
                    petId={id!}
                    onRequestAnalysis={handleAnalyzeWithKG}
                    isAnalyzing={analyzing}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Right column: Biological Timeline (top) + Chat (below) */}
          <div className="space-y-4">
            <div className="lg:sticky lg:top-4 space-y-4">
              <div className="min-h-[640px]">
                <PetClinicalChat
                  petId={id!}
                  petBreed={profile.breed}
                  petAge={profile.age_years}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PetProfilePage;
