
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNutraceuticalContext } from '@/contexts/NutraceuticalContext';
import { useToast } from '@/hooks/use-toast';

// Componentes comuns
import NutraceuticalCRUDDialog from '@/components/common/nutraceuticals/NutraceuticalCRUDDialog';
import NutraceuticalSearchFilters from '@/components/common/nutraceuticals/NutraceuticalSearchFilters';

// Componentes específicos
import NutraceuticalTable from "./nutraceuticalManagement/NutraceuticalTable";
import DeleteDialog from "./nutraceuticalManagement/DeleteDialog";
import OutcomesDialog from "./nutraceuticalManagement/OutcomesDialog";

const NutraceuticalManagementPanel: React.FC = () => {
  const { toast } = useToast();
  const {
    nutraceuticals,
    isLoading,
    refreshData,
    deleteNutraceutical,
    outcomes
  } = useNutraceuticalContext();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCRUDDialogOpen, setIsCRUDDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isOutcomesDialogOpen, setIsOutcomesDialogOpen] = useState(false);
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  
  // Filtrar nutracêuticos baseado no termo de busca
  const filteredNutraceuticals = nutraceuticals.filter(nutra => {
    const matchesSearch = searchTerm === '' || 
      nutra.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (nutra.description && nutra.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const handleEditClick = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setIsCRUDDialogOpen(true);
  };

  const handleDeleteClick = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setIsDeleteDialogOpen(true);
  };

  const handleOutcomesClick = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setIsOutcomesDialogOpen(true);
  };

  const handleOpenCreateDialog = () => {
    setSelectedNutraceutical(null);
    setIsCRUDDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedNutraceutical?.id) return;

    try {
      await deleteNutraceutical(selectedNutraceutical.id);
      toast({
        title: "Sucesso",
        description: "Nutracêutico excluído com sucesso."
      });
      setIsDeleteDialogOpen(false);
      setSelectedNutraceutical(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao excluir nutracêutico: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const getOutcomeName = (outcomeId: string | null) => {
    if (!outcomeId) return "Sem categoria";
    const outcome = outcomes.find(o => o.id === outcomeId);
    return outcome?.name || "Categoria não encontrada";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gerenciamento de Nutracêuticos</h3>
        <Button onClick={handleOpenCreateDialog}>
          Novo Nutracêutico
        </Button>
      </div>
      
      <NutraceuticalSearchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onRefresh={refreshData}
        onAddNew={handleOpenCreateDialog}
        mode="admin"
      />
      
      <NutraceuticalTable 
        filteredNutraceuticals={filteredNutraceuticals}
        isLoading={isLoading}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onOutcomesClick={handleOutcomesClick}
        getOutcomeName={getOutcomeName}
      />
      
      {/* Diálogo CRUD unificado */}
      <NutraceuticalCRUDDialog
        open={isCRUDDialogOpen}
        onOpenChange={setIsCRUDDialogOpen}
        nutraceutical={selectedNutraceutical}
        onSuccess={() => {
          setIsCRUDDialogOpen(false);
          refreshData();
        }}
        mode="admin"
      />
      
      {/* Diálogo de excluir nutracêutico */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        name={selectedNutraceutical?.name || ""}
        onConfirm={handleDeleteConfirm}
      />
      
      {/* Diálogo de gerenciar outcomes */}
      <OutcomesDialog
        isOpen={isOutcomesDialogOpen}
        setIsOpen={setIsOutcomesDialogOpen}
        nutraceutical={selectedNutraceutical}
        onComplete={refreshData}
      />
    </div>
  );
};

export default NutraceuticalManagementPanel;
