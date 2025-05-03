
import React, { useState } from 'react';
import { NutraceuticosHeader } from './nutraceuticos/NutraceuticosHeader';
import { SearchFilters } from './nutraceuticos/SearchFilters';
import { NutraceuticosTable } from './nutraceuticos/NutraceuticosTable';
import { Skeleton } from '@/components/ui/skeleton';
import { useNutraceuticalsData } from '@/hooks/nutraceuticals/useNutraceuticalsData';
import { useNutraceuticalsFilter } from '@/hooks/nutraceuticals/useNutraceuticalsFilter';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ManageRelationshipsDialog from './pesquisa/nutraceuticoGerenciamento/dialogs/ManageRelationshipsDialog';

const NutraceuticosTab: React.FC = () => {
  // Hook para carregar e gerenciar os dados dos nutracêuticos
  const { nutraceuticals, isLoading, isRefreshing, handleRefreshData } = useNutraceuticalsData();
  
  // Estados para gerenciar o diálogo de relações
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  const [isRelationsDialogOpen, setIsRelationsDialogOpen] = useState(false);
  
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

  // Handler para quando um nutraceutico é selecionado para gerenciar relações
  const handleManageRelations = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setIsRelationsDialogOpen(true);
  };

  // Handler para quando o diálogo de relações é fechado
  const handleRelationsDialogClose = () => {
    setIsRelationsDialogOpen(false);
    handleRefreshData();
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
        
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <NutraceuticosTable 
            nutraceuticals={filteredNutraceuticals}
            onManageRelations={handleManageRelations}
          />
        )}
      </div>
      
      {/* Diálogo para gerenciar relações */}
      <ManageRelationshipsDialog
        open={isRelationsDialogOpen}
        onOpenChange={setIsRelationsDialogOpen}
        nutraceutical={selectedNutraceutical}
        onSuccess={handleRelationsDialogClose}
      />
    </>
  );
};

export default NutraceuticosTab;
