
import React, { useState } from 'react';
import { nutraceuticals } from '@/data';
import { NutraceuticosHeader } from './nutraceuticos/NutraceuticosHeader';
import { SearchFilters } from './nutraceuticos/SearchFilters';
import { NutraceuticosTable } from './nutraceuticos/NutraceuticosTable';
import { Nutraceutical } from '@/types';

const NutraceuticosTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEfficacy, setFilterEfficacy] = useState<number | null>(null);
  const [filterCondition, setFilterCondition] = useState<string | null>(null);

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
        />
        
        <NutraceuticosTable 
          nutraceuticals={filteredNutraceuticals}
        />
      </div>
    </>
  );
};

export default NutraceuticosTab;
