
import React, { useState } from 'react';
import { NutraceuticosHeader } from './nutraceuticos/NutraceuticosHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useNutraceuticalContext } from '@/contexts/NutraceuticalContext';
import { useNutraceuticalsFilter } from '@/hooks/nutraceuticals/useNutraceuticalsFilter';

// Componentes comuns
import NutraceuticalCRUDDialog from '@/components/common/nutraceuticals/NutraceuticalCRUDDialog';
import NutraceuticalSearchFilters from '@/components/common/nutraceuticals/NutraceuticalSearchFilters';

// Componentes específicos
import NutraceuticosExpandableTable from './nutraceuticos/NutraceuticosExpandableTable';
import EvidenceLegendPanel from './nutraceuticos/table/EvidenceLegendPanel';

const NutraceuticosTab = () => {
  const { nutraceuticals, isLoading, refreshData } = useNutraceuticalContext();
  
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  const [isCRUDDialogOpen, setIsCRUDDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const [selectedConditionType, setSelectedConditionType] = useState<'prevention' | 'treatment' | 'support' | null>(null);
  
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

  const handleEditClick = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setIsCRUDDialogOpen(true);
  };

  const handleCRUDDialogClose = () => {
    setIsCRUDDialogOpen(false);
    setSelectedNutraceutical(null);
    refreshData();
  };

  const handleConditionClick = (
    nutraceutical: any, 
    condition: any, 
    conditionType: 'prevention' | 'treatment' | 'support'
  ) => {
    setSelectedCondition(condition);
    setSelectedConditionType(conditionType);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

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
    <div className="w-full max-w-full overflow-hidden">
      <NutraceuticosHeader />
      
      <div className="bg-white rounded-md shadow mb-6 w-full max-w-full">
        <NutraceuticalSearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterEfficacy={filterEfficacyString}
          setFilterEfficacy={handleSetFilterEfficacy}
          filterCondition={filterCondition || 'all'}
          setFilterCondition={setFilterCondition}
          clearFilters={clearFilters}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onAddNew={() => {
            setSelectedNutraceutical(null);
            setIsCRUDDialogOpen(true);
          }}
          mode="scientific"
        />
        
        <div className="p-6 w-full max-w-full">
          <EvidenceLegendPanel />
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="w-full max-w-full overflow-hidden">
              <NutraceuticosExpandableTable 
                nutraceuticals={filteredNutraceuticals}
                onEditClick={handleEditClick}
                onConditionClick={handleConditionClick}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Diálogo CRUD unificado */}
      <NutraceuticalCRUDDialog
        open={isCRUDDialogOpen}
        onOpenChange={setIsCRUDDialogOpen}
        nutraceutical={selectedNutraceutical}
        onSuccess={handleCRUDDialogClose}
        mode="scientific"
      />
    </div>
  );
};

export default NutraceuticosTab;
