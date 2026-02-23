import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, PawPrint, Stethoscope, Pill, TestTube, FileText, Brain, Loader2, AlertTriangle, CheckCircle, FlaskConical, Shield } from 'lucide-react';
import { usePetProfileDetail } from '@/hooks/usePetProfile';
import PetClinicalChat from '@/components/pet/PetClinicalChat';
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
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);

  const handleAnalyzeWithKG = async () => {
    if (!data?.profile) return;
    setAnalyzing(true);
    
    try {
      const { profile, conditions } = data;
      const conditionNames = conditions.map((c: any) => c.condition_name);
      
      // Step 1: Query KG for each condition
      const kgResults: any[] = [];
      
      for (const condition of conditionNames.length > 0 ? conditionNames : ['aging', 'longevity']) {
        try {
          const { data: kgData, error: kgError } = await supabase.functions.invoke('graph-rag-search', {
            body: {
              queryType: 'context',
              sourceEntity: condition,
            }
          });
          
          if (!kgError && kgData?.data) {
            kgResults.push({ condition, graphData: kgData.data });
          }
        } catch (e) {
          console.warn(`KG query for ${condition} failed:`, e);
        }
      }

      // Step 2: Get hybrid recommendation (uses AI + KG data)
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

      setAnalysisResult({
        kgResults,
        recommendation,
        petProfile: profile,
        conditions: conditionNames,
      });
      setAnalysisDialogOpen(true);
      
      toast({
        title: t('petRegistration.profile.analysisComplete', 'Análise Concluída'),
        description: t('petRegistration.profile.analysisCompleteDesc', 'Recomendações geradas com base no Knowledge Graph.'),
      });
    } catch (err: any) {
      console.error('KG Analysis error:', err);
      toast({
        title: t('petRegistration.profile.analysisError', 'Erro na Análise'),
        description: err.message || 'Erro ao consultar o Knowledge Graph.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
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
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/veterinario')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PawPrint className="h-6 w-6" />
              {profile.name}
            </h1>
            <p className="text-muted-foreground">
              {profile.breed} · {profile.age_years} {t('petRegistration.profile.years')} · {profile.weight_kg}kg · {profile.sex === 'male' ? t('petRegistration.form.male') : t('petRegistration.form.female')}
              {profile.neutered && ` · ${t('petRegistration.form.neutered')}`}
            </p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleAnalyzeWithKG}
            disabled={analyzing}
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {analyzing 
              ? t('petRegistration.profile.analyzing', 'Analisando...') 
              : t('petRegistration.profile.analyzeWithKG')}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
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
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(e.results, null, 2)}
                              </pre>
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

          {/* Chat Sidebar */}
          <div className="min-h-[500px]">
            <PetClinicalChat
              petId={id!}
              petBreed={profile.breed}
              petAge={profile.age_years}
            />
          </div>
        </div>
      </div>

      {/* KG Analysis Results Dialog */}
      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t('petRegistration.profile.kgAnalysisTitle', 'Análise VetGraphRAG')}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {analysisResult && (
              <div className="space-y-6 pr-4">
                {/* Patient Summary */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">
                    {analysisResult.petProfile?.name} · {analysisResult.petProfile?.breed} · {analysisResult.petProfile?.age_years} {t('petRegistration.profile.years')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('petRegistration.profile.conditionsAnalyzed', 'Condições analisadas')}: {analysisResult.conditions?.join(', ') || 'Bem-estar geriátrico'}
                  </p>
                </div>

                {/* KG Graph Data */}
                {analysisResult.kgResults?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <FlaskConical className="h-4 w-4" />
                      {t('petRegistration.profile.kgFindings', 'Achados no Knowledge Graph')}
                    </h4>
                    {analysisResult.kgResults.map((result: any, idx: number) => (
                      <div key={idx} className="mb-3 p-3 border rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{result.condition}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(result.graphData?.nodes || []).slice(0, 12).map((node: any, nIdx: number) => (
                            <Badge key={nIdx} variant="outline" className="text-xs">
                              {node.label || node.properties?.name}
                              <span className="ml-1 opacity-60">({node.type})</span>
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.graphData?.nodes?.length || 0} {t('petRegistration.profile.entitiesFound', 'entidades')} · {result.graphData?.relationships?.length || 0} {t('petRegistration.profile.relationsFound', 'relações')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nutraceutical Recommendations */}
                {analysisResult.recommendation?.nutraceuticals?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('petRegistration.profile.recommendedStack', 'Stack Recomendado')}
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.recommendation.nutraceuticals.map((nutra: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{nutra.name}</p>
                            <Badge variant="secondary" className="text-xs">{nutra.evidenceLevel}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{nutra.dosage}</p>
                          <p className="text-xs mt-1">{nutra.mechanism}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rationale */}
                {analysisResult.recommendation?.rationale && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      {t('petRegistration.profile.rationale', 'Fundamentação')}
                    </h4>
                    <p className="text-sm text-muted-foreground">{analysisResult.recommendation.rationale}</p>
                  </div>
                )}

                {/* Enrichment */}
                {analysisResult.recommendation?.enrichment && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      {t('petRegistration.profile.clinicalConsiderations', 'Considerações Clínicas Adicionais')}
                    </h4>
                    <p className="text-sm text-muted-foreground">{analysisResult.recommendation.enrichment}</p>
                  </div>
                )}

                {/* Precautions */}
                {analysisResult.recommendation?.precautions?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-amber-500" />
                      {t('petRegistration.profile.precautions', 'Precauções')}
                    </h4>
                    <ul className="space-y-1">
                      {analysisResult.recommendation.precautions.map((p: string, idx: number) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <AlertTriangle className="h-3 w-3 mt-0.5 text-amber-500 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {t('petRegistration.profile.disclaimer', 'Esta análise é gerada por IA e deve ser validada por um veterinário. Não substitui consulta profissional.')}
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PetProfilePage;
