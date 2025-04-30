
import React from 'react';
import { NutraceuticosHeader } from './nutraceuticos/NutraceuticosHeader';
import { SearchFilters } from './nutraceuticos/SearchFilters';
import { NutraceuticosTable } from './nutraceuticos/NutraceuticosTable';
import { Skeleton } from '@/components/ui/skeleton';
import { useNutraceuticalsData } from '@/hooks/nutraceuticals/useNutraceuticalsData';
import { useNutraceuticalsFilter } from '@/hooks/nutraceuticals/useNutraceuticalsFilter';

const NutraceuticosTab: React.FC = () => {
  // Hook para carregar e gerenciar os dados dos nutracêuticos
  const { nutraceuticals, isLoading, isRefreshing, handleRefreshData } = useNutraceuticalsData();
  
  // Hook para filtrar os nutracêuticos
  const {
    searchTerm,
    setSearchTerm,
    filterEfficacy,
    setFilterEfficacy,
    filterCondition,
    setFilterCondition,
    filteredNutraceuticals,
    clearFilters
  } = useNutraceuticalsFilter(nutraceuticals);

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
        
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <NutraceuticosTable 
            nutraceuticals={filteredNutraceuticals}
          />
        )}
      </div>
    </>
  );
};

export default NutraceuticosTab;
