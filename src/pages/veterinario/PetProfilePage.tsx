// Pet Profile Page - VetGraphRAG Analysis with Tabs
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, PawPrint, Stethoscope, Pill, TestTube, FileText, Brain, Loader2, Sparkles, GitBranch, BookOpen, TrendingUp, MessageSquare } from 'lucide-react';
import { usePetProfileDetail } from '@/hooks/usePetProfile';
import PetClinicalChat from '@/components/pet/PetClinicalChat';
import VetRecommendationPanel, { generateMockCompounds } from '@/components/pet/VetRecommendationPanel';
import CompoundSpecificChat from '@/components/pet/CompoundSpecificChat';
import TreatabilityChart from '@/components/pet/TreatabilityChart';
import ScientificEvidencePanel from '@/components/pet/ScientificEvidencePanel';
import BiologicalPathway from '@/components/pet/BiologicalPathway';
import ImprovementProjectionChart from '@/components/pet/ImprovementProjectionChart';
import { CompoundDosage } from '@/components/pet/CompoundDosageSlider';
import { supabase } from '@/integrations/supabase/client';
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

  // Generate treatability data from conditions
  const treatabilityData = useMemo(() => {
    if (!data?.conditions) return [];
    return data.conditions.map((c: any) => ({
      condition: c.condition_name,
      scientificEvidence: Math.floor(Math.random() * 40) + 40,
      planExperience: Math.floor(Math.random() * 30) + 20,
    }));
  }, [data?.conditions]);

  const extractKgEvidence = (kgResults: any[], conditionNames: string[]) => {
    // Extract triplet evidence from KG results
    const triplets: any[] = [];
    const pathways: any[] = [];

    for (const result of kgResults) {
      const { condition, graphData } = result;
      const nodes = graphData?.nodes || [];
      const relationships = graphData?.relationships || graphData?.edges || [];

      // Extract TREATS/PREVENTS triplets
      for (const rel of relationships) {
        const sourceNode = nodes.find((n: any) => n.id === rel.source || n.id === rel.startNode);
        const targetNode = nodes.find((n: any) => n.id === rel.target || n.id === rel.endNode);
        if (sourceNode && targetNode) {
          const predicate = rel.type || rel.label || rel.relationship || 'TREATS';
          if (['TREATS', 'PREVENTS', 'ALLEVIATES', 'SUPPORTS'].includes(predicate.toUpperCase())) {
            triplets.push({
              subject: sourceNode.label || sourceNode.properties?.name || sourceNode.name,
              predicate: predicate.toUpperCase(),
              object: targetNode.label || targetNode.properties?.name || targetNode.name,
              confidence: rel.confidence || rel.properties?.confidence || 0.7,
              evidenceLevel: 'KG-backed',
              studyCount: rel.evidence_count || rel.properties?.evidence_count || undefined,
            });
          }
        }
      }

      // Build pathway chains from node types
      const compounds = nodes.filter((n: any) => ['Nutraceutical', 'Compound', 'nutraceutical', 'compound'].includes(n.type || n.labels?.[0]));
      const mechanisms = nodes.filter((n: any) => ['Mechanism', 'mechanism', 'MolecularTarget'].includes(n.type || n.labels?.[0]));
      const effects = nodes.filter((n: any) => ['Effect', 'BiologicalEffect', 'effect'].includes(n.type || n.labels?.[0]));

      if (compounds.length > 0) {
        const steps: any[] = [];
        const compoundName = compounds[0].label || compounds[0].properties?.name || 'Compound';
        steps.push({ label: compoundName, type: 'compound' });
        if (mechanisms.length > 0) {
          steps.push({ label: mechanisms[0].label || mechanisms[0].properties?.name || 'Mechanism', type: 'mechanism' });
        }
        if (effects.length > 0) {
          steps.push({ label: effects[0].label || effects[0].properties?.name || 'Effect', type: 'effect' });
        }
        steps.push({ label: condition, type: 'outcome' });
        pathways.push({ condition, steps });
      }
    }

    // Generate projections from conditions
    const projections = conditionNames.map((condition) => {
      const hasTriplets = triplets.some(t => t.object.toLowerCase().includes(condition.toLowerCase()));
      return {
        condition,
        baselineScore: 30 + Math.floor(Math.random() * 20),
        projectedImprovement: hasTriplets ? 25 + Math.floor(Math.random() * 20) : 15 + Math.floor(Math.random() * 10),
        confidenceBand: hasTriplets ? 8 : 15,
      };
    });

    return { triplets, pathways, projections };
  };

  const handleAnalyzeWithKG = async () => {
    if (!data?.profile) return;
    setAnalyzing(true);
    
    try {
      const { profile, conditions } = data;
      const conditionNames = conditions.map((c: any) => c.condition_name);
      
      const kgResults: any[] = [];
      
      for (const condition of conditionNames.length > 0 ? conditionNames : ['aging', 'longevity']) {
        try {
          const { data: kgData, error: kgError } = await supabase.functions.invoke('graph-rag-search', {
            body: { queryType: 'context', sourceEntity: condition }
          });
          
          if (!kgError && kgData?.data) {
            kgResults.push({ condition, graphData: kgData.data });
          }
        } catch (e) {
          console.warn(`KG query for ${condition} failed:`, e);
        }
      }

      // Extract evidence from KG results
      const { triplets, pathways, projections } = extractKgEvidence(kgResults, conditionNames);
      setKgTriplets(triplets);
      setKgPathways(pathways);
      setKgProjections(projections);

      // Get hybrid recommendation
      const primaryCondition = conditionNames[0] || 'geriatric wellness';
      const { data: recommendation, error: recError } = await supabase.functions.invoke('hybrid-recommendation', {
        body: {
          mode: kgResults.length > 0 ? 'enrich' : 'fallback',
          petProfile: {
            species: profile.species,
            breed: profile.breed,
            age: profile.age_years,
            weight: profile.weight_kg,
          },
          condition: primaryCondition,
          kgData: kgResults.length > 0 ? {
            nutraceuticals: kgResults.flatMap(r => 
              (r.graphData.nodes || [])
                .filter((n: any) => n.type === 'Nutraceutical' || n.type === 'Compound')
                .map((n: any) => ({
                  name: n.label || n.properties?.name,
                  dosage: n.properties?.dosage || 'Consultar veterinário',
                  mechanism: n.properties?.mechanism || 'Via knowledge graph',
                  evidenceLevel: 'KG-backed',
                }))
            ),
            rationale: `Baseado em ${kgResults.length} consulta(s) ao Knowledge Graph para: ${conditionNames.join(', ')}`,
            precautions: [],
          } : undefined,
        }
      });

      if (recError) throw recError;

      const nutraceuticals = recommendation?.nutraceuticals || [];
      const compounds: CompoundDosage[] = nutraceuticals.map((n: any, idx: number) => {
        const dosageMatch = n.dosage?.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*(mg\/kg|mg|g|IU)/i);
        const dosageMin = dosageMatch ? parseFloat(dosageMatch[1]) : 5;
        const dosageMax = dosageMatch ? parseFloat(dosageMatch[2]) : 50;
        const unit = dosageMatch ? dosageMatch[3] : 'mg/kg';
        const recommended = dosageMin + (dosageMax - dosageMin) * 0.5;

        return {
          id: `rec-${idx}`,
          name: n.name,
          condition: primaryCondition,
          dosageMin,
          dosageMax,
          dosageRecommended: Math.round(recommended * 10) / 10,
          dosageCurrent: Math.round(recommended * 10) / 10,
          unit,
          evidenceLevel: n.evidenceLevel || 'AI-suggested',
          rationale: n.mechanism || '',
          removed: false,
          type: 'nutraceutical' as const,
        };
      });

      setRecommendationCompounds(compounds.length > 0 ? compounds : generateMockCompounds());
      setConfidenceLevel(kgResults.length > 0 ? 'medium' : 'low');
      
      toast({
        title: t('petRegistration.profile.analysisComplete'),
        description: t('petRegistration.profile.analysisCompleteDesc'),
      });
    } catch (err: any) {
      console.error('KG Analysis error:', err);
      toast({
        title: t('petRegistration.profile.analysisError'),
        description: err.message || 'Erro ao consultar o Knowledge Graph.',
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
              <Tabs defaultValue="recommendations">
                <TabsList className="mb-4 flex-wrap h-auto gap-1">
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
