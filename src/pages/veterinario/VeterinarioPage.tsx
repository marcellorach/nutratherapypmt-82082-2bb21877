
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, FileText, PieChart, Filter } from "lucide-react";
import DashboardCard from '@/components/dashboard/DashboardCard';
import NutraceuticalEfficacy from '@/components/charts/NutraceuticalEfficacy';
import PetCard from '@/components/pet/PetCard';
import { pets, nutraceuticals, generateRandomData } from '@/data/mockData';
import { Pet } from '@/types';
import RecommendationsList from './RecommendationsList';

const VeterinarioPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  
  // Dados para o gráfico
  const efficacyData = nutraceuticals.map(item => ({
    name: item.name,
    score: item.scientificEvidence.score,
    contraindications: item.contraindications.length
  }));
  
  // Função para filtrar pets com base na pesquisa
  const filteredPets = pets.filter(pet => 
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pet.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelectPet = (pet: Pet) => {
    setSelectedPet(pet);
  };
  
  // Ordenar os pets por dias pendentes de revisão (prioridade mais alta primeiro)
  const sortedPets = [...filteredPets].sort((a, b) => {
    // Primeiro ordenar por dias de revisão
    const daysA = a.reviewDays !== undefined ? a.reviewDays : 999;
    const daysB = b.reviewDays !== undefined ? b.reviewDays : 999;
    return daysA - daysB;
  });

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Portal do Veterinário</h1>
            <p className="text-gray-600">Gerencie dados clínicos e obtenha recomendações personalizadas</p>
          </div>
          
          <div className="flex gap-4 mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar pet..."
                className="w-64 pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Pet
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="pets" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pets">Pets</TabsTrigger>
            <TabsTrigger value="recomendacoes">Recomendações</TabsTrigger>
            <TabsTrigger value="analises">Análises</TabsTrigger>
            <TabsTrigger value="consulta-ia">Consulta IA</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pets" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-700">
                {filteredPets.length} {filteredPets.length === 1 ? 'paciente encontrado' : 'pacientes encontrados'}
              </p>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter size={16} />
                Filtrar
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedPets.map((pet) => (
                <PetCard 
                  key={pet.id}
                  pet={pet}
                  onSelect={handleSelectPet}
                  onViewDetails={() => {}} // Implementar posteriormente
                />
              ))}
              
              {filteredPets.length === 0 && (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500">Nenhum pet encontrado com esse termo.</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                onClick={() => generateRandomData()}
                className="text-gray-700"
              >
                Gerar dados aleatórios para exemplo
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="recomendacoes">
            <RecommendationsList selectedPet={selectedPet} />
          </TabsContent>
          
          <TabsContent value="analises">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardCard
                title="Eficácia dos Nutracêuticos"
                description="Análise comparativa da eficácia dos nutracêuticos e suas contraindicações"
                className="col-span-1 lg:col-span-2"
              >
                <NutraceuticalEfficacy data={efficacyData} />
              </DashboardCard>
              
              <DashboardCard
                title="Distribuição por Tipo"
                description="Distribuição dos nutracêuticos por categoria"
              >
                <div className="h-64 flex items-center justify-center">
                  <PieChart className="h-32 w-32 text-gray-300" />
                  <p className="text-gray-500 text-center">
                    Gráfico de distribuição por categorias (a implementar)
                  </p>
                </div>
              </DashboardCard>
              
              <DashboardCard
                title="Estudos Científicos"
                description="Últimos estudos científicos adicionados"
              >
                <div className="h-64 flex items-center justify-center">
                  <FileText className="h-32 w-32 text-gray-300" />
                  <p className="text-gray-500 text-center">
                    Sumário dos estudos científicos (a implementar)
                  </p>
                </div>
              </DashboardCard>
            </div>
          </TabsContent>
          
          <TabsContent value="consulta-ia">
            <DashboardCard
              title="Consulta à IA"
              description="Converse com a IA para obter recomendações personalizadas"
            >
              <div className="bg-gray-100 rounded-lg p-4 h-80 mb-4">
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 text-center">
                    Interface de conversação com a IA (a implementar)
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Digite sua pergunta para a IA..."
                  className="flex-grow" 
                  disabled
                />
                <Button disabled>Enviar</Button>
              </div>
            </DashboardCard>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default VeterinarioPage;
