import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useNutraceuticals } from "./useNutraceuticals";
import { useOutcomes } from "./useOutcomes";
import { useConditions } from "./useConditions";
import { useStudies } from "./useStudies";

export const useNutraceuticalPanel = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isOutcomesDialogOpen, setIsOutcomesDialogOpen] = useState(false);
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  const [filteredNutraceuticals, setFilteredNutraceuticals] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dosage: "",
    source: "",
    chemical_compound: "",
    contraindications: "",
    outcome_id: "",
    efficacy_score: 3, // Valor padrão para o score de eficácia
    notes: "", // Notas sobre a relação outcome/nutracêutico
    study_id: "" // ID do estudo selecionado
  });
  
  const [relations, setRelations] = useState<any[]>([]);

  // Hooks para carregar dados
  const { 
    nutraceuticals, 
    isLoading, 
    refreshData,
    createNutraceutical, 
    updateNutraceutical, 
    deleteNutraceutical 
  } = useNutraceuticals();
  
  const { outcomes, fetchOutcomes } = useOutcomes();
  const { conditions, fetchConditions } = useConditions();
  const { studies, fetchStudies, isLoading: studiesLoading } = useStudies();

  // Carregar dados iniciais
  useEffect(() => {
    refreshData();
    fetchOutcomes();
    fetchConditions();
    fetchStudies();
  }, []);

  // Filtrar nutracêuticos baseado no termo de busca
  useEffect(() => {
    if (!nutraceuticals) {
      setFilteredNutraceuticals([]);
      return;
    }

    const filtered = nutraceuticals.filter(nutra => {
      const matchesSearch = searchTerm === '' || 
        nutra.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nutra.description && nutra.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });

    setFilteredNutraceuticals(filtered);
  }, [nutraceuticals, searchTerm]);

  // Função para abrir o diálogo de criação
  const openCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  // Função para fechar o diálogo de criação
  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setFormData({
      name: "",
      description: "",
      dosage: "",
      source: "",
      chemical_compound: "",
      contraindications: "",
      outcome_id: "",
      efficacy_score: 3,
      notes: "",
      study_id: ""
    });
  };

  // Função para abrir o diálogo de edição
  const openEditDialog = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setFormData({
      name: nutraceutical.name || "",
      description: nutraceutical.description || "",
      dosage: nutraceutical.dosage || "",
      source: nutraceutical.source || "",
      chemical_compound: nutraceutical.chemical_compound || "",
      contraindications: nutraceutical.contraindications || "",
      outcome_id: nutraceutical.outcome?.id || "",
      efficacy_score: 3,
      notes: "",
      study_id: ""
    });
    setIsEditDialogOpen(true);
  };

  // Função para fechar o diálogo de edição
  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedNutraceutical(null);
    setFormData({
      name: "",
      description: "",
      dosage: "",
      source: "",
      chemical_compound: "",
      contraindications: "",
      outcome_id: "",
      efficacy_score: 3,
      notes: "",
      study_id: ""
    });
  };

  // Função para abrir o diálogo de exclusão
  const openDeleteDialog = (nutraceutical: any) => {
    setSelectedNutraceutical(nutraceutical);
    setIsDeleteDialogOpen(true);
  };

  // Função para fechar o diálogo de exclusão
  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedNutraceutical(null);
  };

  // Função para lidar com a criação de um novo nutracêutico
  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const dataToSubmit = {
        ...formData,
        contraindications: formData.contraindications ? [formData.contraindications] : []
      };
      await createNutraceutical(dataToSubmit);
      toast({
        title: "Sucesso",
        description: "Nutracêutico criado com sucesso."
      });
      closeCreateDialog();
      refreshData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao criar nutracêutico: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Função para lidar com a atualização de um nutracêutico existente
  const handleUpdate = async () => {
    if (!selectedNutraceutical?.id) {
      toast({
        title: "Erro",
        description: "Nenhum nutracêutico selecionado para atualizar.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const dataToSubmit = {
        ...formData,
        contraindications: formData.contraindications ? [formData.contraindications] : []
      };
      await updateNutraceutical(selectedNutraceutical.id, dataToSubmit);
      toast({
        title: "Sucesso",
        description: "Nutracêutico atualizado com sucesso."
      });
      closeEditDialog();
      refreshData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao atualizar nutracêutico: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Função para lidar com a exclusão de um nutracêutico
  const handleDelete = async () => {
    if (!selectedNutraceutical?.id) {
      toast({
        title: "Erro",
        description: "Nenhum nutracêutico selecionado para excluir.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await deleteNutraceutical(selectedNutraceutical.id);
      toast({
        title: "Sucesso",
        description: "Nutracêutico excluído com sucesso."
      });
      closeDeleteDialog();
      refreshData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao excluir nutracêutico: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return {
    // State
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
    setSelectedNutraceutical,
    filteredNutraceuticals,
    setFilteredNutraceuticals,
    isSaving,
    setIsSaving,
    selectedStudies,
    setSelectedStudies,
    formData,
    setFormData,
    relations,
    setRelations,

    // Data
    nutraceuticals,
    outcomes,
    conditions,
    studies,

    // Loading states
    isLoading,
    studiesLoading,

    // Actions
    refreshData,
    createNutraceutical,
    updateNutraceutical,
    deleteNutraceutical,
    fetchOutcomes,
    fetchConditions,
    fetchStudies,
    
    // Legacy methods for compatibility
    fetchNutraceuticals: refreshData,
    handleEditClick: () => {},
    handleDeleteClick: () => {},
    handleOutcomesClick: () => {},
    handleOpenCreateDialog: () => {},
    handleCreateSubmit: () => {},
    handleEditSubmit: () => {},
    handleDeleteConfirm: () => {},
    handleFormChange: () => {},
    handleOutcomeChange: () => {},
    handleEfficacyChange: () => {},
    handleStudyChange: () => {},
    handleAddRelation: () => {},
    handleRemoveRelation: () => {},
    handleStudiesDropped: () => {},
    getOutcomeName: () => ''
  };
};
