
import React, { useState } from 'react';
import { NutraceuticosHeader } from './nutraceuticos/NutraceuticosHeader';
import { SearchFilters } from './nutraceuticos/SearchFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { useNutraceuticalsData } from '@/hooks/nutraceuticals/useNutraceuticalsData';
import { useNutraceuticalsFilter } from '@/hooks/nutraceuticals/useNutraceuticalsFilter';
import AddNutraceuticalDialog from './pesquisa/nutraceuticoGerenciamento/dialogs/AddNutraceuticalDialog';
import NutraceuticosExpandableTable from './nutraceuticos/NutraceuticosExpandableTable';
import EvidenceLegendPanel from './nutraceuticos/table/EvidenceLegendPanel';

const NutraceuticosTab = () => {
  // Hook para carregar e gerenciar os dados dos nutracêuticos
  const { nutraceuticals, isLoading, isRefreshing, handleRefreshData } = useNutraceuticalsData();
  
  // Estados para gerenciar o diálogo de edição
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Estado para armazenar a condição selecionada (para possível diálogo de detalhes)
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const [selectedConditionType, setSelectedConditionType] = useState<'prevention' | 'treatment' | 'support' | null>(null);
  
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
    console.log("Editar nutracêutico:", nutraceutical);
    setSelectedNutraceutical(nutraceutical);
    setIsEditDialogOpen(true);
  };

  // Handler para quando o diálogo de edição é fechado
  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    handleRefreshData();
  };

  // Handler para quando uma condição é clicada
  const handleConditionClick = (
    nutraceutical: any, 
    condition: any, 
    conditionType: 'prevention' | 'treatment' | 'support'
  ) => {
    console.log(`Condição de ${conditionType} clicada:`, condition);
    setSelectedCondition(condition);
    setSelectedConditionType(conditionType);
    // Aqui poderíamos abrir um diálogo com detalhes da condição se necessário
  };

  // Converter o valor numérico para string ao passar para o componente SearchFilters
  const filterEfficacyString = filterEfficacy !== null 
    ? (typeof filterEfficacy === 'number' ? filterEfficacy.toString() : filterEfficacy) 
    : '';
    
  const handleSetFilterEfficacy = (value: string) => {
    if (value === '' || value === 'all') {
      setFilterEfficacy(null);
    } else if (value === 'high') {
      setFilterEfficacy(4);
    } else if (value === 'medium') {
      setFilterEfficacy(3);
    } else if (value === 'low') {
      setFilterEfficacy(2);
    } else {
      setFilterEfficacy(parseInt(value, 10) || null);
    }
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
          filterCondition={filterCondition || 'all'}
          setFilterCondition={setFilterCondition}
          clearFilters={clearFilters}
          onRefresh={handleRefreshData}
          isRefreshing={isRefreshing}
          onAddNewClick={() => {
            setSelectedNutraceutical(null);
            setIsEditDialogOpen(true);
          }}
        />
        
        <div className="p-6">
          <EvidenceLegendPanel />
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <NutraceuticosExpandableTable 
              nutraceuticals={filteredNutraceuticals}
              onEditClick={handleEditClick}
              onConditionClick={handleConditionClick}
            />
          )}
        </div>
      </div>
      
      {/* Diálogo unificado para adicionar/editar nutracêutico incluindo gestão de condições e estudos */}
      <AddNutraceuticalDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        nutraceutical={selectedNutraceutical}
        onSuccess={handleEditDialogClose}
      />
    </>
  );
};

export default NutraceuticosTab;
