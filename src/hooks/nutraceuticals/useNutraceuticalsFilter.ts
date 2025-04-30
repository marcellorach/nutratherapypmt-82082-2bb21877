
import { useState, useEffect, useMemo } from 'react';
import { Nutraceutical } from '@/types';

export const useNutraceuticalsFilter = (nutraceuticals: Nutraceutical[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEfficacy, setFilterEfficacy] = useState<number | null>(null);
  const [filterCondition, setFilterCondition] = useState<string | null>(null);

  // Filtrar nutracêuticos com base nos critérios
  const filteredNutraceuticals = useMemo(() => {
    return nutraceuticals.filter(item => {
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
  }, [nutraceuticals, searchTerm, filterEfficacy, filterCondition]);

  const clearFilters = () => {
    setFilterEfficacy(null);
    setFilterCondition(null);
    setSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    filterEfficacy,
    setFilterEfficacy,
    filterCondition,
    setFilterCondition,
    filteredNutraceuticals,
    clearFilters
  };
};
