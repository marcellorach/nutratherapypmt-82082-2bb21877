
import React, { useState } from 'react';
import { NutraceuticosHeader } from './nutraceuticos/NutraceuticosHeader';
import { SearchFilters } from './nutraceuticos/SearchFilters';
import { NutraceuticosTable } from './nutraceuticos/NutraceuticosTable';
import { Skeleton } from '@/components/ui/skeleton';
import { useNutraceuticalsData } from '@/hooks/nutraceuticals/useNutraceuticalsData';
import { useNutraceuticalsFilter } from '@/hooks/nutraceuticals/useNutraceuticalsFilter';
import AddNutraceuticalDialog from './pesquisa/nutraceuticoGerenciamento/dialogs/AddNutraceuticalDialog';

const NutraceuticosTab: React.FC = () => {
  // Hook para carregar e gerenciar os dados dos nutracêuticos
  const { nutraceuticals, isLoading, isRefreshing, handleRefreshData } = useNutraceuticalsData();
  
  // Estados para gerenciar o diálogo de edição
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
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

  // Handler para quando um nutraceutico é selecionado para edição
  const handleEditClick = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setIsEditDialogOpen(true);
  };

  // Handler para quando o diálogo de edição é fechado
  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    handleRefreshData();
  };

  // Converter o valor numérico para string ao passar para o componente SearchFilters
  const filterEfficacyString = filterEfficacy !== null ? filterEfficacy.toString() : '';
  const handleSetFilterEfficacy = (value: string) => {
    setFilterEfficacy(value === '' ? null : parseInt(value, 10));
  };

  return (
    <>
      <NutraceuticosHeader />
      
      <div className="bg-white rounded-md shadow mb-6">
        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterEfficacy={filterEfficacyString}
          setFilterEfficacy={handleSetFilterEfficacy}
          filterCondition={filterCondition}
          setFilterCondition={setFilterCondition}
          clearFilters={clearFilters}
          onRefresh={handleRefreshData}
          isRefreshing={isRefreshing}
          onAddNewClick={() => {
            setSelectedNutraceutical(null);
            setIsEditDialogOpen(true);
          }}
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
            onEditClick={handleEditClick}
          />
        )}
      </div>
      
      {/* Diálogo para adicionar/editar nutracêutico */}
      <AddNutraceuticalDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleEditDialogClose}
      />
    </>
  );
};

export default NutraceuticosTab;
