
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useOutcomes } from "@/hooks/nutraceuticals/useOutcomes";

export const useOutcomeManagement = () => {
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
    family_id: ""
  });

  // Hooks para carregar dados
  const { outcomes, isLoading, fetchOutcomes, createOutcome, updateOutcome, deleteOutcome } = useOutcomes();

  // Carregar dados iniciais
  useEffect(() => {
    fetchOutcomes();
  }, [fetchOutcomes]);

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
      family_id: outcome.family_id || ""
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
        description: formData.description,
        family_id: formData.family_id || undefined
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
        family_id: formData.family_id || undefined
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
      family_id: ""
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

  // Handler para alterar família
  const handleFamilyChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      family_id: value
    }));
  };

  return {
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
  };
};
