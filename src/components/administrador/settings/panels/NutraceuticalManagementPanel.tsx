
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNutraceuticalPanel } from "@/hooks/nutraceuticals/useNutraceuticalPanel";

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
        formData={formData}
        handleFormChange={handleFormChange}
        handleOutcomeChange={handleOutcomeChange}
        handleEfficacyChange={handleEfficacyChange}
        handleStudyChange={handleStudyChange}
        handleAddRelation={handleAddRelation}
        handleRemoveRelation={handleRemoveRelation}
        submitAction={handleCreateSubmit}
        relations={relations}
        studies={studies}
        outcomes={outcomes}
        studiesLoading={studiesLoading}
        handleStudiesDropped={handleStudiesDropped}
        selectedStudies={selectedStudies}
      />
      
      {/* Diálogo de editar nutracêutico */}
      <FormDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        isCreate={false}
        formData={formData}
        handleFormChange={handleFormChange}
        handleOutcomeChange={handleOutcomeChange}
        handleEfficacyChange={handleEfficacyChange}
        handleStudyChange={handleStudyChange}
        handleAddRelation={handleAddRelation}
        handleRemoveRelation={handleRemoveRelation}
        submitAction={handleEditSubmit}
        relations={relations}
        studies={studies}
        outcomes={outcomes}
        studiesLoading={studiesLoading}
        handleStudiesDropped={handleStudiesDropped}
        selectedStudies={selectedStudies}
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
