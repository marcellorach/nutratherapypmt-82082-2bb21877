
import React from 'react';
import PanelHeader from "./outcomeManagement/PanelHeader";
import SearchBar from "./nutraceuticalManagement/SearchBar";
import OutcomeTable from "./outcomeManagement/OutcomeTable";
import OutcomeFormDialog from "./outcomeManagement/OutcomeFormDialog";
import OutcomeDeleteDialog from "./outcomeManagement/DeleteDialog";
import { useOutcomeManagement } from "./outcomeManagement/useOutcomeManagement";
import { useTranslation } from 'react-i18next';

const OutcomeManagementPanel: React.FC = () => {
  const { t } = useTranslation();
  const {
    searchTerm,
    setSearchTerm,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedOutcome,
    filteredOutcomes,
    formData,
    isLoading,
    handleEditClick,
    handleDeleteClick,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
    handleOpenCreateDialog,
    handleFormChange,
    handleFamilyChange
  } = useOutcomeManagement();

  return (
    <div className="space-y-6">
      <PanelHeader onCreateClick={handleOpenCreateDialog} />
      
      <SearchBar 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        placeholder={t('outcomeManagement.searchPlaceholder')}
      />
      
      <OutcomeTable 
        filteredOutcomes={filteredOutcomes}
        isLoading={isLoading}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
      />
      
      {/* Diálogo de criar outcome */}
      <OutcomeFormDialog
        isOpen={isCreateDialogOpen}
        setIsOpen={setIsCreateDialogOpen}
        isCreate={true}
        formData={formData}
        handleFormChange={handleFormChange}
        handleFamilyChange={handleFamilyChange}
        submitAction={handleCreateSubmit}
      />
      
      {/* Diálogo de editar outcome */}
      <OutcomeFormDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        isCreate={false}
        formData={formData}
        handleFormChange={handleFormChange}
        handleFamilyChange={handleFamilyChange}
        submitAction={handleEditSubmit}
      />
      
      {/* Diálogo de excluir outcome */}
      <OutcomeDeleteDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        name={selectedOutcome?.name || ""}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default OutcomeManagementPanel;
