
import React, { useState } from 'react';
import { nutraceuticals } from '@/data';
import { NutraceuticosHeader } from './nutraceuticos/NutraceuticosHeader';
import { SearchFilters } from './nutraceuticos/SearchFilters';
import { NutraceuticosTable } from './nutraceuticos/NutraceuticosTable';
import { Nutraceutical } from '@/types';
import { useToast } from '@/hooks/use-toast';

const NutraceuticosTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEfficacy, setFilterEfficacy] = useState<number | null>(null);
  const [filterCondition, setFilterCondition] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Filtrar nutracêuticos com base nos critérios
  const filteredNutraceuticals = nutraceuticals.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.chemicalCompound.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEfficacy = 
      filterEfficacy === null || 
      Math.floor(item.scientificEvidence.efficacyScore) === filterEfficacy;
    
    const matchesCondition = 
      filterCondition === null ||
      item.condition === filterCondition;
    
    return matchesSearch && matchesEfficacy && matchesCondition;
  });

  const clearFilters = () => {
    setFilterEfficacy(null);
    setFilterCondition(null);
    setSearchTerm('');
  };

  // Função para simular atualização de dados
  const handleRefreshData = () => {
    setIsRefreshing(true);
    
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Dados atualizados",
        description: "A lista de nutracêuticos foi atualizada com sucesso."
      });
    }, 1000);
  };

  return (
    <>
      <NutraceuticosHeader />
      
      <div className="bg-white rounded-md shadow mb-6">
        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterEfficacy={filterEfficacy}
          setFilterEfficacy={setFilterEfficacy}
          filterCondition={filterCondition}
          setFilterCondition={setFilterCondition}
          clearFilters={clearFilters}
          onRefresh={handleRefreshData}
          isRefreshing={isRefreshing}
        />
        
        <NutraceuticosTable 
          nutraceuticals={filteredNutraceuticals}
        />
      </div>
    </>
  );
};

export default NutraceuticosTab;
