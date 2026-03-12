// Pet Profile Page - VetGraphRAG Clinical Analysis Pipeline
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, PawPrint, Stethoscope, Pill, TestTube, FileText, Brain, Loader2, Sparkles, GitBranch, BookOpen, TrendingUp, MessageSquare, AlertTriangle } from 'lucide-react';
import { usePetProfileDetail } from '@/hooks/usePetProfile';
import { useConditionInsights } from '@/hooks/useConditionInsights';
import PetClinicalChat from '@/components/pet/PetClinicalChat';
import VetRecommendationPanel, { generateMockCompounds } from '@/components/pet/VetRecommendationPanel';
import CompoundSpecificChat from '@/components/pet/CompoundSpecificChat';
import TreatabilityChart from '@/components/pet/TreatabilityChart';
import ScientificEvidencePanel from '@/components/pet/ScientificEvidencePanel';
import BiologicalPathway from '@/components/pet/BiologicalPathway';
import ImprovementProjectionChart from '@/components/pet/ImprovementProjectionChart';
import ClinicalAlertsPanel from '@/components/pet/ClinicalAlertsPanel';
import ClinicalPipelineWorkflow, { type PipelineState } from '@/components/pet/ClinicalPipelineWorkflow';
import ConditionInsightCard from '@/components/pet/ConditionInsightCard';
import ComorbidityMap from '@/components/pet/ComorbidityMap';
import { CompoundDosage } from '@/components/pet/CompoundDosageSlider';
import { runClinicalAnalysisPipeline, type ClinicalAnalysisResult, type BreedPredisposition, type LabAlert, type InteractionAlert } from '@/services/clinical-analysis-pipeline';
import { useToast } from '@/hooks/use-toast';

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
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendationCompounds, setRecommendationCompounds] = useState<CompoundDosage[] | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState<'high' | 'medium' | 'low' | 'insufficient'>('medium');
  const [kgTriplets, setKgTriplets] = useState<any[]>([]);
  const [kgPathways, setKgPathways] = useState<any[]>([]);
  const [kgProjections, setKgProjections] = useState<any[]>([]);
  const [predispositions, setPredispositions] = useState<BreedPredisposition[]>([]);
  const [labAlerts, setLabAlerts] = useState<LabAlert[]>([]);
  const [interactionAlerts, setInteractionAlerts] = useState<InteractionAlert[]>([]);
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    stage1_profile: 'idle',
    stage2_predispositions: 'idle',
    stage3_labs: 'idle',
    stage4_kg: 'idle',
    stage5_interactions: 'idle',
    stage6_recommendation: 'idle',
  });

  // Generate treatability data from conditions using real data when available
  const treatabilityData = useMemo(() => {
    if (!data?.conditions) return [];
    return data.conditions.map((c: any) => {
      // Use KG triplet data if available for more accurate scores
      const matchingTriplets = kgTriplets.filter(
        trip => trip.object?.toLowerCase().includes(c.condition_name.toLowerCase())
      );
      const hasEvidence = matchingTriplets.length > 0;
      return {
        condition: c.condition_name,
        scientificEvidence: hasEvidence
          ? Math.min(90, 50 + matchingTriplets.length * 10)
          : 30 + Math.floor(Math.random() * 20),
        planExperience: hasEvidence ? 40 + matchingTriplets.length * 5 : 20 + Math.floor(Math.random() * 15),
      };
    });
  }, [data?.conditions, kgTriplets]);

  const handleAnalyzeWithKG = async () => {
    if (!data?.profile) return;
    setAnalyzing(true);

    try {
      const { profile, conditions, medications, exams } = data;

      // Stage 1: Profile
      setPipelineState(s => ({ ...s, stage1_profile: 'running' }));
      await new Promise(r => setTimeout(r, 200)); // Small delay to show step
      setPipelineState(s => ({ ...s, stage1_profile: 'complete', stage2_predispositions: 'running' }));

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
        exams
      );

      // Update pipeline stages progressively
      setPipelineState(s => ({ ...s, stage2_predispositions: 'complete', stage3_labs: 'complete', stage4_kg: 'complete', stage5_interactions: 'complete', stage6_recommendation: 'complete' }));

      // Update all state from pipeline result
      setPredispositions(result.predispositions);
      setLabAlerts(result.labAlerts);
      setInteractionAlerts(result.interactionAlerts);
      setKgTriplets(result.kgTriplets);
      setKgPathways(result.kgPathways);
      setKgProjections(result.kgProjections);
      setConfidenceLevel(result.confidenceLevel);
      setRecommendationCompounds(
        result.compounds.length > 0 ? result.compounds : generateMockCompounds()
      );

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
      toast({
        title: t('petRegistration.profile.analysisError'),
        description: err.message || 'Erro ao executar pipeline de análise clínica.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApproveStack = (compounds: CompoundDosage[]) => {
    console.log('Stack approved:', compounds);
  };

  const handleRejectStack = () => {
    setRecommendationCompounds(null);
    setKgTriplets([]);
    setKgPathways([]);
    setKgProjections([]);
    setPredispositions([]);
    setLabAlerts([]);
    setInteractionAlerts([]);
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
  const totalAlerts = predispositions.filter(p => !p.already_diagnosed).length + labAlerts.length + interactionAlerts.length;

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

        {/* Pipeline Workflow Stepper */}
        <div className="mb-6">
          <ClinicalPipelineWorkflow
            pipelineState={pipelineState}
            isAnalyzing={analyzing}
            profileDataCount={conditions.length + medications.length + exams.length}
            predispositionCount={predispositions.filter(p => !p.already_diagnosed).length}
            labAlertCount={labAlerts.length}
            tripletCount={kgTriplets.length}
            interactionCount={interactionAlerts.length}
            compoundCount={recommendationCompounds?.length || 0}
          />
        </div>

        {/* Main Grid: Content + Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Treatability Chart */}
            {treatabilityData.length > 0 && (
              <TreatabilityChart data={treatabilityData} />
            )}

            {/* Analysis Results Tabs */}
            {recommendationCompounds && (
              <Tabs defaultValue={totalAlerts > 0 ? 'clinical-alerts' : 'recommendations'}>
                <TabsList className="mb-4 flex-wrap h-auto gap-1">
                  {totalAlerts > 0 && (
                    <TabsTrigger value="clinical-alerts" className="gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t('petProfile.analysisTabs.clinicalAlerts')}
                      <Badge variant="outline" className="ml-1 text-xs h-5 px-1.5 bg-orange-100 text-orange-800">
                        {totalAlerts}
                      </Badge>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="recommendations" className="gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('petProfile.analysisTabs.recommendations')}
                  </TabsTrigger>
                  <TabsTrigger value="biological-pathway" className="gap-1">
                    <GitBranch className="h-3.5 w-3.5" />
                    {t('petProfile.analysisTabs.biologicalPathway')}
                  </TabsTrigger>
                  <TabsTrigger value="scientific-evidence" className="gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {t('petProfile.analysisTabs.scientificEvidence')}
                  </TabsTrigger>
                  <TabsTrigger value="projection" className="gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {t('petProfile.analysisTabs.projection')}
                  </TabsTrigger>
                  <TabsTrigger value="compound-chat" className="gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {t('petProfile.analysisTabs.compoundChat')}
                  </TabsTrigger>
                </TabsList>

                {totalAlerts > 0 && (
                  <TabsContent value="clinical-alerts">
                    <ClinicalAlertsPanel
                      predispositions={predispositions}
                      labAlerts={labAlerts}
                      interactionAlerts={interactionAlerts}
                      breed={profile.breed}
                      ageYears={profile.age_years}
                    />
                  </TabsContent>
                )}

                <TabsContent value="recommendations">
                  <VetRecommendationPanel
                    compounds={recommendationCompounds}
                    confidenceLevel={confidenceLevel}
                    onApprove={handleApproveStack}
                    onReject={handleRejectStack}
                    petName={profile.name}
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

                <TabsContent value="scientific-evidence">
                  {kgTriplets.length > 0 ? (
                    <ScientificEvidencePanel triplets={kgTriplets} />
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-sm text-muted-foreground">
                        {t('petProfile.evidence.description')}
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

                <TabsContent value="compound-chat">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {t('petProfile.analysisTabs.compoundChat')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CompoundSpecificChat
                        compounds={recommendationCompounds}
                        petName={profile.name}
                        petBreed={profile.breed}
                        petAge={profile.age_years}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {/* Existing Tabs */}
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('petRegistration.conditions.active')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {conditions.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        {t('petRegistration.conditions.none')}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {conditions.map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                            <div>
                              <p className="font-medium text-sm">{c.condition_name}</p>
                              {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                            </div>
                            <div className="flex gap-2">
                              {c.severity && (
                                <Badge variant="outline" className={severityColors[c.severity]}>
                                  {c.severity}
                                </Badge>
                              )}
                              <Badge variant="outline" className={statusColors[c.status]}>
                                {c.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
          </div>

          {/* Chat Sidebar (1/3) */}
          <div className="min-h-[500px]">
            <PetClinicalChat
              petId={id!}
              petBreed={profile.breed}
              petAge={profile.age_years}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PetProfilePage;
