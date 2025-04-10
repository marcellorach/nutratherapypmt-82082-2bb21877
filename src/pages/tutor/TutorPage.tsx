
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, Info, ShoppingCart } from "lucide-react";
import { owners, pets, treatmentPlans, nutraceuticals } from '@/data/mockData';

const TutorPage: React.FC = () => {
  // Simulando um tutor logado
  const tutor = owners[0];
  
  // Encontrando os pets do tutor
  const tutorPets = pets.filter(pet => pet.ownerId === tutor.id);
  
  // Estado para o pet selecionado, começa com o primeiro pet do tutor
  const [selectedPetId, setSelectedPetId] = useState(tutorPets[0]?.id || '');
  const selectedPet = tutorPets.find(pet => pet.id === selectedPetId);
  
  // Encontrando o plano de tratamento do pet selecionado
  const petPlan = treatmentPlans.find(plan => plan.petId === selectedPetId);
  
  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Olá, {tutor.name}!</h1>
          <p className="text-gray-600">Acompanhe o tratamento nutracêutico dos seus pets</p>
        </div>
        
        {tutorPets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Você não possui pets cadastrados</h3>
              <p className="text-gray-500 mb-6">Entre em contato com o seu veterinário para começar.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {tutorPets.map(pet => (
                <Button
                  key={pet.id}
                  variant={pet.id === selectedPetId ? "default" : "outline"}
                  onClick={() => setSelectedPetId(pet.id)}
                  className="flex items-center gap-2"
                >
                  {pet.species === 'Cachorro' ? '🐕' : pet.species === 'Gato' ? '🐈' : '🐾'}
                  {pet.name}
                </Button>
              ))}
            </div>
            
            {selectedPet && (
              <>
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                        {selectedPet.species === 'Cachorro' ? '🐕' : selectedPet.species === 'Gato' ? '🐈' : '🐾'}
                        {selectedPet.name}
                      </h2>
                      <p className="text-gray-600 mb-4">{selectedPet.breed} • {selectedPet.age} anos • {selectedPet.weight} kg</p>
                    </div>
                    
                    {!petPlan && (
                      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mt-4 md:mt-0">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-amber-800">Sem plano de tratamento</h3>
                            <p className="text-amber-700 text-sm">Este pet ainda não possui um plano de tratamento.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <Tabs defaultValue="plano" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="plano">Plano Terapêutico</TabsTrigger>
                    <TabsTrigger value="historico">Histórico</TabsTrigger>
                    <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="plano">
                    {petPlan ? (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Data de início
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold">{petPlan.createdAt}</p>
                              <p className="text-gray-500 text-sm">Plano ativo</p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                Status do plano
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold text-green-500">Aprovado</p>
                              <p className="text-gray-500 text-sm">Kit enviado em 10/04/2025</p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Próxima renovação
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold">10/07/2025</p>
                              <p className="text-gray-500 text-sm">Renovação trimestral</p>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-4">Nutracêuticos Recomendados</h3>
                        <div className="space-y-4">
                          {petPlan.recommendations.map(recommendation => {
                            const nutra = nutraceuticals.find(n => n.id === recommendation.nutraceuticalId);
                            if (!nutra) return null;
                            
                            return (
                              <Card key={recommendation.id} className="border-l-4 border-l-primary">
                                <CardHeader>
                                  <CardTitle>{nutra.name}</CardTitle>
                                  <CardDescription>{nutra.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="font-medium mb-1">Motivo da recomendação:</p>
                                      <p className="text-gray-600">{recommendation.reason}</p>
                                    </div>
                                    
                                    <div>
                                      <p className="font-medium mb-1">Como administrar:</p>
                                      <p className="text-gray-600">{recommendation.dosage}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <Card className="text-center py-12">
                        <CardContent>
                          <h3 className="text-xl font-semibold text-gray-700 mb-2">Sem plano terapêutico</h3>
                          <p className="text-gray-500 mb-6">Este pet ainda não possui um plano de tratamento nutracêutico.</p>
                          <Button variant="outline">
                            Agendar consulta com veterinário
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="historico">
                    <Card className="text-center py-12">
                      <CardContent>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Histórico de Tratamentos</h3>
                        <p className="text-gray-500 mb-6">O histórico de tratamentos estará disponível após o início do tratamento.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="pedidos">
                    <Card className="text-center py-12">
                      <CardContent>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Pedidos de Nutracêuticos</h3>
                        <p className="text-gray-500 mb-6">Faça pedidos de kits nutracêuticos para seu pet.</p>
                        <Button className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          Fazer Pedido
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
