
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useOutcomes } from "@/hooks/nutraceuticals/useOutcomes";
import SearchBar from "./nutraceuticalManagement/SearchBar";
import OutcomeTable from "./outcomeManagement/OutcomeTable";
import OutcomeFormDialog from "./outcomeManagement/OutcomeFormDialog";
import OutcomeDeleteDialog from "./outcomeManagement/DeleteDialog";

const OutcomeManagementPanel: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<any>(null);
  const [filteredOutcomes, setFilteredOutcomes] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Hooks para carregar dados
  const { outcomes, isLoading, fetchOutcomes, createOutcome, updateOutcome, deleteOutcome } = useOutcomes();

  // Carregar dados iniciais
  useEffect(() => {
    fetchOutcomes();
  }, []);

  // Filtrar outcomes quando mudar a pesquisa ou os dados
  useEffect(() => {
    if (outcomes) {
      setFilteredOutcomes(
        outcomes.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [searchTerm, outcomes]);

  // Handler para abrir o diálogo de edição
  const handleEditClick = (outcome: any) => {
    setSelectedOutcome(outcome);
    setFormData({
      name: outcome.name || "",
      description: outcome.description || "",
    });
    setIsEditDialogOpen(true);
  };

  // Handler para abrir o diálogo de exclusão
  const handleDeleteClick = (outcome: any) => {
    setSelectedOutcome(outcome);
    setIsDeleteDialogOpen(true);
  };

  // Handler para criar novo outcome
  const handleCreateSubmit = async () => {
    try {
      await createOutcome({
        name: formData.name,
        description: formData.description
      });

      toast({
        title: "Sucesso",
        description: "Outcome criado com sucesso",
      });
      
      setIsCreateDialogOpen(false);
      resetFormData();
      fetchOutcomes();
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o outcome",
        variant: "destructive",
      });
    }
  };

  // Handler para editar outcome
  const handleEditSubmit = async () => {
    if (!selectedOutcome) return;
    
    try {
      await updateOutcome(selectedOutcome.id, {
        name: formData.name,
        description: formData.description,
      });

      toast({
        title: "Sucesso",
        description: "Outcome atualizado com sucesso",
      });
      
      setIsEditDialogOpen(false);
      fetchOutcomes();
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o outcome",
        variant: "destructive",
      });
    }
  };

  // Handler para excluir outcome
  const handleDeleteConfirm = async () => {
    if (!selectedOutcome) return;
    
    try {
      await deleteOutcome(selectedOutcome.id);

      toast({
        title: "Sucesso",
        description: "Outcome excluído com sucesso",
      });
      
      setIsDeleteDialogOpen(false);
      fetchOutcomes();
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o outcome",
        variant: "destructive",
      });
    }
  };

  // Resetar dados do formulário
  const resetFormData = () => {
    setFormData({
      name: "",
      description: "",
    });
  };

  // Handler para abrir diálogo de criação
  const handleOpenCreateDialog = () => {
    resetFormData();
    setIsCreateDialogOpen(true);
  };

  // Handler para alterar dados do formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gerenciamento de Outcomes</h3>
        <Button onClick={handleOpenCreateDialog}>
          Novo Outcome
        </Button>
      </div>
      
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      
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
        submitAction={handleCreateSubmit}
      />
      
      {/* Diálogo de editar outcome */}
      <OutcomeFormDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        isCreate={false}
        formData={formData}
        handleFormChange={handleFormChange}
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
