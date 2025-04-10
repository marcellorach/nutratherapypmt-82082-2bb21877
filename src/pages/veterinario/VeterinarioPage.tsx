
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from "lucide-react";
import PetCard from '@/components/pet/PetCard';
import { pets, generateRandomData } from '@/data';
import { Pet } from '@/types';
import RecommendationsList from './RecommendationsList';

const VeterinarioPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  // Filtrar apenas cães
  const allDogs = pets.filter(pet => pet.species === 'Cachorro');
  
  // Função para filtrar pets com base na pesquisa
  const filteredPets = allDogs.filter(pet => 
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pet.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelectPet = (pet: Pet) => {
    setSelectedPet(pet);
    setShowRecommendations(true);
  };
  
  const handleBackToPets = () => {
    setShowRecommendations(false);
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
          
          {!showRecommendations && (
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
          )}
        </div>
        
        {showRecommendations ? (
          <>
            <Button 
              variant="ghost" 
              onClick={handleBackToPets}
              className="mb-6"
            >
              ← Voltar para lista de pacientes
            </Button>
            <RecommendationsList selectedPet={selectedPet} />
          </>
        ) : (
          <div className="space-y-6">
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
                  onViewDetails={handleSelectPet}
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
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VeterinarioPage;
