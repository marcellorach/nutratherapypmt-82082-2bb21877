
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import ManageRelationshipsDialog from '../nutraceuticoGerenciamento/dialogs/ManageRelationshipsDialog';
import LoadingState from './table/LoadingState';
import ErrorState from './table/ErrorState';
import TableContent from './table/TableContent';
import CardHeaderComponent from './table/CardHeader';
import CardFooterComponent from './table/CardFooter';

interface NutraceuticalTableProps {
  nutraceuticals: any[];
  filteredNutraceuticals: any[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refreshData: () => void;
  handleDeleteClick: (id: string) => void;
  hasMigratedData: boolean;
  openMigratorDialog: () => void;
  onEditClick?: (nutraceutical: any) => void;
}

const NutraceuticalTable: React.FC<NutraceuticalTableProps> = ({
  nutraceuticals,
  filteredNutraceuticals,
  isLoading,
  error,
  searchTerm,
  setSearchTerm,
  refreshData,
  handleDeleteClick,
  hasMigratedData,
  openMigratorDialog,
  onEditClick
}) => {
  // Estado para linhas expandidas
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Estado para o diálogo de gerenciamento de relações
  const [isRelationshipsDialogOpen, setIsRelationshipsDialogOpen] = useState(false);
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  
  // Função para alternar a expansão de uma linha
  const toggleRowExpansion = (nutraId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [nutraId]: !prev[nutraId]
    }));
  };
  
  // Função para abrir o diálogo de gerenciamento de relações
  const handleManageRelationships = (nutra: any) => {
    setSelectedNutraceutical(nutra);
    setIsRelationshipsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardHeaderComponent
          refreshData={refreshData}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          hasMigratedData={hasMigratedData}
          openMigratorDialog={openMigratorDialog}
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={refreshData} />
        ) : (
          <TableContent
            filteredNutraceuticals={filteredNutraceuticals}
            expandedRows={expandedRows}
            toggleRowExpansion={toggleRowExpansion}
            onEditClick={onEditClick}
            onDeleteClick={handleDeleteClick}
            onManageRelationships={handleManageRelationships}
          />
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <CardFooterComponent
          filteredCount={filteredNutraceuticals.length}
          totalCount={nutraceuticals.length}
        />
      </CardFooter>

      {/* Diálogo para gerenciar relações (estudos e outcomes) */}
      {selectedNutraceutical && (
        <ManageRelationshipsDialog
          open={isRelationshipsDialogOpen}
          onOpenChange={setIsRelationshipsDialogOpen}
          nutraceutical={selectedNutraceutical}
          onSuccess={refreshData}
          initialTab="outcomes"
        />
      )}
    </Card>
  );
};

export default NutraceuticalTable;
