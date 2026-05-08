
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, Info, ShoppingCart, Brain, Loader2, FileText, Sparkles, AlertTriangle, Dna } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import TreatmentProposalCard from '@/components/tutor/TreatmentProposalCard';

interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed: string;
  age_years: number;
  weight_kg: number;
  sex: string;
  owner_name: string | null;
}

interface RecommendationLog {
  id: string;
  recommendation_data: any;
  rationale: string | null;
  confidence_overall: number | null;
  confidence_level: string | null;
  recommendation_source: string | null;
  created_at: string | null;
  warnings: string[] | null;
}

interface AnalysisSnapshot {
  id: string;
  pet_id: string;
  status: string;
  completed_at: string | null;
  confidence_level: string | null;
  recommendation_compounds: any[];
  predispositions: any[];
  lab_alerts: any[];
  interaction_alerts: any[];
  clinical_discoveries: any[];
  kg_triplets: any[];
}

const TutorPage: React.FC = () => {
  const { t } = useTranslation();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [selectedOwner, setSelectedOwner] = useState<string>('__all__');
  const [recommendations, setRecommendations] = useState<RecommendationLog[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [snapshot, setSnapshot] = useState<AnalysisSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  
  useEffect(() => {
    const loadPets = async () => {
      setIsLoading(true);
      try {
        // Pet ids with proposals
        const { data: proposalPetIds, error: propError } = await (supabase as any)
          .from('treatment_proposals')
          .select('pet_id');

        // Pet ids with completed (approved) clinical analysis snapshots
        const { data: snapshotPetIds } = await (supabase as any)
          .from('pet_clinical_analysis_snapshots')
          .select('pet_id')
          .eq('status', 'complete');

        const allowedPetIds = new Set<string>(
          [
            ...((proposalPetIds || []).map((p: any) => p.pet_id)),
            ...((snapshotPetIds || []).map((p: any) => p.pet_id)),
          ]
        );

        const { data, error } = await supabase
          .from('pet_profiles')
          .select('id, name, species, breed, age_years, weight_kg, sex, owner_name')
          .order('name');
        
        if (!error && data && data.length > 0) {
          const filteredPets = allowedPetIds.size > 0
            ? data.filter(p => allowedPetIds.has(p.id))
            : [];
          
          setPets(filteredPets);
          if (filteredPets.length > 0) {
            setSelectedPetId(filteredPets[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading pets:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPets();
  }, []);
  
  useEffect(() => {
    if (!selectedPetId) return;
    
    const loadRecommendations = async () => {
      setIsLoadingRecs(true);
      try {
        const { data, error } = await supabase
          .from('recommendation_logs')
          .select('id, recommendation_data, rationale, confidence_overall, confidence_level, recommendation_source, created_at, warnings')
          .eq('pet_id', selectedPetId)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setRecommendations(data as RecommendationLog[]);
        }
      } catch (err) {
        console.error('Error loading recommendations:', err);
      } finally {
        setIsLoadingRecs(false);
      }
    };

    const loadProposals = async () => {
      setIsLoadingProposals(true);
      try {
        const { data, error } = await (supabase as any)
          .from('treatment_proposals')
          .select('*')
          .eq('pet_id', selectedPetId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (!error && data) {
          setProposals(data);
        }
      } catch (err) {
        console.error('Error loading proposals:', err);
      } finally {
        setIsLoadingProposals(false);
      }
    };

    const loadSnapshot = async () => {
      setIsLoadingSnapshot(true);
      try {
        const { data, error } = await (supabase as any)
          .from('pet_clinical_analysis_snapshots')
          .select('*')
          .eq('pet_id', selectedPetId)
          .eq('status', 'complete')
          .maybeSingle();
        if (!error) setSnapshot((data as AnalysisSnapshot) || null);
      } catch (err) {
        console.error('Error loading snapshot:', err);
      } finally {
        setIsLoadingSnapshot(false);
      }
    };

    loadRecommendations();
    loadProposals();
    loadSnapshot();
  }, [selectedPetId]);
  
  const ownersList = React.useMemo(() => {
    const set = new Set<string>();
    pets.forEach(p => { if (p.owner_name) set.add(p.owner_name); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [pets]);

  const visiblePets = React.useMemo(() => (
    selectedOwner === '__all__' ? pets : pets.filter(p => p.owner_name === selectedOwner)
  ), [pets, selectedOwner]);

  // If selected pet is no longer visible after switching owner, pick the first visible.
  useEffect(() => {
    if (visiblePets.length === 0) return;
    if (!visiblePets.find(p => p.id === selectedPetId)) {
      setSelectedPetId(visiblePets[0].id);
    }
  }, [visiblePets, selectedPetId]);

  const selectedPet = pets.find(p => p.id === selectedPetId);
  const ownerName = selectedPet?.owner_name || t('tutor.greeting');
  const pendingProposals = proposals.filter(p => p.status === 'pending');
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-12 text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">{t('tutor.greeting')}, {ownerName}!</h1>
          <p className="text-muted-foreground">{t('tutor.subtitle')}</p>
        </div>
        
        {pets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-xl font-semibold text-foreground mb-2">{t('tutor.noPets')}</h3>
              <p className="text-muted-foreground mb-6">{t('tutor.noPetsDesc')}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {ownersList.length > 1 && (
              <div className="mb-4 max-w-xs">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {t('tutor.ownerSelectorLabel')}
                </label>
                <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t('tutor.allOwners')}</SelectItem>
                    {ownersList.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {visiblePets.map(pet => (
                <Button
                  key={pet.id}
                  variant={pet.id === selectedPetId ? "default" : "outline"}
                  onClick={() => setSelectedPetId(pet.id)}
                  className="flex items-center gap-2"
                >
                  {pet.species?.toLowerCase().includes('dog') || pet.species?.toLowerCase().includes('cachorro') || pet.species?.toLowerCase().includes('canin') ? '🐕' : 
                   pet.species?.toLowerCase().includes('cat') || pet.species?.toLowerCase().includes('gato') || pet.species?.toLowerCase().includes('felin') ? '🐈' : '🐾'}
                  {pet.name}
                  {pet.owner_name && (
                    <span className="text-xs opacity-70">· {pet.owner_name}</span>
                  )}
                </Button>
              ))}
            </div>
            
            {selectedPet && (
              <>
                <div className="bg-card p-6 rounded-lg shadow-md mb-6 border">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-foreground">
                        {selectedPet.species?.toLowerCase().includes('dog') || selectedPet.species?.toLowerCase().includes('cachorro') ? '🐕' : 
                         selectedPet.species?.toLowerCase().includes('cat') || selectedPet.species?.toLowerCase().includes('gato') ? '🐈' : '🐾'}
                        {selectedPet.name}
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        {selectedPet.breed} • {selectedPet.age_years} {t('tutor.petInfo.years')} • {selectedPet.weight_kg} {t('tutor.petInfo.kg')}
                      </p>
                    </div>
                    
                    {pendingProposals.length > 0 && (
                      <Badge variant="default" className="h-fit self-start gap-1 text-sm">
                        <FileText className="h-4 w-4" />
                        {pendingProposals.length} {t('tutor.tabs.proposals')}
                      </Badge>
                    )}

                    {recommendations.length === 0 && !isLoadingRecs && pendingProposals.length === 0 && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 p-4 mt-4 md:mt-0 rounded-r">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-amber-800 dark:text-amber-300">{t('tutor.noTreatmentPlan')}</h3>
                            <p className="text-amber-700 dark:text-amber-400 text-sm">{t('tutor.noTreatmentPlanDesc')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <Tabs defaultValue={pendingProposals.length > 0 ? "propostas" : "plano"} className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="propostas" className="relative">
                      {t('tutor.tabs.proposals')}
                      {pendingProposals.length > 0 && (
                        <span className="ml-1.5 bg-primary text-primary-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center">
                          {pendingProposals.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="plano">{t('tutor.tabs.plan')}</TabsTrigger>
                    <TabsTrigger value="analise">{t('tutor.analysisTab')}</TabsTrigger>
                    <TabsTrigger value="historico">{t('tutor.tabs.history')}</TabsTrigger>
                    <TabsTrigger value="pedidos">{t('tutor.tabs.orders')}</TabsTrigger>
                  </TabsList>

                  {/* Proposals Tab */}
                  <TabsContent value="propostas">
                    {isLoadingProposals ? (
                      <div className="text-center py-12">
                        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
                      </div>
                    ) : proposals.length > 0 ? (
                      <div className="space-y-6 max-w-2xl mx-auto">
                        {proposals.map(proposal => (
                          <TreatmentProposalCard
                            key={proposal.id}
                            proposal={proposal}
                            petName={selectedPet.name}
                            petBreed={selectedPet.breed}
                            petAge={selectedPet.age_years}
                            onAccepted={() => {
                              setProposals(prev =>
                                prev.map(p =>
                                  p.id === proposal.id
                                    ? { ...p, status: 'accepted', accepted_at: new Date().toISOString() }
                                    : p
                                )
                              );
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <Card className="text-center py-12">
                        <CardContent>
                          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-xl font-semibold text-foreground mb-2">{t('tutor.proposal.noPendingTitle')}</h3>
                          <p className="text-muted-foreground">{t('tutor.proposal.noPendingDesc')}</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="plano">
                    {isLoadingRecs ? (
                      <div className="text-center py-12">
                        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
                      </div>
                    ) : recommendations.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                {t('tutor.plan.startDate')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold text-foreground">
                                {recommendations[0]?.created_at 
                                  ? new Date(recommendations[0].created_at).toLocaleDateString('pt-BR')
                                  : '-'}
                              </p>
                              <p className="text-muted-foreground text-sm">{t('tutor.plan.active')}</p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                {t('tutor.plan.status')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold text-green-500">{t('tutor.plan.approved')}</p>
                              <p className="text-muted-foreground text-sm">{recommendations.length} recomendação(ões)</p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Brain className="h-5 w-5 text-primary" />
                                {t('tutor.proposal.confidenceLabel') || 'Confiança Geral'}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold text-foreground">
                                {recommendations[0]?.confidence_overall 
                                  ? `${Math.round(recommendations[0].confidence_overall * 100)}%`
                                  : '-'}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {recommendations[0]?.recommendation_source || 'VetGraphRAG'}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-4 text-foreground">{t('tutor.plan.recommendedNutraceuticals')}</h3>
                        <div className="space-y-4">
                          {recommendations.map(rec => {
                            const data = rec.recommendation_data || {};
                            const compounds = data.compounds || data.nutraceuticals || [];
                            
                            return (
                              <Card key={rec.id} className="border-l-4 border-l-primary">
                                <CardHeader>
                                  <CardTitle>{data.title || data.condition || 'Recomendação'}</CardTitle>
                                  <CardDescription>
                                    {rec.rationale || 'Baseado na análise VetGraphRAG do Knowledge Graph'}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {compounds.length > 0 ? (
                                      compounds.map((compound: any, idx: number) => (
                                        <div key={idx} className="bg-muted/50 p-3 rounded">
                                          <p className="font-medium text-foreground">{compound.name || compound}</p>
                                          {compound.dosage && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                              Dosagem: {compound.dosage}
                                            </p>
                                          )}
                                          {compound.reason && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                              {compound.reason}
                                            </p>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-sm text-muted-foreground col-span-2">
                                        {rec.rationale || 'Detalhes disponíveis na análise completa.'}
                                      </p>
                                    )}
                                  </div>
                                  
                                  {rec.warnings && rec.warnings.length > 0 && (
                                    <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 p-3 rounded text-sm">
                                      <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">⚠️ Avisos:</p>
                                      {rec.warnings.map((w, i) => (
                                        <p key={i} className="text-amber-700 dark:text-amber-400">• {w}</p>
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <Card className="text-center py-12">
                        <CardContent>
                          <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-xl font-semibold text-foreground mb-2">{t('tutor.noTreatmentPlan')}</h3>
                          <p className="text-muted-foreground mb-6">{t('tutor.noTreatmentPlanLong')}</p>
                          <Button variant="outline">
                            {t('tutor.plan.scheduleConsultation')}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="analise">
                    {isLoadingSnapshot ? (
                      <div className="text-center py-12">
                        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
                      </div>
                    ) : !snapshot ? (
                      <Card className="text-center py-12">
                        <CardContent>
                          <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">{t('tutor.analysisNoData')}</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              {t('tutor.analysisTitle')}
                            </CardTitle>
                            <CardDescription>
                              {snapshot.completed_at
                                ? `${t('tutor.analysisCompletedAt')} ${new Date(snapshot.completed_at).toLocaleDateString('pt-BR')}`
                                : ''}
                              {snapshot.confidence_level ? ` · ${t('tutor.analysisConfidence')}: ${snapshot.confidence_level}` : ''}
                              {` · ${snapshot.kg_triplets?.length || 0} ${t('tutor.analysisKgTriplets')}`}
                            </CardDescription>
                          </CardHeader>
                        </Card>

                        {snapshot.recommendation_compounds?.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">{t('tutor.analysisCompounds')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {snapshot.recommendation_compounds.map((c: any, idx: number) => (
                                  <div key={c.id || idx} className="bg-muted/50 p-3 rounded border-l-2 border-l-primary">
                                    <p className="font-medium text-foreground">{c.name}</p>
                                    {c.condition && (
                                      <p className="text-xs text-muted-foreground">{t('tutor.analysisCondition')}: {c.condition}</p>
                                    )}
                                    {(c.dosageRecommended ?? c.dosageCurrent) != null && c.unit && (
                                      <p className="text-xs text-muted-foreground">
                                        {t('tutor.analysisDosage')}: {c.dosageRecommended ?? c.dosageCurrent} {c.unit}
                                      </p>
                                    )}
                                    {c.evidenceLevel && (
                                      <p className="text-xs text-muted-foreground">{t('tutor.analysisEvidence')}: {c.evidenceLevel}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {snapshot.predispositions?.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Dna className="h-4 w-4 text-primary" />
                                {t('tutor.analysisPredispositions')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                                {snapshot.predispositions.map((p: any, i: number) => (
                                  <li key={i}>{typeof p === 'string' ? p : (p.name || p.condition || JSON.stringify(p))}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {snapshot.lab_alerts?.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                {t('tutor.analysisLabAlerts')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                                {snapshot.lab_alerts.map((a: any, i: number) => (
                                  <li key={i}>{typeof a === 'string' ? a : (a.message || a.label || a.name || JSON.stringify(a))}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {snapshot.interaction_alerts?.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">{t('tutor.analysisInteractions')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                                {snapshot.interaction_alerts.map((a: any, i: number) => (
                                  <li key={i}>{typeof a === 'string' ? a : (a.message || a.label || JSON.stringify(a))}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {snapshot.clinical_discoveries?.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">{t('tutor.analysisDiscoveries')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                                {snapshot.clinical_discoveries.map((d: any, i: number) => (
                                  <li key={i}>{typeof d === 'string' ? d : (d.message || d.label || d.name || JSON.stringify(d))}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="historico">
                    <Card className="text-center py-12">
                      <CardContent>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{t('tutor.history.title')}</h3>
                        <p className="text-muted-foreground mb-6">{t('tutor.history.description')}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="pedidos">
                    <Card className="text-center py-12">
                      <CardContent>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{t('tutor.orders.title')}</h3>
                        <p className="text-muted-foreground mb-6">{t('tutor.orders.description')}</p>
                        <Button className="flex items-center gap-2 mx-auto">
                          <ShoppingCart className="h-4 w-4" />
                          {t('tutor.orders.makeOrder')}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default TutorPage;
