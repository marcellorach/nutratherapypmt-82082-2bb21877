
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNutraceuticalPanel } from "@/hooks/nutraceuticals/useNutraceuticalPanel";
import { Nutraceutical } from "./nutraceuticalManagement/types";

// Componentes refatorados
import FormDialog from "./nutraceuticalManagement/FormDialog";
import DeleteDialog from "./nutraceuticalManagement/DeleteDialog";
import NutraceuticalTable from "./nutraceuticalManagement/NutraceuticalTable";
import SearchBar from "./nutraceuticalManagement/SearchBar";
import OutcomesDialog from "./nutraceuticalManagement/OutcomesDialog";

const NutraceuticalManagementPanel: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isOutcomesDialogOpen,
    setIsOutcomesDialogOpen,
    selectedNutraceutical,
    filteredNutraceuticals,
    formData,
    relations,
    studies,
    outcomes,
    studiesLoading,
    selectedStudies,
    isLoading,
    // Handlers
    handleEditClick,
    handleDeleteClick,
    handleOutcomesClick,
    handleOpenCreateDialog,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
    handleFormChange,
    handleOutcomeChange,
    handleEfficacyChange,
    handleStudyChange,
    handleAddRelation,
    handleRemoveRelation,
    handleStudiesDropped,
    getOutcomeName,
    fetchNutraceuticals
  } = useNutraceuticalPanel();

  // Adaptar handlers para corresponder às assinaturas de tipo esperadas
  const adaptedHandleFormChange = (field: keyof Nutraceutical, value: any) => {
    handleFormChange();
  };

  const adaptedHandleOutcomeChange = (index: number, value: string) => {
    handleOutcomeChange();
  };

  const adaptedHandleEfficacyChange = (index: number, value: number) => {
    handleEfficacyChange();
  };

  const adaptedHandleStudyChange = (index: number, studyId: string, checked: boolean) => {
    handleStudyChange();
  };

  const adaptedHandleStudiesDropped = (acceptedFiles: File[], index: number) => {
    handleStudiesDropped();
  };

  const adaptedHandleRemoveRelation = (index: number, e: React.MouseEvent) => {
    handleRemoveRelation();
  };

  // Garantir que formData.contraindications seja um array
  const prepareFormData = () => {
    return {
      ...formData,
      contraindications: Array.isArray(formData.contraindications) 
        ? formData.contraindications 
        : (formData.contraindications ? [formData.contraindications] : []),
      relations: relations || []
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gerenciamento de Nutracêuticos</h3>
        <Button onClick={handleOpenCreateDialog}>
          Novo Nutracêutico
        </Button>
      </div>
      
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      
      <NutraceuticalTable 
        filteredNutraceuticals={filteredNutraceuticals}
        isLoading={isLoading}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onOutcomesClick={handleOutcomesClick}
        getOutcomeName={getOutcomeName}
      />
      
      {/* Diálogo de criar nutracêutico */}
      <FormDialog
        isOpen={isCreateDialogOpen}
        setIsOpen={setIsCreateDialogOpen}
        isCreate={true}
        formData={prepareFormData()}
        handleFormChange={adaptedHandleFormChange}
        handleOutcomeChange={adaptedHandleOutcomeChange}
        handleEfficacyChange={adaptedHandleEfficacyChange}
        handleStudyChange={adaptedHandleStudyChange}
        handleAddRelation={handleAddRelation}
        handleRemoveRelation={adaptedHandleRemoveRelation}
        submitAction={handleCreateSubmit}
        relations={relations}
        studies={studies}
        outcomes={outcomes}
        studiesLoading={studiesLoading}
        handleStudiesDropped={adaptedHandleStudiesDropped}
        selectedStudies={{0: selectedStudies || []}}
      />
      
      {/* Diálogo de editar nutracêutico */}
      <FormDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        isCreate={false}
        formData={prepareFormData()}
        handleFormChange={adaptedHandleFormChange}
        handleOutcomeChange={adaptedHandleOutcomeChange}
        handleEfficacyChange={adaptedHandleEfficacyChange}
        handleStudyChange={adaptedHandleStudyChange}
        handleAddRelation={handleAddRelation}
        handleRemoveRelation={adaptedHandleRemoveRelation}
        submitAction={handleEditSubmit}
        relations={relations}
        studies={studies}
        outcomes={outcomes}
        studiesLoading={studiesLoading}
        handleStudiesDropped={adaptedHandleStudiesDropped}
        selectedStudies={{0: selectedStudies || []}}
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
        onComplete={fetchNutraceuticals}
      />
    </div>
  );
};

export default NutraceuticalManagementPanel;
