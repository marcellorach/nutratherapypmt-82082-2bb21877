
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, Info, ShoppingCart, Brain, Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

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

const TutorPage: React.FC = () => {
  const { t } = useTranslation();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [recommendations, setRecommendations] = useState<RecommendationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  
  // Load pets from database
  useEffect(() => {
    const loadPets = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('pet_profiles')
          .select('id, name, species, breed, age_years, weight_kg, sex, owner_name')
          .order('name');
        
        if (!error && data && data.length > 0) {
          setPets(data);
          setSelectedPetId(data[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar pets:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPets();
  }, []);
  
  // Load recommendations when pet changes
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
        console.error('Erro ao carregar recomendações:', err);
      } finally {
        setIsLoadingRecs(false);
      }
    };
    loadRecommendations();
  }, [selectedPetId]);
  
  const selectedPet = pets.find(p => p.id === selectedPetId);
  const ownerName = selectedPet?.owner_name || t('tutor.greeting');
  
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
            <div className="flex flex-wrap gap-2 mb-6">
              {pets.map(pet => (
                <Button
                  key={pet.id}
                  variant={pet.id === selectedPetId ? "default" : "outline"}
                  onClick={() => setSelectedPetId(pet.id)}
                  className="flex items-center gap-2"
                >
                  {pet.species?.toLowerCase().includes('dog') || pet.species?.toLowerCase().includes('cachorro') || pet.species?.toLowerCase().includes('canin') ? '🐕' : 
                   pet.species?.toLowerCase().includes('cat') || pet.species?.toLowerCase().includes('gato') || pet.species?.toLowerCase().includes('felin') ? '🐈' : '🐾'}
                  {pet.name}
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
                    
                    {recommendations.length === 0 && !isLoadingRecs && (
                      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mt-4 md:mt-0 rounded-r">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-amber-800">{t('tutor.noTreatmentPlan')}</h3>
                            <p className="text-amber-700 text-sm">{t('tutor.noTreatmentPlanDesc')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <Tabs defaultValue="plano" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="plano">{t('tutor.tabs.plan')}</TabsTrigger>
                    <TabsTrigger value="historico">{t('tutor.tabs.history')}</TabsTrigger>
                    <TabsTrigger value="pedidos">{t('tutor.tabs.orders')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="plano">
                    {isLoadingRecs ? (
                      <div className="text-center py-12">
                        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Carregando recomendações...</p>
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
                                Confiança Geral
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold text-foreground">
                                {recommendations[0]?.confidence_overall 
                                  ? `${Math.round(recommendations[0].confidence_overall * 100)}%`
                                  : '-'}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                Fonte: {recommendations[0]?.recommendation_source || 'VetGraphRAG'}
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
                                    <div className="mt-3 bg-amber-50 p-3 rounded text-sm">
                                      <p className="font-medium text-amber-800 mb-1">⚠️ Avisos:</p>
                                      {rec.warnings.map((w, i) => (
                                        <p key={i} className="text-amber-700">• {w}</p>
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
