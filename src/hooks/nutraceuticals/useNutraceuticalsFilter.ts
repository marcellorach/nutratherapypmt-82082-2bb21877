
import { useState, useEffect, useMemo } from 'react';
import { Nutraceutical } from '@/types';

export const useNutraceuticalsFilter = (nutraceuticals: Nutraceutical[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEfficacy, setFilterEfficacy] = useState<number | null>(null);
  const [filterCondition, setFilterCondition] = useState<string | null>(null);

  // Filtrar nutracêuticos com base nos critérios
  const filteredNutraceuticals = useMemo(() => {
    return nutraceuticals.filter(item => {
      // Filtro de pesquisa por texto
      const matchesSearch = searchTerm === '' || (
        (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.chemicalCompound && item.chemicalCompound.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      // Filtro por nível de eficácia
      let matchesEfficacy = true;
      if (filterEfficacy !== null) {
        if (!item.scientificEvidence) {
          matchesEfficacy = false;
        } else {
          const score = item.scientificEvidence.efficacyScore;
          if (filterEfficacy === 4) {
            matchesEfficacy = score >= 4; // Alta (4-5)
          } else if (filterEfficacy === 3) {
            matchesEfficacy = score >= 3 && score < 4; // Média (3)
          } else {
            matchesEfficacy = score < 3; // Baixa (1-2)
          }
        }
      }
      
      // Filtro por condição
      const matchesCondition = !filterCondition || filterCondition === 'all' || 
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
